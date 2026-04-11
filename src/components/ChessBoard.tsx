import { memo, useEffect, useState } from "react";
import { Chessboard } from "react-chessboard";
import { BOARD_WIDTH } from "./BoardLayout";
import { getCustomPieces } from "../pieces";

const customPieces = getCustomPieces();

const ARROW_COLOR = "rgba(67, 160, 71, 0.9)";
const SELECTION_RING: React.CSSProperties = {
  boxShadow: "inset 0 0 0 1.5px rgba(0, 0, 0, 0.75)",
};
const COORDINATES_WIDTH = 20;

type ChessBoardProps = {
  position: string;
  onDrop: (source: string, target: string, piece: string) => boolean;
  boardOrientation?: "white" | "black";
  customSquareStyles?: Record<string, React.CSSProperties>;
  customArrows?: Array<[string, string]>;
  arePiecesDraggable?: boolean;
};

function ChessBoardInner({
  position,
  onDrop,
  boardOrientation = "white",
  customSquareStyles = {},
  customArrows = [],
  arePiecesDraggable = true,
}: ChessBoardProps) {
  const [selectedSquare, setSelectedSquare] = useState<string | null>(null);
  const [selectedPieceType, setSelectedPieceType] = useState<string | null>(
    null,
  );

  useEffect(() => {
    setSelectedSquare(null);
    setSelectedPieceType(null);
  }, [position]);

  const arrows = customArrows.map(([from, to]) => ({
    startSquare: from,
    endSquare: to,
    color: ARROW_COLOR,
  }));

  const squareStyles: Record<string, React.CSSProperties> = {
    ...customSquareStyles,
  };
  if (selectedSquare) {
    squareStyles[selectedSquare] = {
      ...squareStyles[selectedSquare],
      ...SELECTION_RING,
    };
  }

  const samePieceColor = (a: string, b: string) => a.charAt(0) === b.charAt(0);

  return (
    <div
      style={{
        width: BOARD_WIDTH + COORDINATES_WIDTH,
        height: BOARD_WIDTH + COORDINATES_WIDTH,
        borderRadius: "10px",
        boxShadow: "0 0 10px 0 rgba(0, 0, 0, 0.75)",
        border: "1px solid #000",
        backgroundColor: "rgba(181, 136, 99, 1)",
        padding: "10px",
      }}
    >
      <div style={{ width: BOARD_WIDTH, height: BOARD_WIDTH }}>
        <Chessboard
          options={{
            id: "main-board",
            position,
            boardOrientation,
            pieces: customPieces,
            boardStyle: {
              overflow: "visible",
            },
            alphaNotationStyle: {
              bottom: -12,
              right: 16,
              color: "rgb(240, 217, 181)",
              fontSize: "10px",
            },
            numericNotationStyle: {
              top: 14,
              left: -8,
              color: "rgb(240, 217, 181)",
              fontSize: "10px",
            },
            squareStyles,
            arrows,
            onPieceDrop: ({ sourceSquare, targetSquare, piece }) =>
              targetSquare
                ? onDrop(sourceSquare, targetSquare, piece.pieceType)
                : false,
            onSquareClick: ({ piece, square }) => {
              if (!arePiecesDraggable) return;

              if (!selectedSquare) {
                if (piece) {
                  setSelectedSquare(square);
                  setSelectedPieceType(piece.pieceType);
                }
                return;
              }

              if (square === selectedSquare) {
                setSelectedSquare(null);
                setSelectedPieceType(null);
                return;
              }

              if (
                piece &&
                selectedPieceType &&
                samePieceColor(piece.pieceType, selectedPieceType)
              ) {
                setSelectedSquare(square);
                setSelectedPieceType(piece.pieceType);
                return;
              }

              const pieceType = selectedPieceType;
              setSelectedSquare(null);
              setSelectedPieceType(null);
              if (pieceType) {
                onDrop(selectedSquare, square, pieceType);
              }
            },
            allowDragging: arePiecesDraggable,
            showNotation: true,
          }}
        />
      </div>
    </div>
  );
}

export const ChessBoard = memo(ChessBoardInner);
