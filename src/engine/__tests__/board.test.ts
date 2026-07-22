import { describe, it, expect } from 'vitest';
import { PREMIUMS, premiumCounts, createEmptyBoard } from '../board';
import { BOARD_SIZE } from '../types';

describe('board premiums', () => {
  it('has the standard tournament counts', () => {
    const c = premiumCounts();
    expect(c.TW).toBe(8);
    expect(c.DW).toBe(17); // includes center
    expect(c.TL).toBe(12);
    expect(c.DL).toBe(24);
  });

  it('center is a double word (star)', () => {
    expect(PREMIUMS[7][7]).toBe('CENTER');
  });

  it('is symmetric across both diagonals', () => {
    for (let r = 0; r < BOARD_SIZE; r++) {
      for (let c = 0; c < BOARD_SIZE; c++) {
        const norm = (p: string | null) => (p === 'CENTER' ? 'DW' : p);
        // main diagonal (transpose)
        expect(norm(PREMIUMS[r][c])).toBe(norm(PREMIUMS[c][r]));
        // anti-diagonal
        expect(norm(PREMIUMS[r][c])).toBe(
          norm(PREMIUMS[BOARD_SIZE - 1 - c][BOARD_SIZE - 1 - r]),
        );
      }
    }
  });

  it('is symmetric across horizontal & vertical axes', () => {
    for (let r = 0; r < BOARD_SIZE; r++) {
      for (let c = 0; c < BOARD_SIZE; c++) {
        expect(PREMIUMS[r][c]).toBe(PREMIUMS[r][BOARD_SIZE - 1 - c]);
        expect(PREMIUMS[r][c]).toBe(PREMIUMS[BOARD_SIZE - 1 - r][c]);
      }
    }
  });

  it('creates an empty 15x15 board', () => {
    const b = createEmptyBoard();
    expect(b.length).toBe(15);
    expect(b.every((row) => row.length === 15)).toBe(true);
    expect(b.flat().every((cell) => cell === null)).toBe(true);
  });
});
