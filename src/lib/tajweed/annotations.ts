/**
 * Loads the precomputed tajweed annotations from the vendored data file.
 * @tajweed/annotations (CC BY 4.0) — see data/tajweed/LICENSE-annotations.txt
 *
 * 147,255 spans covering all 6,236 ayahs, as code-point offsets pinned to the
 * digest of the text edition they were computed against.
 */

import type { Annotations } from './types'
import annotationsData from '../../../data/tajweed/annotations.json'

const annotations = annotationsData as unknown as Annotations

export function getAnnotations(): Annotations {
  return annotations
}

export { annotations }
