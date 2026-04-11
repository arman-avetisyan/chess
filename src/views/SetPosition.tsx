import { useState, useEffect } from "react";
import { Chess } from "chess.js";
import { Button, FormControlLabel, Switch, TextField } from "@mui/material";
import { BoardLayout } from "../components/BoardLayout";
import { ChessBoard } from "../components/ChessBoard";
import { EngineLines } from "../components/EngineLines";
import { useStockfish } from "../hooks/useStockfish";
import ScreenRotationAltIcon from "@mui/icons-material/ScreenRotationAlt";

export function SetPosition() {
  const [fen, setFen] = useState(
    "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1",
  );
  const [game, setGame] = useState(() => new Chess());
  const [position, setPosition] = useState(game.fen());
  const [lastMove, setLastMove] = useState<{ from: string; to: string } | null>(
    null,
  );
  const [boardOrientation, setBoardOrientation] = useState<"white" | "black">(
    "white",
  );
  const [engineEnabled, setEngineEnabled] = useState(false);
  const {
    ready,
    lines,
    linesFen,
    bestMoveArrow,
    getAnalysis,
    setLines,
    setBestMoveArrow,
    error,
  } = useStockfish();

  const applyFen = () => {
    try {
      const c = new Chess(fen);
      setGame(c);
      setPosition(c.fen());
      setLastMove(null);
    } catch {
      // invalid FEN, keep current
    }
  };

  useEffect(() => {
    if (!engineEnabled || !ready) {
      setLines([]);
      setBestMoveArrow([]);
      return;
    }
    const t = window.setTimeout(() => {
      getAnalysis(position).catch(() => {});
    }, 120);
    return () => window.clearTimeout(t);
  }, [position, engineEnabled, ready, getAnalysis]);

  const handleDrop = (source: string, target: string, piece: string) => {
    const gameCopy = new Chess(game.fen());
    const move = gameCopy.move({
      from: source,
      to: target,
      promotion: piece[1].toLowerCase() === "p" ? "q" : undefined,
    });
    if (!move) return false;
    setGame(gameCopy);
    setPosition(gameCopy.fen());
    setFen(gameCopy.fen());
    setLastMove({ from: source, to: target });
    return true;
  };

  const squareStyles = lastMove
    ? {
        [lastMove.from]: { backgroundColor: "rgba(205, 210, 106, 0.8)" },
        [lastMove.to]: { backgroundColor: "rgba(205, 210, 106, 0.8)" },
      }
    : {};

  const annotations = (
    <>
      <TextField
        size="small"
        fullWidth
        label="FEN"
        value={fen}
        onChange={(e) => setFen(e.target.value)}
        onBlur={applyFen}
        onKeyDown={(e) => e.key === "Enter" && applyFen()}
        sx={{ mb: 1 }}
      />
      <Button size="small" onClick={applyFen} sx={{ mb: 1 }}>
        Set position
      </Button>
      <FormControlLabel
        control={
          <Switch
            checked={engineEnabled}
            onChange={(_, v) => setEngineEnabled(v)}
            disabled={!ready}
            size="small"
          />
        }
        label="Chess engine"
      />
      <EngineLines
        lines={lines}
        engineEnabled={engineEnabled}
        error={error}
        positionFen={position}
        linesFen={linesFen}
        workerReady={ready}
      />
    </>
  );

  return (
    <BoardLayout
      board={
        <>
          <ChessBoard
            position={position}
            onDrop={handleDrop}
            boardOrientation={boardOrientation}
            customSquareStyles={squareStyles}
            customArrows={engineEnabled ? bestMoveArrow : []}
          />
          <ScreenRotationAltIcon
            fontSize="small"
            onClick={() =>
              setBoardOrientation((o) => (o === "white" ? "black" : "white"))
            }
            sx={{ mt: 1 }}
          />
        </>
      }
      annotations={annotations}
    />
  );
}
