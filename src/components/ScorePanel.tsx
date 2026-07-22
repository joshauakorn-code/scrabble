import { GameState } from '../engine/types';

interface Props {
  state: GameState;
  aiThinking: boolean;
}

export default function ScorePanel({ state, aiThinking }: Props) {
  return (
    <div className="rounded-xl bg-slate-800/70 ring-1 ring-white/10 p-3 space-y-2">
      <div className="flex items-center justify-between">
        <h2 className="text-slate-200 font-semibold text-sm uppercase tracking-wide">Scores</h2>
        <span className="text-xs text-slate-400">
          Bag: {state.bag.length}
        </span>
      </div>
      <div className="space-y-1.5">
        {state.players.map((p) => {
          const isCurrent = p.id === state.currentPlayer && state.phase === 'playing';
          const isWinner = state.winnerIds.includes(p.id);
          return (
            <div
              key={p.id}
              className={[
                'flex items-center justify-between rounded-lg px-3 py-2 transition',
                isCurrent ? 'bg-emerald-600/30 ring-1 ring-emerald-400/50' : 'bg-slate-900/40',
              ].join(' ')}
            >
              <div className="flex items-center gap-2 min-w-0">
                <span
                  className={[
                    'inline-block w-2 h-2 rounded-full flex-shrink-0',
                    isCurrent ? 'bg-emerald-400 animate-pulse' : 'bg-slate-600',
                  ].join(' ')}
                />
                <span className="text-slate-100 font-medium truncate">
                  {p.name}
                  {isWinner && ' 👑'}
                </span>
                {isCurrent && p.kind === 'ai' && aiThinking && (
                  <span className="text-xs text-emerald-300 animate-pulse">thinking…</span>
                )}
              </div>
              <span className="text-lg font-bold text-white tabular-nums">{p.score}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
