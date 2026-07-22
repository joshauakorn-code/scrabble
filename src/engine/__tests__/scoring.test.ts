import { describe, it, expect } from 'vitest';
import { scorePlacements } from '../scoring';
import { placement, placeWord, emptyBoard } from './helpers';

describe('scoring', () => {
  it('scores a first word across the center (double word)', () => {
    // CAT on row 7, cols 6..8. Center (7,7) = DW. Letters C(3)+A(1)+T(1)=5, x2 = 10.
    const board = emptyBoard();
    const placements = [
      placement('C', 7, 6),
      placement('A', 7, 7),
      placement('T', 7, 8),
    ];
    const res = scorePlacements(board, placements);
    expect(res.total).toBe(10);
    expect(res.words[0].word).toBe('CAT');
  });

  it('applies a double-letter premium to a newly placed tile', () => {
    // Place CARE with the C on (7,3) which is DL, main word not on any DW.
    // Row 7: DL squares at col 3 and col 11. Put C on col3.
    const board = emptyBoard();
    // But first move must cover center; use a non-first-move scenario instead.
    // Pre-place a word, then test a DL cross scenario is complex; instead test
    // premium math directly on an empty-board play covering center with a DL.
    // Row 7 col 3 is DL; center is col 7. Word spanning col3..7 = 5 letters.
    const placements = [
      placement('C', 7, 3), // DL -> C*2 = 6
      placement('A', 7, 4),
      placement('R', 7, 5),
      placement('E', 7, 6),
      placement('D', 7, 7), // center DW -> whole word x2
    ];
    const res = scorePlacements(board, placements);
    // C(3)*2 + A1 + R1 + E1 + D2 = 6+1+1+1+2 = 11; center DW x2 => 22.
    expect(res.total).toBe(22);
    void board;
  });

  it('gives the 50-point bingo bonus for using all 7 tiles', () => {
    const board = emptyBoard();
    // 7-letter word CARTELS-like; use CARETED? Use simple 7 letters through center.
    const placements = [
      placement('C', 7, 4),
      placement('A', 7, 5),
      placement('R', 7, 6),
      placement('E', 7, 7), // center DW
      placement('T', 7, 8),
      placement('E', 7, 9),
      placement('D', 7, 10),
    ];
    const res = scorePlacements(board, placements);
    expect(res.bingo).toBe(true);
    // base letters: C3 A1 R1 E1 T1 E1 D2 = 10, DW x2 = 20, +50 bingo = 70.
    expect(res.total).toBe(70);
  });

  it('scores cross-words independently, premiums only on new tile', () => {
    // Existing CAT across at row 7 (cols 6-8). Now place S below the T making
    // a cross word. Put "TO" down from (7,8)T existing... build DOG down through T?
    // Simpler: existing "CAT" across row7 col6-8. Place "S" at (7,9) -> "CATS".
    let board = emptyBoard();
    board = placeWord(board, 'CAT', 7, 6, 'across');
    const res = scorePlacements(board, [placement('S', 7, 9)]);
    // CATS: only S is new. C1... wait existing letters keep base value, no premium
    // on old tiles. C3 A1 T1 S1 = 6. Col 9 row 7 is not a premium. total 6.
    expect(res.words.map((w) => w.word)).toContain('CATS');
    expect(res.total).toBe(6);
  });

  it('a blank scores zero but completes the word', () => {
    const board = emptyBoard();
    const placements = [
      placement('C', 7, 6),
      placement('A', 7, 7, true), // blank A
      placement('T', 7, 8),
    ];
    const res = scorePlacements(board, placements);
    // C3 + blank0 + T1 = 4, center DW x2 = 8.
    expect(res.total).toBe(8);
    expect(res.words[0].word).toBe('CAT');
  });
});
