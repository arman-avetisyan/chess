import { Chess, type Square } from "chess.js";

export type PromotionChoice = "q" | "r" | "n" | "b";

/** True when `from`–`to` is a legal move that promotes a pawn (needs a promotion piece). */
export function isPromotionMove(
  game: Chess,
  from: string,
  to: string,
): boolean {
  const moves = game.moves({ square: from as Square, verbose: true });
  return moves.some((m) => m.to === (to as Square) && m.isPromotion());
}
