import { describe, it, expect } from 'vitest';
import { createBag, TILE_DISTRIBUTION, drawTiles, shuffle } from '../tiles';

describe('tile bag', () => {
  it('totals 100 tiles', () => {
    expect(createBag().length).toBe(100);
  });

  it('has correct per-letter counts', () => {
    const bag = createBag();
    const counts: Record<string, number> = {};
    for (const t of bag) {
      const key = t.isBlank ? '_' : t.letter;
      counts[key] = (counts[key] ?? 0) + 1;
    }
    for (const [letter, expected] of Object.entries(TILE_DISTRIBUTION)) {
      expect(counts[letter], `count for ${letter}`).toBe(expected);
    }
  });

  it('has 2 blanks worth 0 points', () => {
    const blanks = createBag().filter((t) => t.isBlank);
    expect(blanks.length).toBe(2);
    expect(blanks.every((t) => t.value === 0)).toBe(true);
  });

  it('point values match the standard set', () => {
    const bag = createBag();
    const val = (l: string) => bag.find((t) => t.letter === l)!.value;
    expect(val('Q')).toBe(10);
    expect(val('Z')).toBe(10);
    expect(val('J')).toBe(8);
    expect(val('X')).toBe(8);
    expect(val('K')).toBe(5);
    expect(val('E')).toBe(1);
  });

  it('draw removes tiles from the bag', () => {
    const bag = createBag();
    const drawn = drawTiles(bag, 7);
    expect(drawn.length).toBe(7);
    expect(bag.length).toBe(93);
  });

  it('shuffle preserves the multiset', () => {
    const bag = createBag();
    const shuffled = shuffle(bag);
    expect(shuffled.length).toBe(100);
    expect(new Set(shuffled.map((t) => t.id)).size).toBe(100);
  });
});
