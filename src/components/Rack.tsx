import { useDroppable } from '@dnd-kit/core';
import { Tile } from '../engine/types';
import DraggableTile from './DraggableTile';

interface RackProps {
  tiles: Tile[];
  selectedTileId: string | null;
  onSelect: (id: string | null) => void;
  interactive: boolean;
}

export default function Rack({ tiles, selectedTileId, onSelect, interactive }: RackProps) {
  const { setNodeRef, isOver } = useDroppable({ id: 'rack', data: { rack: true } });

  return (
    <div
      ref={setNodeRef}
      className={[
        'flex items-center justify-center gap-1.5 sm:gap-2 rounded-xl p-2.5 sm:p-3 min-h-[64px]',
        'bg-gradient-to-b from-amber-900 to-amber-950 shadow-inner ring-1 ring-black/40',
        isOver ? 'ring-2 ring-yellow-300' : '',
      ].join(' ')}
    >
      {tiles.length === 0 && (
        <span className="text-amber-200/60 text-sm">Rack empty</span>
      )}
      {tiles.map((t) => (
        <DraggableTile
          key={t.id}
          tile={t}
          origin="rack"
          size="rack"
          selected={selectedTileId === t.id}
          onClick={
            interactive
              ? () => onSelect(selectedTileId === t.id ? null : t.id)
              : undefined
          }
        />
      ))}
    </div>
  );
}
