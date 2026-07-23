import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Tile } from '../engine/types';
import TileView from './Tile';

interface Props {
  tile: Tile;
  selected?: boolean;
  shuffling?: boolean;
  delayMs?: number;
  onClick?: () => void;
}

/**
 * A rack tile that is draggable to the board AND sortable within the rack
 * (drag it left/right past its neighbours to reorder). Also plays a brief
 * flip animation when the rack is shuffled.
 */
export default function SortableRackTile({
  tile,
  selected,
  shuffling,
  delayMs = 0,
  onClick,
}: Props) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } =
    useSortable({ id: `r-${tile.id}`, data: { tileId: tile.id, origin: 'rack' } });

  const style: React.CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.4 : 1,
    zIndex: isDragging ? 50 : undefined,
    touchAction: 'none',
    animationDelay: shuffling ? `${delayMs}ms` : undefined,
  };

  return (
    <div ref={setNodeRef} style={style} className={shuffling && !isDragging ? 'animate-shuffle' : ''}>
      <TileView
        tile={tile}
        size="rack"
        selected={selected}
        onClick={onClick}
        dragHandleProps={{ ...listeners, ...attributes }}
      />
    </div>
  );
}
