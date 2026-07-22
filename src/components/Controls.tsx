import { PreviewInfo } from '../state/useScrabble';

interface ControlsProps {
  preview: PreviewInfo | null;
  canPlay: boolean;
  canExchange: boolean;
  provisionalCount: number;
  disabled: boolean;
  onPlay: () => void;
  onRecall: () => void;
  onShuffle: () => void;
  onExchange: () => void;
  onPass: () => void;
}

function Btn({
  children,
  onClick,
  disabled,
  variant = 'default',
}: {
  children: React.ReactNode;
  onClick: () => void;
  disabled?: boolean;
  variant?: 'default' | 'primary' | 'danger';
}) {
  const styles =
    variant === 'primary'
      ? 'bg-emerald-500 hover:bg-emerald-400 text-white'
      : variant === 'danger'
        ? 'bg-rose-600/80 hover:bg-rose-500 text-white'
        : 'bg-slate-700 hover:bg-slate-600 text-slate-100';
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={[
        'px-3 py-2 rounded-lg text-sm font-semibold transition active:scale-95',
        'disabled:opacity-40 disabled:cursor-not-allowed disabled:active:scale-100',
        styles,
      ].join(' ')}
    >
      {children}
    </button>
  );
}

export default function Controls({
  preview,
  canPlay,
  canExchange,
  provisionalCount,
  disabled,
  onPlay,
  onRecall,
  onShuffle,
  onExchange,
  onPass,
}: ControlsProps) {
  return (
    <div className="space-y-3">
      <div className="min-h-[1.5rem] text-sm">
        {preview ? (
          preview.legal ? (
            <span className="text-emerald-300 font-semibold">
              {preview.words.join(', ')} — {preview.score} pts
            </span>
          ) : (
            <span className="text-rose-300">{preview.reason}</span>
          )
        ) : (
          <span className="text-slate-400">Place tiles to preview your play.</span>
        )}
      </div>
      <div className="grid grid-cols-3 gap-2 sm:flex sm:flex-wrap">
        <Btn onClick={onPlay} disabled={disabled || !canPlay || !preview?.legal} variant="primary">
          Play
        </Btn>
        <Btn onClick={onRecall} disabled={disabled || provisionalCount === 0}>
          Recall
        </Btn>
        <Btn onClick={onShuffle} disabled={disabled}>
          Shuffle
        </Btn>
        <Btn onClick={onExchange} disabled={disabled || !canExchange} variant="default">
          Exchange
        </Btn>
        <Btn onClick={onPass} disabled={disabled} variant="danger">
          Pass
        </Btn>
      </div>
    </div>
  );
}
