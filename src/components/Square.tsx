import { useDroppable } from '@dnd-kit/core';
import { PlacedTile, Placement, Premium } from '../engine/types';
import TileView from './Tile';
import { premiumClasses, premiumLabel } from './premiumStyles';

interface SquareProps {
  row: number;
  col: number;
  premium: Premium;
  committed: PlacedTile | null;
  provisional: Placement | null;
  isTarget: boolean;
  onSquareClick: (row: number, col: number) => void;
  onTileClick: (row: number, col: number) => void;
  draggableProvisional?: (p: Placement) => React.ReactNode;
}

export default function Square({
  row,
  col,
  premium,
  committed,
  provisional,
  isTarget,
  onSquareClick,
  onTileClick,
  draggableProvisional,
}: SquareProps) {
  const { setNodeRef, isOver } = useDroppable({
    id: `sq-${row}-${col}`,
    data: { row, col },
    disabled: !!committed || !!provisional,
  });

  const base =
    'relative aspect-square flex items-center justify-center select-none';

  if (committed) {
    return (
      <div className={base}>
        <TileView tile={committed} size="board" />
      </div>
    );
  }

  if (provisional) {
    return (
      <div className={base}>
        {draggableProvisional ? (
          draggableProvisional(provisional)
        ) : (
          <div className="w-full h-full" onClick={() => onTileClick(row, col)}>
            <TileView tile={provisional.tile} size="board" provisional />
          </div>
        )}
      </div>
    );
  }

  return (
    <div
      ref={setNodeRef}
      onClick={() => onSquareClick(row, col)}
      className={[
        base,
        'cursor-pointer text-[1.6vmin] sm:text-[0.6rem] font-bold rounded-[3px]',
        premiumClasses(premium),
        isOver || isTarget ? 'ring-2 ring-yellow-300 z-10' : '',
      ].join(' ')}
    >
      <span className="opacity-90 leading-none pointer-events-none">
        {premiumLabel(premium)}
      </span>
    </div>
  );
}
