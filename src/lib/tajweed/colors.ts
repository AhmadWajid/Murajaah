/**
 * Colours keyed by TOPIC, of which there are seven.
 *
 * The corpus has 57 ahkam, and giving each its own colour means past roughly a
 * dozen a reader stops decoding the colour and starts ignoring it. Seven is
 * legible. Anything needing finer granularity should say so in words: a tooltip,
 * a legend, a label.
 *
 * Chosen for contrast against both light and dark backgrounds.
 *
 * Ported from @tajweed/core (MIT).
 */
export const TOPIC_COLORS: Readonly<Record<string, string>> = {
  'tafkheem-tarqeeq': '#c2410c',
  'letter-relations': '#7e22ce',
  'noon-tanween': '#0369a1',
  'meem-sakinah': '#0f766e',
  mushaddadatan: '#a16207',
  madd: '#be123c',
  qalqalah: '#15803d',
}

// English labels for the seven topics now live in translations.ts
