import { normalize } from "./text";

/**
 * Classic Levenshtein edit distance between two strings.
 * Two-row DP, O(n) space.
 */
export function levenshtein(a: string, b: string): number {
  const m = a.length;
  const n = b.length;

  if (m === 0) return n;
  if (n === 0) return m;

  let prev = new Array<number>(n + 1);
  let curr = new Array<number>(n + 1);

  for (let j = 0; j <= n; j++) prev[j] = j;

  for (let i = 1; i <= m; i++) {
    curr[0] = i;
    for (let j = 1; j <= n; j++) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      curr[j] = Math.min(
        curr[j - 1] + 1, // insertion
        prev[j] + 1, // deletion
        prev[j - 1] + cost, // substitution
      );
    }
    [prev, curr] = [curr, prev];
  }

  return prev[n];
}

/**
 * Returns true if any word in `normalizedSpoken` matches `safeWord`
 * within the Levenshtein tolerance: floor(len / 6) (Req 3.2).
 *
 * Both the spoken text (already normalized by the caller) and the safe word
 * (raw, from HouseholdContext) are normalized before comparison.
 */
export function safeWordMatch(normalizedSpoken: string, safeWord: string): boolean {
  const target = normalize(safeWord);
  if (!target) return false;

  const tolerance = Math.floor(target.length / 6);
  const words = normalizedSpoken.split(/\s+/).filter((w) => w.length > 0);

  for (const word of words) {
    if (levenshtein(word, target) <= tolerance) {
      return true;
    }
  }

  return false;
}

/**
 * Replaces any word in `text` that matches `safeWord` within the Levenshtein
 * tolerance with "[safe word]". The safe word must never appear in evidence,
 * signals, or any engine output (Req 3.4, Req 9.1).
 */
export function maskSafeWord(text: string, safeWord: string): string {
  if (!safeWord) return text;
  const target = normalize(safeWord);
  if (!target) return text;

  const tolerance = Math.floor(target.length / 6);

  return text
    .split(/(\s+)/)
    .map((token) => {
      if (/^\s*$/.test(token)) return token;
      const normalizedToken = normalize(token);
      if (normalizedToken && levenshtein(normalizedToken, target) <= tolerance) {
        return "[safe word]";
      }
      return token;
    })
    .join("");
}
