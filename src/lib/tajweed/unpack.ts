/**
 * Precomputed annotation reader.
 *
 * Expands the packed spans for one ayah into the same shape `analyze` returns.
 * This is a small reader — it runs no matching, no normalisation, no regex.
 *
 * Ported from @tajweed/core (MIT) — see data/tajweed/LICENSE-engine.txt
 */

import type { Annotations, Corpus, Span } from './types'

interface Lineage {
  readonly hukumId: string
  readonly categoryId: string
  readonly topicId: string
}

const lineageCache = new WeakMap<Corpus, Map<string, Lineage>>()

function lineageIndex(corpus: Corpus): Map<string, Lineage> {
  let cached = lineageCache.get(corpus)
  if (cached) return cached

  const categoryById = new Map(corpus.categories.map((c) => [c.id, c]))
  const hukumById = new Map(corpus.hukums.map((h) => [h.id, h]))

  cached = new Map()
  for (const rule of corpus.rules) {
    const hukum = hukumById.get(rule.hukum)
    const category = hukum ? categoryById.get(hukum.category) : undefined
    if (!hukum || !category) continue
    cached.set(rule.id, {
      hukumId: hukum.id,
      categoryId: category.id,
      topicId: category.topic,
    })
  }

  lineageCache.set(corpus, cached)
  return cached
}

/**
 * Expands the packed spans for one ayah into full Span objects.
 * @param reference e.g. "2:255"
 */
export function unpack(annotations: Annotations, corpus: Corpus, reference: string): Span[] {
  const packed = annotations.spans[reference]
  if (!packed) return []

  const lineage = lineageIndex(corpus)

  return packed.map(([start, end, ruleIndex]) => {
    const ruleId = annotations.ruleIds[ruleIndex]
    if (ruleId === undefined) {
      throw new Error(
        `Annotations for ${reference} reference rule index ${ruleIndex}, ` +
          `but only ${annotations.ruleIds.length} rule ids are declared.`,
      )
    }
    const found = lineage.get(ruleId)
    if (!found) {
      throw new Error(
        `Annotations reference rule ${ruleId}, which is not in corpus ` +
          `v${corpus.version}. These annotations were computed against ` +
          `v${annotations.corpusVersion}.`,
      )
    }
    return { start, end, ruleId, ...found }
  })
}

/**
 * Priority for hukum IDs — lower number = higher priority = preferred when
 * spans overlap. More specific rulings (e.g. madd lazim, 6 counts) should win
 * over generic ones (e.g. madd tabi'i, 2 counts) when they cover the same
 * letters.
 *
 * The engine produces overlapping spans deliberately — a single letter can
 * demonstrate multiple rulings. This priority system picks the most
 * specific/important one for display.
 */
function hukumPriority(hukumId: string): number {
  // Madd — necessary (6 counts) is most specific
  if (hukumId.startsWith('madd-lazim')) return 1
  // Madd — obligatory connected (4-5 counts)
  if (hukumId === 'madd-muttasil') return 2
  // Madd — permissible separated (2-4-5 counts)
  if (hukumId === 'madd-munfasil') return 3
  // Madd — connecting
  if (hukumId === 'madd-silah-sughra') return 4
  // Madd — substitute / compensation / special alefs
  if (hukumId === 'madd-badal' || hukumId === 'madd-iwad' ||
      hukumId === 'seven-alefs' || hukumId === 'seven-alefs-khulf') return 5
  // Madd — natural (2 counts) and leen (soft) are least specific
  if (hukumId === 'madd-tabee-kalimi' || hukumId === 'leen-waw' ||
      hukumId === 'leen-yaa') return 6

  // Qalqalah — major (at pause) is more specific than minor
  if (hukumId === 'qalqalah-kubra') return 2
  if (hukumId === 'qalqalah-mutatarrifa') return 3
  if (hukumId === 'qalqalah-sughra') return 4

  // Noon/tanween — idgham and iqlab are more specific than izhar
  if (hukumId.startsWith('idgham')) return 3
  if (hukumId.startsWith('iqlab')) return 3
  if (hukumId.startsWith('ikhfa')) return 4
  if (hukumId.startsWith('izhar')) return 5

  // Default: middle priority
  return 3
}

/**
 * Reduces overlapping spans to a single non-overlapping layer.
 *
 * Unlike the original quranpedia resolver (which keeps the earliest-starting
 * span), this version prefers the most SPECIFIC ruling when spans overlap.
 * This prevents a generic "natural madd" from hiding a more specific
 * "necessary madd" on the same letters — the specific ruling is the one a
 * reciter needs to see.
 */
export function resolveOverlaps(spans: readonly Span[]): Span[] {
  // Sort by priority (most specific first), then by start, then by length
  const ordered = [...spans].sort((a, b) => {
    const pa = hukumPriority(a.hukumId)
    const pb = hukumPriority(b.hukumId)
    if (pa !== pb) return pa - pb
    if (a.start !== b.start) return a.start - b.start
    return b.end - a.end
  })

  const kept: Span[] = []
  for (const span of ordered) {
    // Keep this span only if it doesn't overlap with any already-kept span
    const overlaps = kept.some((k) => span.start < k.end && k.start < span.end)
    if (!overlaps) {
      kept.push(span)
    }
  }

  // Sort result by start position for rendering
  kept.sort((a, b) => a.start - b.start)
  return kept
}

/** Extracts the text a span covers, correctly for any code point. */
export function sliceSpan(ayahText: string, span: { start: number; end: number }): string {
  return Array.from(ayahText).slice(span.start, span.end).join('')
}
