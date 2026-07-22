/// <reference lib="webworker" />
import { Board, Tile, Difficulty } from '../engine/types';
import { Dictionary, dictionaryFromText } from '../engine/dictionary';
import { generateMoves, chooseMove, GeneratedMove } from '../engine/moveGen';
import { DICTIONARY_URL } from '../dict/loadDictionary';

let dict: Dictionary | null = null;

async function ensureDict(): Promise<Dictionary> {
  if (dict) return dict;
  const res = await fetch(DICTIONARY_URL);
  const text = await res.text();
  dict = dictionaryFromText(text);
  return dict;
}

export interface AiRequest {
  id: number;
  board: Board;
  rack: Tile[];
  difficulty: Difficulty;
}

export interface AiResponse {
  id: number;
  move: GeneratedMove | null;
  totalMoves: number;
}

self.onmessage = async (e: MessageEvent<AiRequest>) => {
  const { id, board, rack, difficulty } = e.data;
  const d = await ensureDict();
  const moves = generateMoves(board, rack, d);
  const move = chooseMove(moves, rack, difficulty);
  const response: AiResponse = { id, move, totalMoves: moves.length };
  (self as unknown as Worker).postMessage(response);
};
