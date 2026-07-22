import { Board, Placement, Tile } from '../types';
import { createEmptyBoard } from '../board';
import { LETTER_VALUES } from '../tiles';
import { Dictionary } from '../dictionary';

let idc = 0;
export function tile(letter: string, isBlank = false): Tile {
  idc += 1;
  const L = letter.toUpperCase();
  return {
    id: `t${idc}`,
    letter: L,
    value: isBlank ? 0 : LETTER_VALUES[L] ?? 0,
    isBlank,
  };
}

export function placement(letter: string, row: number, col: number, isBlank = false): Placement {
  return { tile: tile(letter, isBlank), row, col };
}

/** Place committed letters directly on a board (word helper). */
export function placeWord(
  board: Board,
  word: string,
  row: number,
  col: number,
  dir: 'across' | 'down',
): Board {
  const next = board.map((r) => r.slice());
  for (let i = 0; i < word.length; i++) {
    const r = dir === 'down' ? row + i : row;
    const c = dir === 'across' ? col + i : col;
    const t = tile(word[i]);
    next[r][c] = { ...t, row: r, col: c };
  }
  return next;
}

export function emptyBoard(): Board {
  return createEmptyBoard();
}

/** A small test dictionary. */
export const TEST_WORDS = [
  'CAT', 'CATS', 'CARE', 'CARED', 'CAR', 'CARS', 'CART', 'ART', 'ARTS',
  'AT', 'AS', 'IS', 'IT', 'TO', 'ON', 'NO', 'OR', 'HE', 'HEN', 'HENS',
  'QUIZ', 'ZOO', 'DOG', 'DOGS', 'GO', 'GOD', 'AX', 'OX', 'BOX', 'FOX',
  'HI', 'HIT', 'HITS', 'BE', 'BED', 'BID', 'WORD', 'WORDS', 'WORE', 'ORE',
  'RATE', 'RATED', 'TEA', 'EAT', 'ATE', 'SEA', 'SEAT', 'EAST', 'AWE',
  'JO', 'JOE', 'EX', 'XI', 'ZA', 'QI', 'AA', 'NA', 'AN', 'IN', 'NIT',
];

export function testDict(): Dictionary {
  return new Dictionary(TEST_WORDS);
}
