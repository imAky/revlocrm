/**
 * Normalizes keyword search strings by trimming, lowercasing,
 * stripping punctuation, and collapsing excess whitespace.
 */
export function normalizeKeywordString(str: string): string {
  return str
    .trim()
    .toLowerCase()
    .replace(/[^\w\s]/gi, "")
    .replace(/\s+/g, " ");
}
