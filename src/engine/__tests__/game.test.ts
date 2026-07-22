import { describe, it, expect } from 'vitest';
import { newGame, applyPlay, applyPass, applyExchange, finalizeScores } from '../game';
import { RACK_SIZE } from '../types';
import { testDict, placement } from './helpers';

const dict = testDict();

function seededRng(seed: number) {
  let s = seed;
  return () => {
    s = (s * 1103515245 + 12345) & 0x7fffffff;
    return s / 0x7fffffff;
  };
}

describe('game state machine', () => {
  it('deals two racks of 7 and an 86-tile bag', () => {
    const g = newGame({ players: [
      { name: 'A', kind: 'human' },
      { name: 'B', kind: 'human' },
    ], rng: seededRng(1) });
    expect(g.players[0].rack.length).toBe(RACK_SIZE);
    expect(g.players[1].rack.length).toBe(RACK_SIZE);
    expect(g.bag.length).toBe(100 - 2 * RACK_SIZE);
  });

  it('applies a play, scores it, refills the rack, and advances the turn', () => {
    const g = newGame({ players: [
      { name: 'A', kind: 'human' },
      { name: 'B', kind: 'human' },
    ], rng: seededRng(2) });
    const res = applyPlay(g, [
      placement('C', 7, 6),
      placement('A', 7, 7),
      placement('T', 7, 8),
    ], dict);
    expect(res.ok).toBe(true);
    expect(res.score).toBe(10);
    expect(res.state.players[0].score).toBe(10);
    expect(res.state.players[0].rack.length).toBe(RACK_SIZE); // refilled
    expect(res.state.currentPlayer).toBe(1);
    // original state unmutated
    expect(g.players[0].score).toBe(0);
  });

  it('rejects an illegal play without changing state', () => {
    const g = newGame({ players: [
      { name: 'A', kind: 'human' },
      { name: 'B', kind: 'human' },
    ], rng: seededRng(3) });
    const res = applyPlay(g, [placement('A', 0, 0)], dict);
    expect(res.ok).toBe(false);
    expect(res.state).toBe(g);
  });

  it('counts scoreless turns and passes advance the turn', () => {
    let g = newGame({ players: [
      { name: 'A', kind: 'human' },
      { name: 'B', kind: 'human' },
    ], rng: seededRng(4) });
    g = applyPass(g).state;
    expect(g.scorelessTurns).toBe(1);
    expect(g.currentPlayer).toBe(1);
  });

  it('ends the game after 6 consecutive scoreless turns', () => {
    let g = newGame({ players: [
      { name: 'A', kind: 'human' },
      { name: 'B', kind: 'human' },
    ], rng: seededRng(5) });
    for (let i = 0; i < 6; i++) g = applyPass(g).state;
    expect(g.phase).toBe('gameover');
  });

  it('exchange is illegal when the bag has < 7 tiles', () => {
    const g = newGame({ players: [
      { name: 'A', kind: 'human' },
      { name: 'B', kind: 'human' },
    ], rng: seededRng(6) });
    // drain the bag down to 3
    g.bag = g.bag.slice(0, 3);
    const ids = g.players[0].rack.slice(0, 2).map((t) => t.id);
    const res = applyExchange(g, ids);
    expect(res.ok).toBe(false);
  });

  it('exchange swaps tiles and keeps the bag size constant', () => {
    const g = newGame({ players: [
      { name: 'A', kind: 'human' },
      { name: 'B', kind: 'human' },
    ], rng: seededRng(7) });
    const bagBefore = g.bag.length;
    const ids = g.players[0].rack.slice(0, 3).map((t) => t.id);
    const res = applyExchange(g, ids);
    expect(res.ok).toBe(true);
    expect(res.state.bag.length).toBe(bagBefore);
    expect(res.state.players[0].rack.length).toBe(RACK_SIZE);
    expect(res.state.currentPlayer).toBe(1);
  });

  it('final scoring subtracts unplayed tiles and rewards going out', () => {
    const g = newGame({ players: [
      { name: 'A', kind: 'human' },
      { name: 'B', kind: 'human' },
    ], rng: seededRng(8) });
    // Rig scores and racks.
    g.players[0].score = 50;
    g.players[1].score = 40;
    g.players[0].rack = []; // A went out
    // B holds tiles worth, say, 8.
    g.players[1].rack = [
      { id: 'x', letter: 'Q', value: 10, isBlank: false },
    ];
    finalizeScores(g);
    // A: 50 + 10 (opp tiles) = 60; B: 40 - 10 = 30.
    expect(g.players[0].score).toBe(60);
    expect(g.players[1].score).toBe(30);
    expect(g.winnerIds).toEqual([0]);
    expect(g.phase).toBe('gameover');
  });
});
