/**
 * High-level service that combines the vendored corpus, precomputed annotations,
 * and edition text to provide tajweed data for the UI.
 *
 * This replaces the old SQLite-based word-level `<rule>` tag parsing with the
 * quranpedia scholar-authored 182-rule corpus and precomputed spans.
 */

import { getCorpus } from './corpus'
import { getAnnotations } from './annotations'
import { getAyahText } from './edition'
import { unpack, resolveOverlaps, sliceSpan } from './unpack'
import type { Corpus, Span } from './types'
import { TOPIC_COLORS } from './colors'
import { TOPIC_LABELS_EN as TOPIC_LABELS_EN_FULL, HUKUM_LABELS_EN, RULE_LABELS_EN } from './translations'

// Re-export for convenience
export { TOPIC_COLORS }
export { TOPIC_LABELS_EN as TOPIC_LABELS_EN } from './translations'
export { HUKUM_LABELS_EN } from './translations'
export { RULE_LABELS_EN } from './translations'
export type { Span, Corpus }

export interface EngineTajweedRule {
  class: string // topic ID, e.g. "madd", "qalqalah"
  text: string
  startIndex: number
  endIndex: number
  ruleId: string
  hukumId: string
  categoryId: string
  topicId: string
  // Pre-resolved labels from the corpus, so the client doesn't need to load rules.json
  hukumLabel: string // e.g. "المد الطبيعي الكلمي"
  ruleLabel: string // e.g. "الألف الساكنة المسبوقة بحرف مفتوح"
  topicLabel: string // e.g. "المد"
  // English translations
  hukumLabelEn: string // e.g. "Natural Madd (Madd Tabi'i — 2 counts)"
  topicLabelEn: string // e.g. "Prolongation (Madd)"
  ruleLabelEn: string   // e.g. "Sukoon alef preceded by a fatha letter (except open hamza)"
}

export interface EngineTajweedWord {
  id: number
  location: string
  surah: number
  ayah: number
  word: number
  text: string
  tajweedRules: EngineTajweedRule[]
}

export interface AyahTajweedData {
  text: string
  spans: Span[]
  words: EngineTajweedWord[]
}

let corpusCache: Corpus | null = null

function corpus(): Corpus {
  if (!corpusCache) corpusCache = getCorpus()
  return corpusCache
}

/**
 * Returns the full ayah text and resolved (non-overlapping) spans for `surah:ayah`.
 * The text is the Uthmani Hafs edition that the precomputed spans are aligned to.
 */
export function getAyahTajweed(surah: number, ayah: number): AyahTajweedData {
  const text = getAyahText(surah, ayah)
  const rawSpans = unpack(getAnnotations(), corpus(), `${surah}:${ayah}`)
  const spans = resolveOverlaps(rawSpans)
  const words = splitIntoWords(text, spans, surah, ayah)
  return { text, spans, words }
}

/**
 * Splits the ayah text into words by whitespace and maps ayah-level spans
 * to word-level positions, producing data compatible with TajweedAyahText.
 */
function splitIntoWords(
  ayahText: string,
  spans: readonly Span[],
  surah: number,
  ayah: number,
): EngineTajweedWord[] {
  const codePoints = Array.from(ayahText)

  // Find word boundaries by splitting on spaces (preserving code-point offsets)
  const wordRanges: { start: number; end: number }[] = []
  let wordStart = -1

  for (let i = 0; i < codePoints.length; i++) {
    const ch = codePoints[i]
    if (ch === ' ' || ch === '\u00A0' || ch === '\u200F') {
      if (wordStart >= 0) {
        wordRanges.push({ start: wordStart, end: i })
        wordStart = -1
      }
    } else {
      if (wordStart < 0) wordStart = i
    }
  }
  if (wordStart >= 0) {
    wordRanges.push({ start: wordStart, end: codePoints.length })
  }

  return wordRanges.map((range, index) => {
    const wordText = codePoints.slice(range.start, range.end).join('')

    // Find spans that overlap this word and adjust offsets to be word-relative
    const wordRules: EngineTajweedRule[] = []

    for (const span of spans) {
      // Span must overlap the word range
      if (span.end <= range.start || span.start >= range.end) continue

      const relStart = Math.max(0, span.start - range.start)
      const relEnd = Math.min(range.end - range.start, span.end - range.start)

      if (relEnd <= relStart) continue

      wordRules.push({
        class: span.topicId,
        text: Array.from(wordText).slice(relStart, relEnd).join(''),
        startIndex: relStart,
        endIndex: relEnd,
        ruleId: span.ruleId,
        hukumId: span.hukumId,
        categoryId: span.categoryId,
        topicId: span.topicId,
        hukumLabel: getHukumLabel(span.hukumId),
        ruleLabel: getRuleLabel(span.ruleId),
        topicLabel: getTopicLabelAr(span.topicId),
        hukumLabelEn: getHukumLabelEn(span.hukumId),
        topicLabelEn: getTopicLabelEn(span.topicId),
        ruleLabelEn: getRuleLabelEn(span.ruleId),
      })
    }

    // Sort rules by startIndex
    wordRules.sort((a, b) => a.startIndex - b.startIndex)

    return {
      id: surah * 1000000 + ayah * 1000 + index + 1,
      location: `${surah}:${ayah}:${index + 1}`,
      surah,
      ayah,
      word: index + 1,
      text: wordText,
      tajweedRules: wordRules,
    }
  })
}

// --- Description helpers ---

const hukumLabelCache = new Map<string, string>()
const ruleLabelCache = new Map<string, string>()

function getHukumLabel(hukumId: string): string {
  let label = hukumLabelCache.get(hukumId)
  if (label !== undefined) return label
  const hukum = corpus().hukums.find((h) => h.id === hukumId)
  label = hukum?.label.ar ?? hukumId
  hukumLabelCache.set(hukumId, label)
  return label
}

function getRuleLabel(ruleId: string): string {
  let label = ruleLabelCache.get(ruleId)
  if (label !== undefined) return label
  const rule = corpus().rules.find((r) => r.id === ruleId)
  label = rule?.label.ar ?? ruleId
  ruleLabelCache.set(ruleId, label)
  return label
}

/** Returns "الحكم — Rule" in Arabic for a span. */
export function describeSpan(span: Pick<Span, 'hukumId' | 'ruleId'>): string {
  const hukum = getHukumLabel(span.hukumId)
  const rule = getRuleLabel(span.ruleId)
  return hukum && rule ? `${hukum} — ${rule}` : (hukum ?? rule ?? span.ruleId)
}

/** Returns the English topic label for a topic ID. */
export function getTopicLabelEn(topicId: string): string {
  return TOPIC_LABELS_EN_FULL[topicId] ?? topicId
}

/** Returns the Arabic topic label for a topic ID. */
export function getTopicLabelAr(topicId: string): string {
  const topic = corpus().topics.find((t) => t.id === topicId)
  return topic?.label.ar ?? topicId
}

/** Returns the English hukum label for a hukum ID. */
export function getHukumLabelEn(hukumId: string): string {
  return HUKUM_LABELS_EN[hukumId] ?? hukumId
}

/** Returns the English rule label for a rule ID. */
export function getRuleLabelEn(ruleId: string): string {
  return RULE_LABELS_EN[ruleId] ?? ruleId
}

/** Returns the color for a topic ID. */
export function getTopicColor(topicId: string): string {
  return TOPIC_COLORS[topicId] ?? 'currentColor'
}

/** Returns all 7 topics with their labels and colors. */
export function getTopics(): Array<{ id: string; labelAr: string; labelEn: string; color: string }> {
  return corpus().topics.map((t) => ({
    id: t.id,
    labelAr: t.label.ar,
    labelEn: TOPIC_LABELS_EN_FULL[t.id] ?? t.id,
    color: TOPIC_COLORS[t.id] ?? 'currentColor',
  }))
}

/** Returns all categories for a topic. */
export function getCategoriesForTopic(topicId: string): Array<{ id: string; labelAr: string }> {
  return corpus()
    .categories.filter((c) => c.topic === topicId && !c.empty)
    .map((c) => ({ id: c.id, labelAr: c.label.ar }))
}

/** Returns all ahkam for a category. */
export function getHukumsForCategory(categoryId: string): Array<{ id: string; labelAr: string }> {
  return corpus()
    .hukums.filter((h) => h.category === categoryId)
    .map((h) => ({ id: h.id, labelAr: h.label.ar }))
}

/** Returns the text covered by a span. */
export function getSpanText(ayahText: string, span: Pick<Span, 'start' | 'end'>): string {
  return sliceSpan(ayahText, span)
}
