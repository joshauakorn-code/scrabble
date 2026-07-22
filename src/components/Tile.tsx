import { Tile as TileType } from '../engine/types';

interface TileProps {
  tile: TileType;
  /** Size preset. */
  size?: 'board' | 'rack';
  selected?: boolean;
  provisional?: boolean;
  onClick?: () => void;
  dragHandleProps?: Record<string, unknown>;
  style?: React.CSSProperties;
}

/** A single lettered tile. Blanks show their assigned letter with a marker. */
export default function TileView({
  tile,
  size = 'rack',
  selected,
  provisional,
  onClick,
  dragHandleProps,
  style,
}: TileProps) {
  const dims =
    size === 'board'
      ? 'w-full h-full text-[3.2vmin] sm:text-base'
      : 'w-11 h-11 sm:w-12 sm:h-12 text-lg';
  return (
    <button
      type="button"
      onClick={onClick}
      style={style}
      {...dragHandleProps}
      className={[
        'no-select relative flex items-center justify-center rounded-md font-bold',
        'bg-gradient-to-br from-amber-100 to-amber-300 text-slate-900',
        'shadow-[inset_0_-2px_0_rgba(0,0,0,0.15),0_1px_2px_rgba(0,0,0,0.3)]',
        'border border-amber-400/60 touch-none transition',
        dims,
        selected ? 'ring-2 ring-yellow-300 -translate-y-1' : '',
        provisional ? 'ring-2 ring-yellow-400 animate-pop' : '',
        tile.isBlank ? 'italic' : '',
        onClick ? 'cursor-pointer active:scale-95' : '',
      ].join(' ')}
      aria-label={tile.isBlank ? `Blank tile as ${tile.letter || 'unassigned'}` : `Tile ${tile.letter}`}
    >
      <span>{tile.letter || '?'}</span>
      {!tile.isBlank && tile.value > 0 && (
        <span className="absolute bottom-0.5 right-1 text-[0.5rem] font-semibold leading-none">
          {tile.value}
        </span>
      )}
      {tile.isBlank && (
        <span className="absolute bottom-0.5 right-1 text-[0.5rem] font-semibold leading-none text-rose-500">
          ✦
        </span>
      )}
    </button>
  );
}
