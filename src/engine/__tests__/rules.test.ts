import { describe, it, expect } from 'vitest';
import { validatePlay } from '../rules';
import { placement, placeWord, emptyBoard, testDict } from './helpers';

const dict = testDict();

describe('rules — first move', () => {
  it('rejects a first move that misses the center', () => {
    const board = emptyBoard();
    const res = validatePlay(board, [placement('C', 0, 0), placement('A', 0, 1), placement('T', 0, 2)], dict);
    expect(res.legal).toBe(false);
    expect(res.reason).toMatch(/center/i);
  });

  it('rejects a single-tile first move', () => {
    const board = emptyBoard();
    const res = validatePlay(board, [placement('A', 7, 7)], dict);
    expect(res.legal).toBe(false);
  });

  it('accepts a valid first move over the center', () => {
    const board = emptyBoard();
    const res = validatePlay(board, [placement('C', 7, 6), placement('A', 7, 7), placement('T', 7, 8)], dict);
    expect(res.legal).toBe(true);
    expect(res.words).toEqual(['CAT']);
  });
});

describe('rules — later moves', () => {
  it('requires connection to existing tiles', () => {
    let board = emptyBoard();
    board = placeWord(board, 'CAT', 7, 6, 'across');
    // Disconnected play far away.
    const res = validatePlay(board, [placement('D', 0, 0), placement('O', 0, 1), placement('G', 0, 2)], dict);
    expect(res.legal).toBe(false);
    expect(res.reason).toMatch(/connect/i);
  });

  it('enforces single-line placement', () => {
    let board = emptyBoard();
    board = placeWord(board, 'CAT', 7, 6, 'across');
    const res = validatePlay(board, [placement('S', 7, 9), placement('O', 8, 9)], dict);
    // These are in different rows and cols — not a single line.
    expect(res.legal).toBe(false);
  });

  it('enforces contiguity (no gaps)', () => {
    let board = emptyBoard();
    board = placeWord(board, 'CAT', 7, 6, 'across');
    // Place with a gap: (7,10) and (7,12) leaving (7,11) empty.
    const res = validatePlay(board, [placement('A', 7, 10), placement('T', 7, 12)], dict);
    expect(res.legal).toBe(false);
    expect(res.reason).toMatch(/contiguous/i);
  });

  it('rejects a play forming an invalid cross-word', () => {
    let board = emptyBoard();
    board = placeWord(board, 'CAT', 7, 6, 'across');
    // Extend to CATS (valid main) but also place letters forming junk cross-word.
    // Place "XZ" down from S: put S at (7,9)->CATS, then Z at (8,9): cross "SZ"? no.
    // Instead: place a down word off the A that is invalid. A at (7,7). Place
    // "Q" at (6,7) and "Z" at (8,7): forms "QAZ" vertical — not a word.
    const res = validatePlay(board, [placement('Q', 6, 7), placement('Z', 8, 7)], dict);
    expect(res.legal).toBe(false);
    expect(res.reason).toMatch(/not a valid word/i);
  });

  it('accepts a valid extension forming valid cross-words', () => {
    let board = emptyBoard();
    board = placeWord(board, 'CAT', 7, 6, 'across');
    // Add S to make CATS.
    const res = validatePlay(board, [placement('S', 7, 9)], dict);
    expect(res.legal).toBe(true);
    expect(res.words).toContain('CATS');
  });

  it('rejects placing on an occupied square', () => {
    let board = emptyBoard();
    board = placeWord(board, 'CAT', 7, 6, 'across');
    const res = validatePlay(board, [placement('X', 7, 7)], dict);
    expect(res.legal).toBe(false);
  });
});
