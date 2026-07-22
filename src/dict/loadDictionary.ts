import { Dictionary, dictionaryFromText } from '../engine/dictionary';

/** Path to the bundled word-list asset (see README to swap lists). */
export const DICTIONARY_URL = `${import.meta.env.BASE_URL}dict/enable1.txt`;

let cached: Dictionary | null = null;
let pending: Promise<Dictionary> | null = null;

/** Fetch and build the dictionary once, caching the result. */
export function loadDictionary(): Promise<Dictionary> {
  if (cached) return Promise.resolve(cached);
  if (pending) return pending;
  pending = fetch(DICTIONARY_URL)
    .then((res) => {
      if (!res.ok) throw new Error(`Failed to load dictionary (${res.status})`);
      return res.text();
    })
    .then((text) => {
      cached = dictionaryFromText(text);
      return cached;
    });
  return pending;
}
