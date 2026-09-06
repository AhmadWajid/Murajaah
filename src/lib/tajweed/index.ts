/**
 * Public API for the quranpedia tajweed engine integration.
 */

export { getAyahTajweed, getTopics, getCategoriesForTopic, getHukumsForCategory, describeSpan, getTopicColor, getTopicLabelEn, getTopicLabelAr, getSpanText, TOPIC_COLORS, TOPIC_LABELS_EN } from './tajweedEngineService'
export type { EngineTajweedWord, EngineTajweedRule, AyahTajweedData, Span, Corpus } from './tajweedEngineService'
export { resolveOverlaps, sliceSpan, unpack } from './unpack'
export { getCorpus } from './corpus'
export { getAnnotations } from './annotations'
export { getAyahText } from './edition'
