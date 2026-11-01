/**
 * Normalizes text for pattern matching: lowercase, no accents, no punctuation,
 * collapsed whitespace. Apostrophes are removed (not replaced with a space) so
 * English contractions stay together: "it's" → "its", "don't" → "dont".
 */
export function normalize(text: string): string {
  return text
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "") // strip diacritics (ñ → n, á → a)
    .replace(/[\u0027\u2018\u2019]/g, "") // strip apostrophes (it's → its)
    .replace(/[^\w\s]/g, " ") // remaining punctuation → space
    .replace(/\s+/g, " ")
    .trim();
}
