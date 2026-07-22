interface Props {
  onPick: (letter: string) => void;
  onCancel: () => void;
}

const LETTERS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('');

export default function BlankPicker({ onPick, onCancel }: Props) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
      <div className="w-full max-w-md rounded-2xl bg-slate-800 p-5 ring-1 ring-white/10 shadow-2xl">
        <h3 className="text-lg font-bold text-white mb-1">Choose a letter</h3>
        <p className="text-sm text-slate-400 mb-4">
          This blank tile will represent the letter you pick (worth 0 points), fixed for the game.
        </p>
        <div className="grid grid-cols-6 sm:grid-cols-7 gap-2">
          {LETTERS.map((l) => (
            <button
              key={l}
              type="button"
              onClick={() => onPick(l)}
              className="aspect-square rounded-lg bg-amber-200 text-slate-900 font-bold text-lg hover:bg-amber-100 active:scale-95 transition"
            >
              {l}
            </button>
          ))}
        </div>
        <button
          type="button"
          onClick={onCancel}
          className="mt-4 w-full py-2 rounded-lg bg-slate-700 text-slate-200 hover:bg-slate-600 transition"
        >
          Cancel
        </button>
      </div>
    </div>
  );
}
