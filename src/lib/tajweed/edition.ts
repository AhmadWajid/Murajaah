/**
 * Loads the Uthmani Hafs edition text that the precomputed annotations are
 * aligned to. The spans' code-point offsets index into THIS text — if your text
 * differs even slightly, the positions point at different letters.
 */

import editionData from '../../../data/tajweed/edition-uthmani-hafs.json'

interface Edition {
  id: string
  riwayah: string
  script: string
  source: string
  ayahs: Record<string, string>
}

const edition = editionData as unknown as Edition

/** Returns the full ayah text for `surah:ayah`, or empty string if not found. */
export function getAyahText(surah: number, ayah: number): string {
  return edition.ayahs[`${surah}:${ayah}`] ?? ''
}

/** Returns all ayah references that have text, as `surah:ayah` strings. */
export function getAyahReferences(): string[] {
  return Object.keys(edition.ayahs)
}

export { edition }
