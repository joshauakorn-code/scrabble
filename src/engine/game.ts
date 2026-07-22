import {
  GameState,
  Player,
  Placement,
  Tile,
  PlacedTile,
  Board,
  RACK_SIZE,
  Difficulty,
  MoveLogEntry,
} from './types';
import { createEmptyBoard } from './board';
import { createBag, shuffle, drawTiles, sumTileValues } from './tiles';
import { validatePlay, ValidationResult } from './rules';
import { scorePlacements } from './scoring';
import { Dictionary } from './dictionary';

export interface NewGameOptions {
  players: {
    name: string;
    kind: 'human' | 'ai';
    difficulty?: Difficulty;
  }[];
  rng?: () => number;
}

/** Create a fresh game: shuffled bag, dealt racks, empty board. */
export function newGame(opts: NewGameOptions): GameState {
  const rng = opts.rng ?? Math.random;
  const bag = shuffle(createBag(), rng);
  const players: Player[] = opts.players.map((p, i) => ({
    id: i,
    name: p.name,
    kind: p.kind,
    difficulty: p.difficulty,
    rack: drawTiles(bag, RACK_SIZE),
    score: 0,
  }));
  return {
    board: createEmptyBoard(),
    bag,
    players,
    currentPlayer: 0,
    phase: 'playing',
    scorelessTurns: 0,
    moveLog: [],
    winnerIds: [],
    turnNumber: 1,
  };
}

function currentPlayer(state: GameState): Player {
  return state.players[state.currentPlayer];
}

/** Remove the given tiles (by id) from a rack, returning the new rack. */
function removeFromRack(rack: Tile[], tileIds: Set<string>): Tile[] {
  return rack.filter((t) => !tileIds.has(t.id));
}

/** Commit provisional placements onto a board copy, returning the new board. */
function applyPlacements(board: Board, placements: Placement[]): Board {
  const next = board.map((r) => r.slice());
  for (const p of placements) {
    const placed: PlacedTile = { ...p.tile, row: p.row, col: p.col };
    next[p.row][p.col] = placed;
  }
  return next;
}

function advanceTurn(state: GameState): void {
  state.currentPlayer = (state.currentPlayer + 1) % state.players.length;
  state.turnNumber += 1;
}

/** Whether the game should end after the current position. */
function checkGameEnd(state: GameState): boolean {
  // A player emptied their rack and the bag is empty.
  const someoneOut =
    state.bag.length === 0 && state.players.some((p) => p.rack.length === 0);
  // Six consecutive scoreless turns.
  const stalled = state.scorelessTurns >= 6;
  return someoneOut || stalled;
}

/**
 * Final scoring: each player loses the sum of their unplayed tiles. If a player
 * went out (empty rack), they gain the sum of all opponents' unplayed tiles.
 */
export function finalizeScores(state: GameState): void {
  const outPlayer = state.players.find((p) => p.rack.length === 0);
  let othersTotal = 0;
  for (const p of state.players) {
    const rackValue = sumTileValues(p.rack);
    p.score -= rackValue;
    othersTotal += rackValue;
  }
  if (outPlayer) {
    // outPlayer already had 0 subtracted; add opponents' totals.
    outPlayer.score += othersTotal;
  }
  const max = Math.max(...state.players.map((p) => p.score));
  state.winnerIds = state.players.filter((p) => p.score === max).map((p) => p.id);
  state.phase = 'gameover';
}

export interface PlayResult {
  ok: boolean;
  reason?: string;
  score?: number;
  words?: string[];
  state: GameState;
}

/**
 * Attempt to apply a play (list of provisional placements). Validates through
 * `rules`, scores, refills the rack, advances the turn, and checks end
 * conditions. Returns a NEW state on success; the input is not mutated.
 */
export function applyPlay(
  state: GameState,
  placements: Placement[],
  dict: Dictionary,
): PlayResult {
  if (state.phase !== 'playing') {
    return { ok: false, reason: 'The game is over.', state };
  }
  const validation: ValidationResult = validatePlay(state.board, placements, dict);
  if (!validation.legal) {
    return { ok: false, reason: validation.reason, state };
  }

  const next = cloneState(state);
  const player = next.players[next.currentPlayer];
  const { total } = scorePlacements(next.board, placements);

  next.board = applyPlacements(next.board, placements);
  const usedIds = new Set(placements.map((p) => p.tile.id));
  player.rack = removeFromRack(player.rack, usedIds);
  // Refill.
  player.rack.push(...drawTiles(next.bag, RACK_SIZE - player.rack.length));
  player.score += total;

  const entry: MoveLogEntry = {
    playerId: player.id,
    playerName: player.name,
    type: 'play',
    words: validation.words,
    score: total,
    totalAfter: player.score,
  };
  next.moveLog.push(entry);
  next.scorelessTurns = total > 0 ? 0 : next.scorelessTurns + 1;

  if (checkGameEnd(next)) {
    finalizeScores(next);
  } else {
    advanceTurn(next);
  }
  return { ok: true, score: total, words: validation.words, state: next };
}

/**
 * Exchange tiles. Only legal if the bag has at least RACK_SIZE tiles. Forfeits
 * the turn (scoreless). Returns a new state.
 */
export function applyExchange(
  state: GameState,
  tileIds: string[],
  dict?: Dictionary,
): PlayResult {
  void dict;
  if (state.phase !== 'playing') {
    return { ok: false, reason: 'The game is over.', state };
  }
  if (state.bag.length < RACK_SIZE) {
    return {
      ok: false,
      reason: `Cannot exchange: fewer than ${RACK_SIZE} tiles remain in the bag.`,
      state,
    };
  }
  if (tileIds.length === 0) {
    return { ok: false, reason: 'Select at least one tile to exchange.', state };
  }

  const next = cloneState(state);
  const player = next.players[next.currentPlayer];
  const ids = new Set(tileIds);
  const removed = player.rack.filter((t) => ids.has(t.id));
  if (removed.length !== tileIds.length) {
    return { ok: false, reason: 'Tiles to exchange are not on the rack.', state };
  }
  player.rack = removeFromRack(player.rack, ids);
  // Draw replacements first, then return removed tiles to the bag & reshuffle.
  const replacements = drawTiles(next.bag, removed.length);
  player.rack.push(...replacements);
  next.bag.push(...removed);
  next.bag = shuffle(next.bag);

  next.moveLog.push({
    playerId: player.id,
    playerName: player.name,
    type: 'exchange',
    score: 0,
    totalAfter: player.score,
  });
  next.scorelessTurns += 1;

  if (checkGameEnd(next)) {
    finalizeScores(next);
  } else {
    advanceTurn(next);
  }
  return { ok: true, score: 0, state: next };
}

/** Pass the turn (scoreless). Returns a new state. */
export function applyPass(state: GameState): PlayResult {
  if (state.phase !== 'playing') {
    return { ok: false, reason: 'The game is over.', state };
  }
  const next = cloneState(state);
  const player = next.players[next.currentPlayer];
  next.moveLog.push({
    playerId: player.id,
    playerName: player.name,
    type: 'pass',
    score: 0,
    totalAfter: player.score,
  });
  next.scorelessTurns += 1;

  if (checkGameEnd(next)) {
    finalizeScores(next);
  } else {
    advanceTurn(next);
  }
  return { ok: true, score: 0, state: next };
}

/** Structured clone of game state (tiles/cells treated as immutable). */
export function cloneState(state: GameState): GameState {
  return {
    board: state.board.map((r) => r.slice()),
    bag: state.bag.slice(),
    players: state.players.map((p) => ({ ...p, rack: p.rack.slice() })),
    currentPlayer: state.currentPlayer,
    phase: state.phase,
    scorelessTurns: state.scorelessTurns,
    moveLog: state.moveLog.slice(),
    winnerIds: state.winnerIds.slice(),
    turnNumber: state.turnNumber,
  };
}

export { currentPlayer };
