import { Board as BoardType, Placement } from '../engine/types';
import { PREMIUMS } from '../engine/board';
import Square from './Square';
import DraggableTile from './DraggableTile';

interface BoardProps {
  board: BoardType;
  provisional: Placement[];
  onSquareClick: (row: number, col: number) => void;
  onRecall: (row: number, col: number) => void;
  interactive: boolean;
}

export default function BoardView({
  board,
  provisional,
  onSquareClick,
  onRecall,
  interactive,
}: BoardProps) {
  const provAt = (r: number, c: number) =>
    provisional.find((p) => p.row === r && p.col === c) ?? null;

  return (
    <div className="w-full max-w-[min(92vw,640px)] mx-auto">
      <div className="grid grid-cols-15 gap-[2px] rounded-lg bg-emerald-950 p-[2px] shadow-2xl ring-1 ring-black/40"
        style={{ gridTemplateColumns: 'repeat(15, minmax(0, 1fr))' }}>
        {board.map((rowArr, r) =>
          rowArr.map((cell, c) => (
            <Square
              key={`${r}-${c}`}
              row={r}
              col={c}
              premium={PREMIUMS[r][c]}
              committed={cell}
              provisional={provAt(r, c)}
              isTarget={false}
              onSquareClick={onSquareClick}
              onTileClick={onRecall}
              draggableProvisional={
                interactive
                  ? (p) => (
                      <div className="w-full h-full" onClick={() => onRecall(p.row, p.col)}>
                        <DraggableTile
                          tile={p.tile}
                          origin="board"
                          size="board"
                          provisional
                        />
                      </div>
                    )
                  : undefined
              }
            />
          )),
        )}
      </div>
    </div>
  );
}
