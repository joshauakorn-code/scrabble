import { Board, Placement } from './types';
import { inBounds, isCenter } from './board';
import { scorePlacements } from './scoring';
import { Dictionary } from './dictionary';

export interface ValidationResult {
  legal: boolean;
  reason?: string;
  /** Words formed (for a legal play, used to report to the UI). */
  words?: string[];
}

function key(row: number, col: number): string {
  return `${row},${col}`;
}

function boardIsEmpty(board: Board): boolean {
  for (const row of board) for (const cell of row) if (cell) return false;
  return true;
}

/**
 * Validate a play. Enforces, in order:
 *  - non-empty placement, all in bounds, no overlap with existing tiles
 *  - blanks have assigned letters
 *  - all placed tiles in a single row OR single column
 *  - contiguity (no gaps between placed tiles, existing tiles may fill gaps)
 *  - first move covers center and uses >= 2 tiles
 *  - later moves connect to at least one existing tile
 *  - every formed word (length >= 2) exists in the dictionary
 */
export function validatePlay(
  board: Board,
  placements: Placement[],
  dict: Dictionary,
): ValidationResult {
  if (placements.length === 0) {
    return { legal: false, reason: 'No tiles placed.' };
  }

  // Bounds + overlap + duplicates + blanks assigned.
  const occupied = new Set<string>();
  for (const p of placements) {
    if (!inBounds(p.row, p.col)) {
      return { legal: false, reason: 'Tile placed off the board.' };
    }
    const k = key(p.row, p.col);
    if (occupied.has(k)) {
      return { legal: false, reason: 'Two tiles placed on the same square.' };
    }
    occupied.add(k);
    if (board[p.row][p.col]) {
      return { legal: false, reason: 'A tile was placed on an occupied square.' };
    }
    if (p.tile.isBlank && !p.tile.letter) {
      return { legal: false, reason: 'A blank tile has no assigned letter.' };
    }
    if (!p.tile.letter) {
      return { legal: false, reason: 'A tile has no letter.' };
    }
  }

  // Single line: all same row or all same col.
  const rows = new Set(placements.map((p) => p.row));
  const cols = new Set(placements.map((p) => p.col));
  const sameRow = rows.size === 1;
  const sameCol = cols.size === 1;
  if (!sameRow && !sameCol) {
    return { legal: false, reason: 'All tiles must be in a single row or column.' };
  }

  // Contiguity: along the line, every square between the min and max placed
  // index must be filled (by a new or existing tile).
  const first = placements[0];
  if (sameRow) {
    const row = first.row;
    const placedCols = placements.map((p) => p.col).sort((a, b) => a - b);
    for (let c = placedCols[0]; c <= placedCols[placedCols.length - 1]; c++) {
      const filled = occupied.has(key(row, c)) || board[row][c];
      if (!filled) {
        return { legal: false, reason: 'Placed tiles are not contiguous.' };
      }
    }
  } else {
    const col = first.col;
    const placedRows = placements.map((p) => p.row).sort((a, b) => a - b);
    for (let r = placedRows[0]; r <= placedRows[placedRows.length - 1]; r++) {
      const filled = occupied.has(key(r, col)) || board[r][col];
      if (!filled) {
        return { legal: false, reason: 'Placed tiles are not contiguous.' };
      }
    }
  }

  const firstMove = boardIsEmpty(board);
  if (firstMove) {
    const coversCenter = placements.some((p) => isCenter(p.row, p.col));
    if (!coversCenter) {
      return { legal: false, reason: 'The first word must cover the center star.' };
    }
    if (placements.length < 2) {
      return { legal: false, reason: 'The first word must be at least two tiles.' };
    }
  } else {
    // Must connect to at least one existing tile (adjacency).
    const touches = placements.some((p) =>
      [
        [p.row - 1, p.col],
        [p.row + 1, p.col],
        [p.row, p.col - 1],
        [p.row, p.col + 1],
      ].some(([r, c]) => inBounds(r, c) && board[r][c]),
    );
    if (!touches) {
      return {
        legal: false,
        reason: 'New tiles must connect to at least one existing tile.',
      };
    }
  }

  // Dictionary check of ALL formed words.
  const result = scorePlacements(board, placements);
  const formed = result.words;
  if (formed.length === 0) {
    // A play must form at least one word of length >= 2.
    return { legal: false, reason: 'A play must form a word of at least two letters.' };
  }
  const invalid = formed.find((w) => !dict.has(w.word));
  if (invalid) {
    return { legal: false, reason: `"${invalid.word}" is not a valid word.` };
  }

  return { legal: true, words: formed.map((w) => w.word) };
}
