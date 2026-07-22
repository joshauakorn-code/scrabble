import { BOARD_SIZE, CENTER, Board, Premium } from './types';

/**
 * Standard tournament Scrabble premium-square layout.
 *
 * The layout is defined for one quadrant/relationship and mirrored, but we
 * simply encode the canonical 15x15 grid directly and then assert (in tests)
 * that it is symmetric across both diagonals and has the expected counts:
 *   8x TW, 17x DW (incl. center), 12x TL, 24x DL.
 *
 * Legend: 3 = TW, 2 = DW, T = TL, D = DL, . = plain, * = center (DW/star)
 */
const LAYOUT: string[] = [
  '3..D...3...D..3',
  '.2...T...T...2.',
  '..2...D.D...2..',
  'D..2...D...2..D',
  '....2.....2....',
  '.T...T...T...T.',
  '..D...D.D...D..',
  '3..D...*...D..3',
  '..D...D.D...D..',
  '.T...T...T...T.',
  '....2.....2....',
  'D..2...D...2..D',
  '..2...D.D...2..',
  '.2...T...T...2.',
  '3..D...3...D..3',
];

function charToPremium(ch: string): Premium {
  switch (ch) {
    case '3':
      return 'TW';
    case '2':
      return 'DW';
    case 'T':
      return 'TL';
    case 'D':
      return 'DL';
    case '*':
      return 'CENTER';
    default:
      return null;
  }
}

/** Precomputed premium map: premiums[row][col]. */
export const PREMIUMS: Premium[][] = LAYOUT.map((line) =>
  line.split('').map(charToPremium),
);

/** Word multiplier for a premium square (only DW/TW/CENTER matter). */
export function wordMultiplier(premium: Premium): number {
  if (premium === 'TW') return 3;
  if (premium === 'DW' || premium === 'CENTER') return 2;
  return 1;
}

/** Letter multiplier for a premium square. */
export function letterMultiplier(premium: Premium): number {
  if (premium === 'TL') return 3;
  if (premium === 'DL') return 2;
  return 1;
}

export function premiumAt(row: number, col: number): Premium {
  return PREMIUMS[row][col];
}

export function isCenter(row: number, col: number): boolean {
  return row === CENTER && col === CENTER;
}

/** Create an empty 15x15 board. */
export function createEmptyBoard(): Board {
  return Array.from({ length: BOARD_SIZE }, () =>
    Array.from({ length: BOARD_SIZE }, () => null),
  );
}

export function inBounds(row: number, col: number): boolean {
  return row >= 0 && row < BOARD_SIZE && col >= 0 && col < BOARD_SIZE;
}

/** Deep-ish clone of a board (cells are replaced, tiles shared by reference — safe
 *  because PlacedTile objects are treated as immutable once committed). */
export function cloneBoard(board: Board): Board {
  return board.map((row) => row.slice());
}

/** Count premium squares by kind — used by self-checks / tests. */
export function premiumCounts(): Record<string, number> {
  const counts: Record<string, number> = { TW: 0, DW: 0, TL: 0, DL: 0 };
  for (let r = 0; r < BOARD_SIZE; r++) {
    for (let c = 0; c < BOARD_SIZE; c++) {
      const p = PREMIUMS[r][c];
      if (p === 'CENTER') counts.DW++;
      else if (p) counts[p]++;
    }
  }
  return counts;
}
