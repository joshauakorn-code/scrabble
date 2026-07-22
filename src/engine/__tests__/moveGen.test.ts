import { describe, it, expect } from 'vitest';
import { generateMoves, chooseMove, leaveValue } from '../moveGen';
import { validatePlay } from '../rules';
import { emptyBoard, placeWord, testDict, tile } from './helpers';
import { Tile } from '../types';

const dict = testDict();

function rackFrom(letters: string): Tile[] {
  return letters.split('').map((l) => tile(l === '_' ? '' : l, l === '_'));
}

describe('move generation', () => {
  it('generates first-move plays through the center', () => {
    const board = emptyBoard();
    const rack = rackFrom('CATREDS');
    const moves = generateMoves(board, rack, dict);
    expect(moves.length).toBeGreaterThan(0);
    // Every first move must cover the center.
    for (const m of moves) {
      expect(m.placements.some((p) => p.row === 7 && p.col === 7)).toBe(true);
    }
    // CAT / CART / CARS / CARTED etc should appear.
    const words = new Set(moves.flatMap((m) => m.words));
    expect(words.has('CAT')).toBe(true);
  });

  it('generates connecting plays on a non-empty board', () => {
    let board = emptyBoard();
    board = placeWord(board, 'CAT', 7, 6, 'across');
    const rack = rackFrom('SRDEART');
    const moves = generateMoves(board, rack, dict);
    expect(moves.length).toBeGreaterThan(0);
    // Making CATS by hooking S should be found.
    const hasCats = moves.some((m) => m.words.includes('CATS'));
    expect(hasCats).toBe(true);
  });

  it('uses blanks as wildcards (scored 0)', () => {
    const board = emptyBoard();
    const rack = rackFrom('C_T'); // blank in the middle -> CAT
    const moves = generateMoves(board, rack, dict);
    const cat = moves.find((m) => m.words.includes('CAT'));
    expect(cat).toBeTruthy();
    // Blank contributes 0; C(3)+blank(0)+T(1)=4, center DW x2 = 8.
    expect(cat!.score).toBe(8);
  });

  it('PROPERTY: every generated move passes the rules validator', () => {
    const scenarios: { setup: () => ReturnType<typeof emptyBoard>; rack: string }[] = [
      { setup: () => emptyBoard(), rack: 'CATREDS' },
      { setup: () => placeWord(emptyBoard(), 'CAT', 7, 6, 'across'), rack: 'SRDEOAT' },
      { setup: () => placeWord(emptyBoard(), 'WORD', 7, 5, 'across'), rack: 'SEATIER' },
      { setup: () => placeWord(emptyBoard(), 'HEN', 7, 7, 'down'), rack: 'SITOARE' },
      { setup: () => emptyBoard(), rack: 'QI_ZOOA' },
    ];
    for (const sc of scenarios) {
      const board = sc.setup();
      const rack = rackFrom(sc.rack);
      const moves = generateMoves(board, rack, dict);
      for (const m of moves) {
        const v = validatePlay(board, m.placements, dict);
        expect(v.legal, `move ${m.words.join(',')} should be legal`).toBe(true);
      }
    }
  });

  it('never reuses a rack tile within one move', () => {
    let board = emptyBoard();
    board = placeWord(board, 'CAT', 7, 6, 'across');
    const rack = rackFrom('SSAERTO');
    const moves = generateMoves(board, rack, dict);
    for (const m of moves) {
      const ids = m.placements.map((p) => p.tile.id);
      expect(new Set(ids).size).toBe(ids.length);
    }
  });
});

describe('difficulty policy', () => {
  const board = emptyBoard();
  const rack = rackFrom('CATREDS');
  const moves = generateMoves(board, rack, dict);

  it('hard picks the (near-)highest score', () => {
    const maxScore = Math.max(...moves.map((m) => m.score));
    const hard = chooseMove(moves, rack, 'hard', Math.random)!;
    // Within the leave-heuristic slack of the true max.
    expect(hard.score).toBeGreaterThanOrEqual(maxScore - 5);
  });

  it('easy picks from a lower-scoring band', () => {
    const sorted = [...moves].sort((a, b) => a.score - b.score);
    const bandMax = sorted[Math.max(0, Math.floor(sorted.length * 0.4) - 1)].score;
    let rngState = 0.5;
    const easy = chooseMove(moves, rack, 'easy', () => rngState)!;
    expect(easy.score).toBeLessThanOrEqual(bandMax);
  });

  it('returns null when there are no moves', () => {
    expect(chooseMove([], rack, 'hard')).toBeNull();
  });

  it('leave heuristic values blanks and S, penalizes imbalance', () => {
    expect(leaveValue(['_'])).toBeGreaterThan(leaveValue(['S']));
    expect(leaveValue(['S'])).toBeGreaterThan(leaveValue(['Q']));
    // balanced better than all-vowels
    expect(leaveValue(['A', 'T'])).toBeGreaterThan(leaveValue(['A', 'E']));
  });
});
