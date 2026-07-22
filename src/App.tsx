import { useState } from 'react';
import {
  DndContext,
  DragEndEvent,
  PointerSensor,
  TouchSensor,
  useSensor,
  useSensors,
  closestCenter,
} from '@dnd-kit/core';
import { useScrabble, GameConfig } from './state/useScrabble';
import { RACK_SIZE } from './engine/types';
import ModeSelect from './components/ModeSelect';
import BoardView from './components/Board';
import Rack from './components/Rack';
import Controls from './components/Controls';
import ScorePanel from './components/ScorePanel';
import MoveLog from './components/MoveLog';
import BlankPicker from './components/modals/BlankPicker';
import GameOver from './components/modals/GameOver';
import ExchangeModal from './components/modals/ExchangeModal';

export default function App() {
  const g = useScrabble();
  const [showExchange, setShowExchange] = useState(false);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 120, tolerance: 6 } }),
  );

  if (!g.state || !g.config) {
    return <ModeSelect onStart={(cfg: GameConfig) => g.startGame(cfg)} />;
  }

  const { state } = g;
  const humanTurn = state.players[state.currentPlayer].kind === 'human';
  const interactive = humanTurn && state.phase === 'playing' && g.dictReady && !g.aiThinking;
  const canExchange = interactive && state.bag.length >= RACK_SIZE;

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over) return;
    const tileId = (active.data.current as { tileId?: string })?.tileId;
    if (!tileId) return;
    const overData = over.data.current as { row?: number; col?: number; rack?: boolean } | undefined;
    if (overData?.rack) {
      // Dropped back on the rack: recall if it was a provisional board tile.
      const prov = g.provisional.find((p) => p.tile.id === tileId);
      if (prov) g.recallAt(prov.row, prov.col);
      return;
    }
    if (overData && typeof overData.row === 'number' && typeof overData.col === 'number') {
      g.placeTileAt(tileId, overData.row, overData.col);
    }
  };

  return (
    <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
      <div className="min-h-screen text-slate-100">
        <header className="flex items-center justify-between px-4 py-3 border-b border-white/10">
          <h1 className="text-xl font-black tracking-wide text-transparent bg-clip-text bg-gradient-to-r from-amber-300 to-emerald-300">
            SCRABBLE
          </h1>
          <button
            type="button"
            onClick={g.resetToMenu}
            className="text-sm px-3 py-1.5 rounded-lg bg-slate-700 hover:bg-slate-600 transition"
          >
            New / Menu
          </button>
        </header>

        {!g.dictReady && !g.dictError && (
          <div className="text-center text-amber-200 py-2 text-sm animate-pulse">
            Loading dictionary…
          </div>
        )}
        {g.dictError && (
          <div className="text-center text-rose-300 py-2 text-sm">
            Failed to load dictionary: {g.dictError}
          </div>
        )}

        <main className="max-w-6xl mx-auto p-3 sm:p-4 grid gap-4 lg:grid-cols-[1fr_320px]">
          <div className="space-y-4 order-2 lg:order-1">
            <BoardView
              board={state.board}
              provisional={g.provisional}
              onSquareClick={(r, c) => interactive && g.placeSelectedAt(r, c)}
              onRecall={(r, c) => interactive && g.recallAt(r, c)}
              interactive={interactive}
            />

            <div className="rounded-xl bg-slate-800/60 ring-1 ring-white/10 p-3 space-y-3">
              <div className="flex items-center justify-between text-sm">
                <span className="text-slate-300">
                  {state.phase === 'playing' ? (
                    <>
                      <span className="font-semibold text-white">
                        {state.players[state.currentPlayer].name}
                      </span>
                      's turn
                    </>
                  ) : (
                    'Game over'
                  )}
                </span>
                {g.aiThinking && (
                  <span className="text-emerald-300 animate-pulse">AI thinking…</span>
                )}
              </div>

              <Rack
                tiles={g.activeRack}
                selectedTileId={g.selectedTileId}
                onSelect={g.selectTile}
                interactive={interactive}
              />

              <Controls
                preview={g.preview}
                canPlay={interactive && g.provisional.length > 0}
                canExchange={canExchange}
                provisionalCount={g.provisional.length}
                disabled={!interactive}
                onPlay={g.commitPlay}
                onRecall={g.recallAll}
                onShuffle={g.shuffleRack}
                onExchange={() => {
                  g.recallAll();
                  setShowExchange(true);
                }}
                onPass={g.passTurn}
              />
            </div>
          </div>

          <aside className="space-y-4 order-1 lg:order-2">
            <ScorePanel state={state} aiThinking={g.aiThinking} />
            {g.message && (
              <div className="rounded-lg bg-slate-800/70 ring-1 ring-white/10 px-3 py-2 text-sm text-slate-200">
                {g.message}
              </div>
            )}
            <MoveLog log={state.moveLog} />
          </aside>
        </main>

        {g.pendingBlank && (
          <BlankPicker onPick={g.assignBlank} onCancel={g.cancelBlank} />
        )}

        {showExchange && (
          <ExchangeModal
            rack={state.players[state.currentPlayer].rack}
            onConfirm={(ids) => {
              setShowExchange(false);
              g.exchangeTiles(ids);
            }}
            onCancel={() => setShowExchange(false)}
          />
        )}

        {state.phase === 'gameover' && (
          <GameOver
            state={state}
            onNewGame={() => g.startGame(g.config!)}
            onMenu={g.resetToMenu}
          />
        )}
      </div>
    </DndContext>
  );
}
