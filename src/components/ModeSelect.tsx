import { useState } from 'react';
import { Difficulty } from '../engine/types';
import { GameConfig } from '../state/useScrabble';

interface Props {
  onStart: (config: GameConfig) => void;
}

export default function ModeSelect({ onStart }: Props) {
  const [mode, setMode] = useState<'hotseat' | 'ai'>('ai');
  const [difficulty, setDifficulty] = useState<Difficulty>('medium');
  const [p1, setP1] = useState('');
  const [p2, setP2] = useState('');

  const start = () => {
    onStart({ mode, playerNames: [p1, p2], difficulty });
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="w-full max-w-md rounded-2xl bg-slate-800/80 ring-1 ring-white/10 shadow-2xl p-6 sm:p-8">
        <div className="text-center mb-6">
          <h1 className="text-4xl font-black text-transparent bg-clip-text bg-gradient-to-r from-amber-300 to-emerald-300">
            SCRABBLE
          </h1>
          <p className="text-slate-400 text-sm mt-1">Classic word game · React + TypeScript</p>
        </div>

        <div className="grid grid-cols-2 gap-2 mb-5">
          <button
            type="button"
            onClick={() => setMode('ai')}
            className={[
              'py-3 rounded-xl font-semibold transition',
              mode === 'ai'
                ? 'bg-emerald-500 text-white ring-2 ring-emerald-300'
                : 'bg-slate-700 text-slate-200 hover:bg-slate-600',
            ].join(' ')}
          >
            vs Computer
          </button>
          <button
            type="button"
            onClick={() => setMode('hotseat')}
            className={[
              'py-3 rounded-xl font-semibold transition',
              mode === 'hotseat'
                ? 'bg-emerald-500 text-white ring-2 ring-emerald-300'
                : 'bg-slate-700 text-slate-200 hover:bg-slate-600',
            ].join(' ')}
          >
            Hotseat (2P)
          </button>
        </div>

        {mode === 'ai' && (
          <div className="mb-5">
            <label className="block text-sm text-slate-300 mb-2 font-medium">Difficulty</label>
            <div className="grid grid-cols-3 gap-2">
              {(['easy', 'medium', 'hard'] as Difficulty[]).map((d) => (
                <button
                  key={d}
                  type="button"
                  onClick={() => setDifficulty(d)}
                  className={[
                    'py-2 rounded-lg capitalize text-sm font-semibold transition',
                    difficulty === d
                      ? 'bg-amber-400 text-slate-900'
                      : 'bg-slate-700 text-slate-200 hover:bg-slate-600',
                  ].join(' ')}
                >
                  {d}
                </button>
              ))}
            </div>
          </div>
        )}

        <div className="space-y-3 mb-6">
          <input
            value={p1}
            onChange={(e) => setP1(e.target.value)}
            placeholder={mode === 'ai' ? 'Your name' : 'Player 1 name'}
            className="w-full rounded-lg bg-slate-900/70 border border-white/10 px-3 py-2 text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-400"
          />
          {mode === 'hotseat' && (
            <input
              value={p2}
              onChange={(e) => setP2(e.target.value)}
              placeholder="Player 2 name"
              className="w-full rounded-lg bg-slate-900/70 border border-white/10 px-3 py-2 text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-400"
            />
          )}
        </div>

        <button
          type="button"
          onClick={start}
          className="w-full py-3 rounded-xl bg-gradient-to-r from-emerald-500 to-emerald-400 text-white font-bold text-lg hover:brightness-110 active:scale-[0.99] transition shadow-lg"
        >
          Start Game
        </button>
      </div>
    </div>
  );
}
