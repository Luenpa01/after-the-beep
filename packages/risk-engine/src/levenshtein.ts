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
 * Returns true if any window of consecutive words in `normalizedSpoken`
 * matches `safeWord` within the Levenshtein tolerance: floor(len / 6)
 * (Req 3.2).
 *
 * The window size equals the word count of the normalized safe word, so
 * multi-word safe words ("gato negro") are compared against every window
 * of the same length. Single-word safe words fall back to per-word checking.
 *
 * `normalizedSpoken` is already normalized by the caller; `safeWord` is the
 * raw value from HouseholdContext and is normalized here.
 */
export function safeWordMatch(normalizedSpoken: string, safeWord: string): boolean {
  const target = normalize(safeWord);
  if (!target) return false;

  const tolerance = Math.floor(target.length / 6);
  const words = normalizedSpoken.split(/\s+/).filter((w) => w.length > 0);
  const targetWords = target.split(/\s+/).filter((w) => w.length > 0);
  const windowSize = targetWords.length;

  for (let i = 0; i + windowSize <= words.length; i++) {
    const window = words.slice(i, i + windowSize).join(" ");
    if (levenshtein(window, target) <= tolerance) {
      return true;
    }
  }

  return false;
}

/**
 * Replaces any window of consecutive words in `text` that matches `safeWord`
 * within the Levenshtein tolerance with "[safe word]". Handles multi-word
 * safe words by sliding a window of the same word count over the text.
 *
 * The safe word must never appear in evidence, signals, or any engine output
 * (Req 3.4, Req 9.1).
 */
export function maskSafeWord(text: string, safeWord: string): string {
  if (!safeWord) return text;
  const target = normalize(safeWord);
  if (!target) return text;

  const tolerance = Math.floor(target.length / 6);
  const targetWords = target.split(/\s+/).filter((w) => w.length > 0);
  const windowSize = targetWords.length;

  // Split keeping whitespace tokens for reconstruction.
  const tokens = text.split(/(\s+)/);

  // Indices of non-whitespace tokens.
  const wordIdxs: number[] = [];
  for (let i = 0; i < tokens.length; i++) {
    if (tokens[i].length > 0 && !/^\s+$/.test(tokens[i])) {
      wordIdxs.push(i);
    }
  }

  // Track which token indices are part of a matched window.
  const masked = new Set<number>();

  for (let i = 0; i + windowSize <= wordIdxs.length; i++) {
    // Skip if any token in this window is already masked.
    let alreadyMasked = false;
    for (let j = 0; j < windowSize; j++) {
      if (masked.has(wordIdxs[i + j])) {
        alreadyMasked = true;
        break;
      }
    }
    if (alreadyMasked) continue;

    const windowWords: string[] = [];
    for (let j = 0; j < windowSize; j++) {
      windowWords.push(normalize(tokens[wordIdxs[i + j]]));
    }
    const window = windowWords.join(" ");

    if (levenshtein(window, target) <= tolerance) {
      // Mark all tokens in the window, including whitespace between words.
      const start = wordIdxs[i];
      const end = wordIdxs[i + windowSize - 1];
      for (let k = start; k <= end; k++) {
        masked.add(k);
      }
    }
  }

  // Build result, collapsing each masked run into "[safe word]".
  const result: string[] = [];
  let i = 0;
  while (i < tokens.length) {
    if (masked.has(i)) {
      while (i < tokens.length && masked.has(i)) i++;
      result.push("[safe word]");
    } else {
      result.push(tokens[i]);
      i++;
    }
  }

  return result.join("");
}
