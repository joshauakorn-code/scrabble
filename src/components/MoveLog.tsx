import { MoveLogEntry } from '../engine/types';

export default function MoveLog({ log }: { log: MoveLogEntry[] }) {
  return (
    <div className="rounded-xl bg-slate-800/70 ring-1 ring-white/10 p-3 flex flex-col min-h-0">
      <h2 className="text-slate-200 font-semibold text-sm uppercase tracking-wide mb-2">
        Move Log
      </h2>
      <div className="flex-1 overflow-y-auto space-y-1 max-h-56 pr-1">
        {log.length === 0 && (
          <p className="text-slate-500 text-sm">No moves yet.</p>
        )}
        {[...log].reverse().map((e, i) => (
          <div
            key={log.length - i}
            className="text-sm flex items-baseline justify-between gap-2 border-b border-white/5 pb-1"
          >
            <span className="text-slate-300 truncate">
              <span className="font-semibold text-slate-100">{e.playerName}</span>{' '}
              {e.type === 'play' && (
                <span className="text-slate-400">
                  {(e.words ?? []).join(', ') || 'played'}
                </span>
              )}
              {e.type === 'exchange' && <span className="text-slate-400">exchanged</span>}
              {e.type === 'pass' && <span className="text-slate-400">passed</span>}
            </span>
            <span className="text-emerald-300 font-semibold tabular-nums flex-shrink-0">
              {e.type === 'play' ? `+${e.score}` : '—'}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
