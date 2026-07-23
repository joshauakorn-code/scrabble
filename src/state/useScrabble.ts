import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  GameState,
  Placement,
  Tile,
  Difficulty,
  RACK_SIZE,
} from '../engine/types';
import {
  newGame,
  applyPlay,
  applyPass,
  applyExchange,
  currentPlayer,
} from '../engine/game';
import { scorePlacements } from '../engine/scoring';
import { validatePlay } from '../engine/rules';
import { shuffle } from '../engine/tiles';
import { Dictionary } from '../engine/dictionary';
import { loadDictionary } from '../dict/loadDictionary';
import type { AiRequest, AiResponse } from '../workers/aiWorker';
import { GeneratedMove } from '../engine/moveGen';

export interface GameConfig {
  mode: 'hotseat' | 'ai';
  playerNames: [string, string];
  difficulty: Difficulty;
}

export interface PreviewInfo {
  legal: boolean;
  score: number;
  words: string[];
  reason?: string;
}

export interface PendingBlank {
  tile: Tile;
  row: number;
  col: number;
}

export interface ScrabbleController {
  state: GameState | null;
  config: GameConfig | null;
  dictReady: boolean;
  dictError: string | null;
  provisional: Placement[];
  selectedTileId: string | null;
  pendingBlank: PendingBlank | null;
  aiThinking: boolean;
  message: string | null;
  preview: PreviewInfo | null;
  /** Rack of the current player minus tiles placed provisionally. */
  activeRack: Tile[];
  isAiTurn: boolean;
  /** True briefly after a shuffle so the UI can animate the rack. */
  shuffling: boolean;

  startGame: (config: GameConfig) => void;
  resetToMenu: () => void;
  selectTile: (id: string | null) => void;
  placeSelectedAt: (row: number, col: number) => void;
  placeTileAt: (tileId: string, row: number, col: number) => void;
  assignBlank: (letter: string) => void;
  cancelBlank: () => void;
  recallAt: (row: number, col: number) => void;
  recallAll: () => void;
  shuffleRack: () => void;
  /** Move a rack tile so it sits at another rack tile's position. */
  reorderRack: (fromId: string, toId: string) => void;
  commitPlay: () => void;
  exchangeTiles: (tileIds: string[]) => void;
  passTurn: () => void;
}

export function useScrabble(): ScrabbleController {
  const [state, setState] = useState<GameState | null>(null);
  const [config, setConfig] = useState<GameConfig | null>(null);
  const [dict, setDict] = useState<Dictionary | null>(null);
  const [dictError, setDictError] = useState<string | null>(null);
  const [provisional, setProvisional] = useState<Placement[]>([]);
  const [selectedTileId, setSelectedTileId] = useState<string | null>(null);
  const [pendingBlank, setPendingBlank] = useState<PendingBlank | null>(null);
  const [aiThinking, setAiThinking] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [shuffling, setShuffling] = useState(false);

  const workerRef = useRef<Worker | null>(null);
  const reqId = useRef(0);

  // Lazy-load the dictionary once a game starts.
  useEffect(() => {
    if (!config || dict) return;
    let cancelled = false;
    loadDictionary()
      .then((d) => {
        if (!cancelled) setDict(d);
      })
      .catch((err) => {
        if (!cancelled) setDictError(String(err?.message ?? err));
      });
    return () => {
      cancelled = true;
    };
  }, [config, dict]);

  // Spin up the AI worker for vs-AI games.
  useEffect(() => {
    if (config?.mode !== 'ai') return;
    const worker = new Worker(new URL('../workers/aiWorker.ts', import.meta.url), {
      type: 'module',
    });
    workerRef.current = worker;
    return () => {
      worker.terminate();
      workerRef.current = null;
    };
  }, [config?.mode]);

  const activeRack = useMemo(() => {
    if (!state) return [];
    const player = state.players[state.currentPlayer];
    const usedIds = new Set(provisional.map((p) => p.tile.id));
    return player.rack.filter((t) => !usedIds.has(t.id));
  }, [state, provisional]);

  const isAiTurn = useMemo(() => {
    if (!state || state.phase !== 'playing') return false;
    return state.players[state.currentPlayer].kind === 'ai';
  }, [state]);

  const preview = useMemo<PreviewInfo | null>(() => {
    if (!state || !dict || provisional.length === 0) return null;
    const v = validatePlay(state.board, provisional, dict);
    if (!v.legal) {
      return { legal: false, score: 0, words: [], reason: v.reason };
    }
    const s = scorePlacements(state.board, provisional);
    return { legal: true, score: s.total, words: v.words ?? [] };
  }, [state, dict, provisional]);

  const startGame = useCallback((cfg: GameConfig) => {
    const players =
      cfg.mode === 'ai'
        ? [
            { name: cfg.playerNames[0] || 'You', kind: 'human' as const },
            {
              name: `Computer (${cfg.difficulty})`,
              kind: 'ai' as const,
              difficulty: cfg.difficulty,
            },
          ]
        : [
            { name: cfg.playerNames[0] || 'Player 1', kind: 'human' as const },
            { name: cfg.playerNames[1] || 'Player 2', kind: 'human' as const },
          ];
    setConfig(cfg);
    setState(newGame({ players }));
    setProvisional([]);
    setSelectedTileId(null);
    setMessage(null);
  }, []);

  const resetToMenu = useCallback(() => {
    setState(null);
    setConfig(null);
    setProvisional([]);
    setSelectedTileId(null);
    setPendingBlank(null);
    setMessage(null);
  }, []);

  const selectTile = useCallback((id: string | null) => {
    setSelectedTileId(id);
  }, []);

  const doPlace = useCallback(
    (tile: Tile, row: number, col: number) => {
      // Occupied by a committed tile? ignore.
      if (state?.board[row][col]) return;
      // Occupied provisionally? ignore.
      if (provisional.some((p) => p.row === row && p.col === col)) return;
      if (tile.isBlank && !tile.letter) {
        setPendingBlank({ tile, row, col });
        return;
      }
      setProvisional((prev) => [
        ...prev.filter((p) => p.tile.id !== tile.id),
        { tile, row, col },
      ]);
      setSelectedTileId(null);
      setMessage(null);
    },
    [state, provisional],
  );

  const placeSelectedAt = useCallback(
    (row: number, col: number) => {
      if (!selectedTileId) return;
      const tile = activeRack.find((t) => t.id === selectedTileId);
      if (!tile) return;
      doPlace(tile, row, col);
    },
    [selectedTileId, activeRack, doPlace],
  );

  const placeTileAt = useCallback(
    (tileId: string, row: number, col: number) => {
      // Tile may be on the rack or already placed provisionally (a move).
      const rackTile = activeRack.find((t) => t.id === tileId);
      const provTile = provisional.find((p) => p.tile.id === tileId)?.tile;
      const tile = rackTile ?? provTile;
      if (!tile) return;
      // For an already-assigned blank being moved, keep its letter.
      doPlace(tile, row, col);
    },
    [activeRack, provisional, doPlace],
  );

  const assignBlank = useCallback(
    (letter: string) => {
      if (!pendingBlank) return;
      const assigned: Tile = { ...pendingBlank.tile, letter: letter.toUpperCase() };
      setProvisional((prev) => [
        ...prev.filter((p) => p.tile.id !== assigned.id),
        { tile: assigned, row: pendingBlank.row, col: pendingBlank.col },
      ]);
      setPendingBlank(null);
      setSelectedTileId(null);
    },
    [pendingBlank],
  );

  const cancelBlank = useCallback(() => setPendingBlank(null), []);

  const recallAt = useCallback((row: number, col: number) => {
    setProvisional((prev) => prev.filter((p) => !(p.row === row && p.col === col)));
  }, []);

  const recallAll = useCallback(() => {
    setProvisional([]);
    setSelectedTileId(null);
  }, []);

  const shuffleRack = useCallback(() => {
    setState((prev) => {
      if (!prev) return prev;
      const next = { ...prev, players: prev.players.map((p) => ({ ...p })) };
      const player = next.players[next.currentPlayer];
      player.rack = shuffle(player.rack);
      return next;
    });
    // Trigger the shuffle animation, then clear the flag so it can replay.
    setShuffling(false);
    requestAnimationFrame(() => {
      setShuffling(true);
      window.setTimeout(() => setShuffling(false), 500);
    });
  }, []);

  const reorderRack = useCallback((fromId: string, toId: string) => {
    if (fromId === toId) return;
    setState((prev) => {
      if (!prev) return prev;
      const next = {
        ...prev,
        players: prev.players.map((p) => ({ ...p, rack: p.rack.slice() })),
      };
      const rack = next.players[next.currentPlayer].rack;
      const from = rack.findIndex((t) => t.id === fromId);
      const to = rack.findIndex((t) => t.id === toId);
      if (from < 0 || to < 0) return prev;
      const [moved] = rack.splice(from, 1);
      rack.splice(to, 0, moved);
      return next;
    });
  }, []);

  const clearTurnUi = useCallback(() => {
    setProvisional([]);
    setSelectedTileId(null);
    setPendingBlank(null);
  }, []);

  const commitPlay = useCallback(() => {
    if (!state || !dict) return;
    const res = applyPlay(state, provisional, dict);
    if (!res.ok) {
      setMessage(res.reason ?? 'Illegal play.');
      return;
    }
    setState(res.state);
    clearTurnUi();
    setMessage(
      `${state.players[state.currentPlayer].name} played ${(res.words ?? []).join(
        ', ',
      )} for ${res.score}.`,
    );
  }, [state, dict, provisional, clearTurnUi]);

  const exchangeTiles = useCallback(
    (tileIds: string[]) => {
      if (!state) return;
      const res = applyExchange(state, tileIds);
      if (!res.ok) {
        setMessage(res.reason ?? 'Cannot exchange.');
        return;
      }
      setState(res.state);
      clearTurnUi();
      setMessage(`${state.players[state.currentPlayer].name} exchanged ${tileIds.length} tile(s).`);
    },
    [state, clearTurnUi],
  );

  const passTurn = useCallback(() => {
    if (!state) return;
    const res = applyPass(state);
    setState(res.state);
    clearTurnUi();
    setMessage(`${state.players[state.currentPlayer].name} passed.`);
  }, [state, clearTurnUi]);

  // ---- AI turn driver ----------------------------------------------------
  useEffect(() => {
    if (!state || !dict || state.phase !== 'playing') return;
    if (!isAiTurn) return;
    const worker = workerRef.current;
    const player = currentPlayer(state);
    let cancelled = false;
    setAiThinking(true);

    const finish = () => {
      if (!cancelled) setAiThinking(false);
    };

    const applyChosen = (move: GeneratedMove | null) => {
      if (cancelled || !state) return;
      if (move && move.placements.length > 0) {
        const res = applyPlay(state, move.placements, dict);
        if (res.ok) {
          setState(res.state);
          setMessage(`${player.name} played ${(res.words ?? []).join(', ')} for ${res.score}.`);
          finish();
          return;
        }
      }
      // No legal move: exchange if possible, else pass.
      if (state.bag.length >= RACK_SIZE) {
        const ids = player.rack.slice(0, Math.min(player.rack.length, 7)).map((t) => t.id);
        const res = applyExchange(state, ids);
        setState(res.ok ? res.state : applyPass(state).state);
        setMessage(`${player.name} exchanged tiles.`);
      } else {
        setState(applyPass(state).state);
        setMessage(`${player.name} passed.`);
      }
      finish();
    };

    const timer = setTimeout(() => {
      if (worker) {
        const id = ++reqId.current;
        const onMsg = (e: MessageEvent<AiResponse>) => {
          if (e.data.id !== id) return;
          worker.removeEventListener('message', onMsg);
          applyChosen(e.data.move);
        };
        worker.addEventListener('message', onMsg);
        const req: AiRequest = {
          id,
          board: state.board,
          rack: player.rack,
          difficulty: player.difficulty ?? 'medium',
        };
        worker.postMessage(req);
      } else {
        // Fallback: run on main thread (should not happen for ai mode).
        import('../engine/moveGen').then(({ generateMoves, chooseMove }) => {
          const moves = generateMoves(state.board, player.rack, dict);
          applyChosen(chooseMove(moves, player.rack, player.difficulty ?? 'medium'));
        });
      }
    }, 450); // brief pause so "thinking…" is visible

    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state, dict, isAiTurn]);

  return {
    state,
    config,
    dictReady: !!dict,
    dictError,
    provisional,
    selectedTileId,
    pendingBlank,
    aiThinking,
    message,
    preview,
    activeRack,
    isAiTurn,
    shuffling,
    startGame,
    resetToMenu,
    selectTile,
    placeSelectedAt,
    placeTileAt,
    assignBlank,
    cancelBlank,
    recallAt,
    recallAll,
    shuffleRack,
    reorderRack,
    commitPlay,
    exchangeTiles,
    passTurn,
  };
}
