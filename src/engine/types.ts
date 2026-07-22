// Shared, framework-agnostic types for the Scrabble engine.

export const BOARD_SIZE = 15;
export const RACK_SIZE = 7;
export const BINGO_BONUS = 50;
export const CENTER = 7; // 0-indexed center row/col

/** Premium square kinds. */
export type Premium = 'TW' | 'DW' | 'TL' | 'DL' | 'CENTER' | null;

/** A single tile. `isBlank` distinguishes a played blank from a natural letter.
 *  For a blank, `letter` holds its ASSIGNED letter (uppercase) once chosen, or
 *  is the empty string while still on the rack. `id` is a stable unique key. */
export interface Tile {
  id: string;
  /** The displayed / scoring letter (A-Z). Empty string for an unassigned blank. */
  letter: string;
  /** Point value. Blanks are 0. */
  value: number;
  /** True if this tile originated as a blank. */
  isBlank: boolean;
}

/** A tile that has been committed to the board, with its position. */
export interface PlacedTile extends Tile {
  row: number;
  col: number;
}

/** A provisional placement being assembled during a turn (not yet scored/committed). */
export interface Placement {
  tile: Tile;
  row: number;
  col: number;
}

export type Board = (PlacedTile | null)[][];

export type Direction = 'across' | 'down';

/** A word formed by a play, for scoring / validation reporting. */
export interface FormedWord {
  word: string;
  score: number;
  tiles: PlacedTile[];
  /** Positions that were newly placed this turn (subset of tiles). */
  newTilePositions: { row: number; col: number }[];
}

export interface ScoreResult {
  total: number;
  words: FormedWord[];
  bingo: boolean;
}

export type PlayerKind = 'human' | 'ai';
export type Difficulty = 'easy' | 'medium' | 'hard';

export interface Player {
  id: number;
  name: string;
  kind: PlayerKind;
  difficulty?: Difficulty;
  rack: Tile[];
  score: number;
}

export type GamePhase = 'playing' | 'gameover';

export interface MoveLogEntry {
  playerId: number;
  playerName: string;
  type: 'play' | 'exchange' | 'pass';
  words?: string[];
  score: number;
  /** Running total AFTER this move. */
  totalAfter: number;
}

export interface GameState {
  board: Board;
  bag: Tile[];
  players: Player[];
  currentPlayer: number;
  phase: GamePhase;
  /** Count of consecutive scoreless turns (pass / zero-scoring exchange). */
  scorelessTurns: number;
  moveLog: MoveLogEntry[];
  /** Set once the game is over. Winner id(s). */
  winnerIds: number[];
  turnNumber: number;
}

/** A fully specified play the engine can validate & apply. */
export interface Play {
  placements: Placement[];
}
