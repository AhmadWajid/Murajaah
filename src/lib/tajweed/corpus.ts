/**
 * Loads the tajweed rule corpus from the vendored data file.
 * @tajweed/rules (CC BY 4.0) — see data/tajweed/LICENSE-rules.txt
 */

import type { Corpus } from './types'
import rulesData from '../../../data/tajweed/rules.json'

const corpus = rulesData as unknown as Corpus

export function getCorpus(): Corpus {
  return corpus
}

export { corpus }
