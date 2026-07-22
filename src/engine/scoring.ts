import {
  Board,
  PlacedTile,
  Placement,
  FormedWord,
  ScoreResult,
  Direction,
  RACK_SIZE,
  BINGO_BONUS,
} from './types';
import { premiumAt, letterMultiplier, wordMultiplier, inBounds } from './board';

/** Key for a board coordinate. */
function key(row: number, col: number): string {
  return `${row},${col}`;
}

/**
 * Overlay provisional placements onto a copy-free view of the board.
 * Returns a lookup that treats new placements as present.
 */
function makeCellLookup(board: Board, placements: Placement[]) {
  const newCells = new Map<string, PlacedTile>();
  for (const p of placements) {
    newCells.set(key(p.row, p.col), {
      ...p.tile,
      row: p.row,
      col: p.col,
    });
  }
  const cellAt = (row: number, col: number): PlacedTile | null => {
    if (!inBounds(row, col)) return null;
    return newCells.get(key(row, col)) ?? board[row][col];
  };
  return { newCells, cellAt };
}

/** Determine the primary direction of a multi-tile play. */
export function playDirection(placements: Placement[]): Direction {
  if (placements.length <= 1) {
    // Single tile: direction is ambiguous; caller decides via cross-words.
    return 'across';
  }
  const allSameRow = placements.every((p) => p.row === placements[0].row);
  return allSameRow ? 'across' : 'down';
}

/**
 * Collect the full word passing through (startRow,startCol) in `dir`, given a
 * cell lookup. Returns the ordered tiles (existing + new) or null if length < 2.
 */
function collectWord(
  cellAt: (r: number, c: number) => PlacedTile | null,
  row: number,
  col: number,
  dir: Direction,
): PlacedTile[] | null {
  const dr = dir === 'down' ? 1 : 0;
  const dc = dir === 'across' ? 1 : 0;

  // Walk backwards to the start of the word.
  let r = row;
  let c = col;
  while (cellAt(r - dr, c - dc)) {
    r -= dr;
    c -= dc;
  }

  const tiles: PlacedTile[] = [];
  while (cellAt(r, c)) {
    tiles.push(cellAt(r, c)!);
    r += dr;
    c += dc;
  }
  return tiles.length >= 2 ? tiles : null;
}

/** Score a single formed word, applying premiums only to newly placed tiles. */
function scoreWord(word: PlacedTile[], newCells: Map<string, PlacedTile>): FormedWord {
  let wordMult = 1;
  let sum = 0;
  const newTilePositions: { row: number; col: number }[] = [];

  for (const t of word) {
    const isNew = newCells.has(key(t.row, t.col));
    const premium = isNew ? premiumAt(t.row, t.col) : null;
    const lMult = premium ? letterMultiplier(premium) : 1;
    sum += t.value * lMult;
    if (premium) wordMult *= wordMultiplier(premium);
    if (isNew) newTilePositions.push({ row: t.row, col: t.col });
  }

  return {
    word: word.map((t) => t.letter).join(''),
    score: sum * wordMult,
    tiles: word,
    newTilePositions,
  };
}

/**
 * Compute all words formed by a set of provisional placements and their scores.
 *
 * The main word runs along the play direction; each newly placed tile may also
 * form a perpendicular cross-word. Premiums apply only to tiles newly placed
 * this turn. A bingo bonus is added when all RACK_SIZE tiles are used.
 *
 * This function does NOT validate legality — it purely scores. `rules.ts` gates
 * legality (including whether the words exist in the dictionary).
 */
export function scorePlacements(board: Board, placements: Placement[]): ScoreResult {
  const { newCells, cellAt } = makeCellLookup(board, placements);
  const words: FormedWord[] = [];
  const seen = new Set<string>();

  const dir = playDirection(placements);

  // Main word (along play direction). For a single-tile play we try both.
  const mainDirs: Direction[] = placements.length <= 1 ? ['across', 'down'] : [dir];
  for (const d of mainDirs) {
    const first = placements[0];
    const w = collectWord(cellAt, first.row, first.col, d);
    if (w) {
      const id = `${d}:${w[0].row},${w[0].col}:${w.length}`;
      if (!seen.has(id)) {
        seen.add(id);
        words.push(scoreWord(w, newCells));
      }
    }
  }

  // Cross-words: perpendicular to the main direction, one per new tile.
  const crossDir: Direction = dir === 'across' ? 'down' : 'across';
  for (const p of placements) {
    const w = collectWord(cellAt, p.row, p.col, crossDir);
    if (w) {
      const id = `${crossDir}:${w[0].row},${w[0].col}:${w.length}`;
      if (!seen.has(id)) {
        seen.add(id);
        words.push(scoreWord(w, newCells));
      }
    }
  }

  let total = words.reduce((s, w) => s + w.score, 0);
  const bingo = placements.length === RACK_SIZE;
  if (bingo) total += BINGO_BONUS;

  return { total, words, bingo };
}
