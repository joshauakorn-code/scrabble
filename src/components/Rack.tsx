import { useDroppable } from '@dnd-kit/core';
import { SortableContext, horizontalListSortingStrategy } from '@dnd-kit/sortable';
import { Tile } from '../engine/types';
import SortableRackTile from './SortableRackTile';

interface RackProps {
  tiles: Tile[];
  selectedTileId: string | null;
  onSelect: (id: string | null) => void;
  interactive: boolean;
  shuffling: boolean;
}

export default function Rack({ tiles, selectedTileId, onSelect, interactive, shuffling }: RackProps) {
  const { setNodeRef, isOver } = useDroppable({ id: 'rack', data: { rack: true } });
  const items = tiles.map((t) => `r-${t.id}`);

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
      <SortableContext items={items} strategy={horizontalListSortingStrategy}>
        {tiles.map((t, i) => (
          <SortableRackTile
            key={t.id}
            tile={t}
            selected={selectedTileId === t.id}
            shuffling={shuffling}
            delayMs={i * 45}
            onClick={
              interactive
                ? () => onSelect(selectedTileId === t.id ? null : t.id)
                : undefined
            }
          />
        ))}
      </SortableContext>
    </div>
  );
}
