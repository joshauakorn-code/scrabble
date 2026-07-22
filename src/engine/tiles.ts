import { Tile } from './types';

/** Point value for each letter (A-Z). */
export const LETTER_VALUES: Record<string, number> = {
  A: 1, E: 1, I: 1, O: 1, N: 1, R: 1, T: 1, L: 1, S: 1, U: 1,
  D: 2, G: 2,
  B: 3, C: 3, M: 3, P: 3,
  F: 4, H: 4, V: 4, W: 4, Y: 4,
  K: 5,
  J: 8, X: 8,
  Q: 10, Z: 10,
};

/** Standard English tile distribution (counts per letter; '_' = blank). */
export const TILE_DISTRIBUTION: Record<string, number> = {
  E: 12, A: 9, I: 9, O: 8, N: 6, R: 6, T: 6, L: 4, S: 4, U: 4,
  D: 4, G: 3,
  B: 2, C: 2, M: 2, P: 2,
  F: 2, H: 2, V: 2, W: 2, Y: 2,
  K: 1,
  J: 1, X: 1,
  Q: 1, Z: 1,
  _: 2, // blanks
};

export function letterValue(letter: string): number {
  return LETTER_VALUES[letter.toUpperCase()] ?? 0;
}

let _seq = 0;
function nextId(prefix: string): string {
  _seq += 1;
  return `${prefix}-${_seq}`;
}

/** Reset the tile-id sequence (useful for deterministic tests). */
export function resetTileIds(): void {
  _seq = 0;
}

/** Build a full 100-tile bag (unshuffled). */
export function createBag(): Tile[] {
  const bag: Tile[] = [];
  for (const [letter, count] of Object.entries(TILE_DISTRIBUTION)) {
    for (let i = 0; i < count; i++) {
      if (letter === '_') {
        bag.push({ id: nextId('blank'), letter: '', value: 0, isBlank: true });
      } else {
        bag.push({
          id: nextId(letter),
          letter,
          value: LETTER_VALUES[letter],
          isBlank: false,
        });
      }
    }
  }
  return bag;
}

/** Fisher–Yates shuffle. Accepts an optional RNG for deterministic tests. */
export function shuffle<T>(arr: T[], rng: () => number = Math.random): T[] {
  const a = arr.slice();
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

/**
 * Draw up to `n` tiles from the (front of the) bag, returning the drawn tiles
 * and mutating `bag` in place (removes drawn tiles). Draws fewer if the bag runs
 * out. Assumes the bag is already shuffled.
 */
export function drawTiles(bag: Tile[], n: number): Tile[] {
  const count = Math.min(n, bag.length);
  return bag.splice(0, count);
}

/** Total point value of a list of tiles (for end-game adjustments). */
export function sumTileValues(tiles: Tile[]): number {
  return tiles.reduce((s, t) => s + t.value, 0);
}
