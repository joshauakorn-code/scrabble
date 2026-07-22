# Scrabble (React + TypeScript)

A polished, full-featured Scrabble web app with a strict separation between a
pure, framework-agnostic **game engine** and the **React UI**.

- **Two modes:** human-vs-human *hotseat* and human-vs-**AI** with selectable
  difficulty (Easy / Medium / Hard).
- **Tile movement:** drag-and-drop (touch-friendly, via
  [@dnd-kit](https://dndkit.com/)) **and** a click-tile-then-click-square
  fallback for reliable play on a grid / mobile.
- **Engine-only game logic:** the React layer only renders state and dispatches
  actions; every rule, score, and AI decision lives in `src/engine`.
- **Unit-tested engine** with [Vitest](https://vitest.dev/), including a property
  test asserting every move the AI generates passes the rules validator.

## Quick start

```bash
npm install
npm run dev      # http://localhost:5173
```

```bash
npm run build    # type-check + production build
npm run preview  # serve the production build
npm test         # run the engine test suite
```

`npm install && npm run dev` is all that's needed — the dictionary asset is
committed under `public/dict/`.

## How to play

1. **Start screen:** choose *vs Computer* (pick a difficulty) or *Hotseat (2P)*,
   optionally name the players, and press **Start Game**.
2. **Place tiles** two ways:
   - **Drag** a rack tile onto a board square (works with touch).
   - **Click** a rack tile to select it, then **click** a square to drop it.
3. **Provisional tiles** are highlighted and can be recalled by clicking them,
   dragging them back to the rack, or pressing **Recall**.
4. A **live preview** shows the words you'd form, the score, and whether the play
   is legal.
5. **Buttons:** **Play** (commit), **Recall** (take back), **Shuffle** (reorder
   your rack), **Exchange** (swap tiles — only when ≥7 tiles remain in the bag,
   forfeits the turn), **Pass**.
6. **Blanks** prompt you to choose the letter they represent (worth 0 points,
   fixed for the game, and shown with a marker).

## Rules enforced

- 7-tile rack, refilled from the bag after each play or exchange.
- First play must cover the center star and be at least two tiles.
- Later plays: all newly placed tiles in a single row or column, contiguous
  (existing tiles may fill gaps), and connected to at least one existing tile.
- **Every** word formed — the main word and all cross-words — must be valid;
  illegal plays are rejected with a clear reason and never committed.
- Scoring: per tile, `letter value × letter premium (DL/TL)`, summed, then
  `× word premiums (DW/TW)`. A premium counts only the turn a tile is first
  placed on it. Each cross-word scores independently. **+50 bingo bonus** for
  using all 7 rack tiles in one play.
- Game ends when the bag is empty and a player empties their rack, **or** after
  6 consecutive scoreless turns. Final scoring: each player loses the sum of
  their unplayed tiles; the player who went out gains the sum of the opponents'
  unplayed tiles. Highest score wins.

## The AI

`src/engine/moveGen.ts` enumerates **all** legal plays for a rack + board using
the standard **anchor-square + cross-check + trie left/right-extension** approach
(Appel–Jacobson). Every generated move is additionally re-validated through the
same `rules` validator the UI uses, so the AI can never make an illegal play.

Difficulty is a selection policy over the legal-move list:

- **Easy** — random pick from a lower-scoring band.
- **Medium** — score-weighted sample from the top ~10 moves.
- **Hard** — highest score, with a rack-leave heuristic (keep S and blanks,
  balance vowels/consonants, avoid awkward duplicate/heavy leaves) as a
  tie-breaker.

Move generation runs in a **Web Worker** (`src/workers/aiWorker.ts`) so the UI
stays responsive, with an "AI thinking…" indicator while it computes.

## Dictionary

The bundled word list is **ENABLE** (`public/dict/enable1.txt`), which is in the
public domain and freely redistributable. On load it is fetched once (with a
"Loading dictionary…" state) and compiled into:

- an uppercase **`Set`** for O(1) word validation, and
- a **trie** used by the move generator for left/right extension.

### Swapping the word list (TWL/NWL, SOWPODS/Collins, …)

1. Drop your word list (one uppercase word per line) into `public/dict/`, e.g.
   `public/dict/twl.txt`.
2. Update the path in `src/dict/loadDictionary.ts`:

   ```ts
   export const DICTIONARY_URL = `${import.meta.env.BASE_URL}dict/twl.txt`;
   ```

3. Rebuild. The `Set` and trie are constructed from whatever list you provide.

> **Note:** TWL/NWL and SOWPODS/Collins are copyrighted; obtain them from a
> source you're licensed to use. ENABLE is provided here because it is free to
> redistribute.

## Architecture

```
src/
  engine/                # pure, no React
    types.ts             # shared types & constants
    board.ts             # 15×15 grid + premium-square map (+ symmetry/count self-checks)
    tiles.ts             # tile distribution, bag, draw/shuffle
    scoring.ts           # score a play incl. cross-words, premiums, bingo bonus
    rules.ts             # legality: single-line, contiguity, connect, center, dictionary
    moveGen.ts           # AI legal-move generator (Appel–Jacobson) + difficulty policy
    dictionary.ts        # word list → Set (validation) + trie (move gen)
    game.ts              # turn state machine, actions, end conditions, final scoring
    __tests__/           # Vitest engine tests
  components/            # Board, Square, Tile, Rack, Controls, ScorePanel, MoveLog,
                         # ModeSelect, DraggableTile, modals/ (blank picker, exchange, game over)
  state/useScrabble.ts   # React hook wiring engine <-> UI (+ AI worker driver)
  workers/aiWorker.ts    # move generation off the main thread
  dict/loadDictionary.ts # fetch + build the dictionary
  App.tsx                # composition root
public/dict/enable1.txt  # committed word-list asset
```

### Board premiums

The standard tournament layout is used and self-checked (see
`src/engine/__tests__/board.test.ts`): exactly **8x TW, 17x DW** (incl. the
center star), **12x TL, 24x DL**, symmetric across both diagonals and both axes.

### Tiles

The standard English 100-tile set (asserted in `tiles.test.ts`): 2 blanks (0
pts) plus the standard letter counts and values.

## Tests

```bash
npm test
```

Covers: bag totals 100 with correct per-letter counts and values; scoring with
stacked word/letter premiums and the 50-pt bingo; blank = 0; premiums only on
first cover; first-move-hits-center; single-line + contiguity + connectivity
enforcement; cross-word validation; end-game final scoring; and a **property
test** that every move `moveGen` produces passes `rules` validation.
