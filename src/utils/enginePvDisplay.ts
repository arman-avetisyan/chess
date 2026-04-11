import { Chess } from "chess.js";

/** Canonical FEN for comparison (same position → same string). */
export function normalizeFen(fen: string): string {
  try {
    return new Chess(fen).fen();
  } catch {
    return fen;
  }
}

/** Convert a UCI principal variation to SAN from a given FEN. Stops on first illegal move (never throws). */
export function uciPvToSan(fen: string, uciMoves: string[]): string[] {
  let g: Chess;
  try {
    g = new Chess(fen);
  } catch {
    return [];
  }
  const sans: string[] = [];
  for (const uci of uciMoves) {
    if (uci.length < 4) break;
    const from = uci.slice(0, 2);
    const to = uci.slice(2, 4);
    const promotion =
      uci.length >= 5 ? (uci[4] as "q" | "r" | "b" | "n") : undefined;
    try {
      const m = g.move({ from, to, promotion });
      if (!m) break;
      sans.push(m.san);
    } catch {
      break;
    }
  }
  return sans;
}
