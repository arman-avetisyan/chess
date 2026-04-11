import React from "react";

/**
 * Cardinal piece set from Lichess (lila/public/piece/cardinal)
 * CDN: jsDelivr
 */
const CARDINAL_BASE =
  "https://cdn.jsdelivr.net/gh/lichess-org/lila@master/public/piece/cardinal";

const pieceUrls: Record<string, string> = {
  wK: `${CARDINAL_BASE}/wK.svg`,
  wQ: `${CARDINAL_BASE}/wQ.svg`,
  wR: `${CARDINAL_BASE}/wR.svg`,
  wB: `${CARDINAL_BASE}/wB.svg`,
  wN: `${CARDINAL_BASE}/wN.svg`,
  wP: `${CARDINAL_BASE}/wP.svg`,
  bK: `${CARDINAL_BASE}/bK.svg`,
  bQ: `${CARDINAL_BASE}/bQ.svg`,
  bR: `${CARDINAL_BASE}/bR.svg`,
  bB: `${CARDINAL_BASE}/bB.svg`,
  bN: `${CARDINAL_BASE}/bN.svg`,
  bP: `${CARDINAL_BASE}/bP.svg`,
};

/** Custom pieces for react-chessboard v5: (props?: { fill?, square?, svgStyle? }) => JSX */
export function getCustomPieces(): Record<
  string,
  (props?: {
    fill?: string;
    square?: string;
    svgStyle?: React.CSSProperties;
  }) => React.ReactElement
> {
  const entries = Object.entries(pieceUrls).map(([key, src]) => [
    key,
    () => (
      <img
        src={src}
        style={{ width: "100%", height: "100%", objectFit: "contain" }}
        alt={key}
        draggable={false}
      />
    ),
  ]);
  return Object.fromEntries(entries);
}
