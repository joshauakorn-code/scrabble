import { useState } from 'react';
import { Tile } from '../../engine/types';
import TileView from '../Tile';

interface Props {
  rack: Tile[];
  onConfirm: (tileIds: string[]) => void;
  onCancel: () => void;
}

export default function ExchangeModal({ rack, onConfirm, onCancel }: Props) {
  const [selected, setSelected] = useState<Set<string>>(new Set());

  const toggle = (id: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
      <div className="w-full max-w-md rounded-2xl bg-slate-800 p-5 ring-1 ring-white/10 shadow-2xl">
        <h3 className="text-lg font-bold text-white mb-1">Exchange tiles</h3>
        <p className="text-sm text-slate-400 mb-4">
          Select the tiles to swap back into the bag. This forfeits your turn.
        </p>
        <div className="flex flex-wrap justify-center gap-2 mb-5">
          {rack.map((t) => (
            <TileView
              key={t.id}
              tile={t}
              size="rack"
              selected={selected.has(t.id)}
              onClick={() => toggle(t.id)}
            />
          ))}
        </div>
        <div className="flex gap-3">
          <button
            type="button"
            onClick={() => onConfirm([...selected])}
            disabled={selected.size === 0}
            className="flex-1 py-2.5 rounded-lg bg-emerald-500 hover:bg-emerald-400 disabled:opacity-40 text-white font-semibold transition"
          >
            Exchange {selected.size > 0 ? `(${selected.size})` : ''}
          </button>
          <button
            type="button"
            onClick={onCancel}
            className="flex-1 py-2.5 rounded-lg bg-slate-700 hover:bg-slate-600 text-slate-100 font-semibold transition"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}
