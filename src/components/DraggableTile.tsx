import { useDraggable } from '@dnd-kit/core';
import { CSS } from '@dnd-kit/utilities';
import { Tile } from '../engine/types';
import TileView from './Tile';

interface Props {
  tile: Tile;
  origin: 'rack' | 'board';
  size?: 'board' | 'rack';
  selected?: boolean;
  provisional?: boolean;
  onClick?: () => void;
}

/** A tile wrapped so it can be dragged with @dnd-kit. */
export default function DraggableTile({
  tile,
  origin,
  size,
  selected,
  provisional,
  onClick,
}: Props) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: `tile-${tile.id}`,
    data: { tileId: tile.id, origin },
  });

  const style: React.CSSProperties = {
    transform: CSS.Translate.toString(transform),
    opacity: isDragging ? 0.4 : 1,
    zIndex: isDragging ? 50 : undefined,
    touchAction: 'none',
  };

  return (
    <div ref={setNodeRef} style={style} className={size === 'board' ? 'w-full h-full' : ''}>
      <TileView
        tile={tile}
        size={size}
        selected={selected}
        provisional={provisional}
        onClick={onClick}
        dragHandleProps={{ ...listeners, ...attributes }}
      />
    </div>
  );
}
