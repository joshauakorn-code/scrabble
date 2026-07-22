import { GameState } from '../../engine/types';

interface Props {
  state: GameState;
  onNewGame: () => void;
  onMenu: () => void;
}

export default function GameOver({ state, onNewGame, onMenu }: Props) {
  const winners = state.players.filter((p) => state.winnerIds.includes(p.id));
  const tie = winners.length > 1;
  const sorted = [...state.players].sort((a, b) => b.score - a.score);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4">
      <div className="w-full max-w-md rounded-2xl bg-slate-800 p-6 ring-1 ring-white/10 shadow-2xl">
        <h2 className="text-2xl font-bold text-white text-center mb-1">Game Over</h2>
        <p className="text-center text-emerald-300 font-semibold mb-4">
          {tie
            ? `Tie between ${winners.map((w) => w.name).join(' & ')}!`
            : `${winners[0]?.name} wins! 🎉`}
        </p>
        <div className="space-y-2 mb-5">
          {sorted.map((p) => (
            <div
              key={p.id}
              className="flex items-center justify-between rounded-lg bg-slate-900/50 px-4 py-2"
            >
              <span className="text-slate-100 font-medium">
                {p.name}
                {state.winnerIds.includes(p.id) && ' 👑'}
              </span>
              <span className="text-xl font-bold text-white tabular-nums">{p.score}</span>
            </div>
          ))}
        </div>
        <p className="text-xs text-slate-400 text-center mb-4">
          Final scores include end-game adjustments for unplayed tiles.
        </p>
        <div className="flex gap-3">
          <button
            type="button"
            onClick={onNewGame}
            className="flex-1 py-2.5 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-white font-semibold transition"
          >
            Rematch
          </button>
          <button
            type="button"
            onClick={onMenu}
            className="flex-1 py-2.5 rounded-lg bg-slate-700 hover:bg-slate-600 text-slate-100 font-semibold transition"
          >
            Main Menu
          </button>
        </div>
      </div>
    </div>
  );
}
