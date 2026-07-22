import { Board, Placement, Tile, Difficulty } from './types';
import { Dictionary, TrieNode } from './dictionary';
import { inBounds, isCenter } from './board';
import { validatePlay } from './rules';
import { scorePlacements } from './scoring';
import { BOARD_SIZE } from './types';
import { letterValue } from './tiles';

export interface GeneratedMove {
  placements: Placement[];
  score: number;
  words: string[];
  /** Tile ids left on the rack after this play. */
  leaveIds: string[];
}

const ALPHABET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('');

/** Letter present on the board at (row,col), or null. */
function boardLetter(board: Board, row: number, col: number): string | null {
  const cell = board[row][col];
  return cell ? cell.letter.toUpperCase() : null;
}

/**
 * Enumerate ALL legal plays for a rack on a board using the standard
 * anchor-square + cross-check + trie left/right-extension approach
 * (Appel–Jacobson). Every returned move is additionally re-validated through the
 * shared `rules` validator, so the output is guaranteed legal.
 */
export function generateMoves(
  board: Board,
  rack: Tile[],
  dict: Dictionary,
): GeneratedMove[] {
  const moves: GeneratedMove[] = [];
  const seen = new Set<string>();

  // Two orientations: across (transpose=false) and down (transpose=true).
  for (const transpose of [false, true]) {
    // Logical accessor: get(i, j). For across i=row, j=col. For down i=col, j=row.
    const get = (i: number, j: number): string | null => {
      const row = transpose ? j : i;
      const col = transpose ? i : j;
      if (!inBounds(row, col)) return null;
      return boardLetter(board, row, col);
    };
    const toReal = (i: number, j: number): [number, number] =>
      transpose ? [j, i] : [i, j];
    const inGrid = (i: number, j: number): boolean =>
      i >= 0 && i < BOARD_SIZE && j >= 0 && j < BOARD_SIZE;

    generateOrientation(board, rack, dict, get, toReal, inGrid, transpose, moves, seen);
  }
  return moves;
}

function generateOrientation(
  board: Board,
  rack: Tile[],
  dict: Dictionary,
  get: (i: number, j: number) => string | null,
  toReal: (i: number, j: number) => [number, number],
  inGrid: (i: number, j: number) => boolean,
  transpose: boolean,
  out: GeneratedMove[],
  seen: Set<string>,
): void {
  const boardEmpty = isBoardEmpty(board);

  // Precompute cross-checks: for each empty square, the set of letters that form
  // a valid perpendicular word (null = no perpendicular neighbours => any letter).
  const crossCache = new Map<string, Set<string> | null>();
  const crossCheck = (i: number, j: number): Set<string> | null => {
    const k = `${i},${j}`;
    if (crossCache.has(k)) return crossCache.get(k)!;
    let above = '';
    let ii = i - 1;
    while (get(ii, j)) {
      above = get(ii, j)! + above;
      ii--;
    }
    let below = '';
    ii = i + 1;
    while (get(ii, j)) {
      below += get(ii, j)!;
      ii++;
    }
    let result: Set<string> | null;
    if (!above && !below) {
      result = null;
    } else {
      result = new Set<string>();
      for (const L of ALPHABET) {
        if (dict.has(above + L + below)) result.add(L);
      }
    }
    crossCache.set(k, result);
    return result;
  };

  const isAnchor = (i: number, j: number): boolean => {
    if (!inGrid(i, j) || get(i, j)) return false;
    if (boardEmpty) {
      const [r, c] = toReal(i, j);
      return isCenter(r, c);
    }
    // Empty square with at least one occupied orthogonal neighbour.
    return (
      !!get(i - 1, j) ||
      !!get(i + 1, j) ||
      !!get(i, j - 1) ||
      !!get(i, j + 1)
    );
  };

  const used = new Set<string>();
  const placed: { i: number; j: number; tile: Tile; letter: string }[] = [];

  const record = () => {
    if (placed.length === 0) return;
    const placements: Placement[] = placed.map((p) => {
      const [row, col] = toReal(p.i, p.j);
      const tile: Tile = p.tile.isBlank
        ? { ...p.tile, letter: p.letter }
        : p.tile;
      return { tile, row, col };
    });
    // Canonical key to dedupe across orientations/anchors.
    const key = placements
      .map((p) => `${p.row},${p.col}=${p.tile.letter}`)
      .sort()
      .join('|');
    if (seen.has(key)) return;

    const validation = validatePlay(board, placements, dict);
    if (!validation.legal) return;
    seen.add(key);
    const { total } = scorePlacements(board, placements);
    const leaveIds = rack.filter((t) => !used.has(t.id)).map((t) => t.id);
    out.push({ placements, score: total, words: validation.words ?? [], leaveIds });
  };

  // Letters a tile can represent (blank => whole alphabet).
  const tileLetters = (t: Tile): string[] => (t.isBlank ? ALPHABET : [t.letter.toUpperCase()]);

  // Extend to the right from logical square (i, j) with trie `node`.
  const extendRight = (i: number, node: TrieNode, j: number) => {
    const cell = get(i, j);
    if (cell === null) {
      // Empty (or out of bounds). Off-grid squares are treated as empty ends.
      const onGrid = inGrid(i, j);
      // Word may end here.
      if (node.terminal && placed.length > 0) record();
      if (!onGrid) return;
      const cc = crossCheck(i, j);
      for (const t of rack) {
        if (used.has(t.id)) continue;
        for (const L of tileLetters(t)) {
          const child = node.children.get(L);
          if (!child) continue;
          if (cc && !cc.has(L)) continue;
          used.add(t.id);
          placed.push({ i, j, tile: t, letter: L });
          extendRight(i, child, j + 1);
          placed.pop();
          used.delete(t.id);
        }
      }
    } else {
      // Board tile is fixed.
      const child = node.children.get(cell);
      if (child) extendRight(i, child, j + 1);
    }
  };

  // Build the left part (empty squares to the left of the anchor), then extend.
  const leftPart = (
    i: number,
    node: TrieNode,
    anchorJ: number,
    limit: number,
  ) => {
    extendRight(i, node, anchorJ);
    if (limit <= 0) return;
    const j = anchorJ - placed.length - 1; // next empty square to the left
    if (!inGrid(i, j) || get(i, j) !== null) return;
    const cc = crossCheck(i, j);
    for (const t of rack) {
      if (used.has(t.id)) continue;
      for (const L of tileLetters(t)) {
        const child = node.children.get(L);
        if (!child) continue;
        if (cc && !cc.has(L)) continue;
        used.add(t.id);
        placed.push({ i, j, tile: t, letter: L });
        leftPart(i, child, anchorJ, limit - 1);
        placed.pop();
        used.delete(t.id);
      }
    }
  };

  // Iterate anchors.
  for (let i = 0; i < BOARD_SIZE; i++) {
    for (let j = 0; j < BOARD_SIZE; j++) {
      if (!isAnchor(i, j)) continue;
      // If the square left of the anchor holds a board tile, the prefix is forced.
      if (get(i, j - 1)) {
        let prefix = '';
        let jj = j - 1;
        while (get(i, jj)) {
          prefix = get(i, jj)! + prefix;
          jj--;
        }
        const node = dict.nodeFor(prefix);
        if (node) extendRight(i, node, j);
      } else {
        // Count empty squares to the left available for the left part.
        let limit = 0;
        let jj = j - 1;
        while (inGrid(i, jj) && get(i, jj) === null && !isAnchor(i, jj)) {
          limit++;
          jj--;
        }
        limit = Math.min(limit, rack.length - 1);
        leftPart(i, dict.root, j, Math.max(0, limit));
      }
    }
  }
  void transpose;
}

function isBoardEmpty(board: Board): boolean {
  for (const row of board) for (const cell of row) if (cell) return false;
  return true;
}

// ---------------------------------------------------------------------------
// Difficulty policy: a selection over the legal-move list.
// ---------------------------------------------------------------------------

/** Heuristic value of the rack leave (higher = better tiles kept). */
export function leaveValue(leaveLetters: string[]): number {
  const VOWELS = new Set(['A', 'E', 'I', 'O', 'U']);
  let value = 0;
  let vowels = 0;
  let consonants = 0;
  const counts = new Map<string, number>();
  for (const raw of leaveLetters) {
    const L = raw === '' ? '_' : raw.toUpperCase();
    counts.set(L, (counts.get(L) ?? 0) + 1);
    if (L === '_') {
      value += 25; // blanks are extremely valuable to keep
    } else if (L === 'S') {
      value += 7; // S hooks many words
    } else if (VOWELS.has(L)) {
      vowels++;
    } else {
      consonants++;
    }
    // Heavy tiles are slightly awkward to hold.
    if ('QZXJ'.includes(L)) value -= 2;
  }
  // Penalize duplicates (awkward leaves).
  for (const [, n] of counts) if (n >= 2) value -= (n - 1) * 2;
  // Reward a balanced vowel/consonant mix.
  const imbalance = Math.abs(vowels - consonants);
  value -= imbalance * 2;
  return value;
}

function pickWeighted<T>(items: T[], weights: number[], rng: () => number): T {
  const total = weights.reduce((a, b) => a + b, 0);
  let r = rng() * total;
  for (let i = 0; i < items.length; i++) {
    r -= weights[i];
    if (r <= 0) return items[i];
  }
  return items[items.length - 1];
}

/** Look up the represented letters for a move's leave, from rack + leaveIds. */
function leaveLettersFor(rack: Tile[], leaveIds: string[]): string[] {
  const byId = new Map(rack.map((t) => [t.id, t]));
  return leaveIds.map((id) => {
    const t = byId.get(id);
    if (!t) return '';
    return t.isBlank ? '_' : t.letter.toUpperCase();
  });
}

/**
 * Choose a move for the AI according to difficulty. Returns null if there are
 * no legal moves (caller should exchange or pass).
 */
export function chooseMove(
  moves: GeneratedMove[],
  rack: Tile[],
  difficulty: Difficulty,
  rng: () => number = Math.random,
): GeneratedMove | null {
  if (moves.length === 0) return null;
  const sorted = [...moves].sort((a, b) => a.score - b.score);

  if (difficulty === 'easy') {
    // Random from a lower-scoring band (bottom ~40%, but never nothing).
    const bandEnd = Math.max(1, Math.floor(sorted.length * 0.4));
    const band = sorted.slice(0, bandEnd);
    return band[Math.floor(rng() * band.length)];
  }

  if (difficulty === 'medium') {
    // Sample from the top ~10 with score-weighted randomness.
    const top = sorted.slice(-10);
    const weights = top.map((m) => Math.max(1, m.score));
    return pickWeighted(top, weights, rng);
  }

  // Hard: maximize score, break ties (and near-ties) with the leave heuristic.
  let best: GeneratedMove | null = null;
  let bestKey = -Infinity;
  for (const m of moves) {
    const leave = leaveLettersFor(rack, m.leaveIds);
    const key = m.score + 0.15 * leaveValue(leave);
    if (key > bestKey) {
      bestKey = key;
      best = m;
    }
  }
  return best;
}

void letterValue;
