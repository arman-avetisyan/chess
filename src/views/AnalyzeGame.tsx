import {
  useState,
  useEffect,
  useLayoutEffect,
  useMemo,
  useCallback,
} from "react";
import { Chess } from "chess.js";
import { Box, FormControlLabel, IconButton, Switch } from "@mui/material";
import SkipPreviousIcon from "@mui/icons-material/SkipPrevious";
import FastRewindIcon from "@mui/icons-material/FastRewind";
import PlayArrowIcon from "@mui/icons-material/PlayArrow";
import FastForwardIcon from "@mui/icons-material/FastForward";
import SkipNextIcon from "@mui/icons-material/SkipNext";
import PauseIcon from "@mui/icons-material/Pause";
import { BoardLayout } from "../components/BoardLayout";
import { ChessBoard } from "../components/ChessBoard";
import { EngineLines } from "../components/EngineLines";
import { useStockfish } from "../hooks/useStockfish";
import { MoveHistory } from "../components/MoveHistory";
import type { AnalyzeMove } from "../types/analyze";
import ScreenRotationAltIcon from "@mui/icons-material/ScreenRotationAlt";

const EMPTY_ARROWS: [string, string][] = [];

type AnalyzeGameProps = {
  initialFen?: string;
  /** When sent from a finished game, replay list so move history is populated */
  initialMoves?: AnalyzeMove[];
};

export function AnalyzeGame({ initialFen, initialMoves }: AnalyzeGameProps) {
  const [game] = useState(() => {
    if (initialMoves?.length) {
      const g = new Chess();
      for (const m of initialMoves) {
        const ok = g.move({
          from: m.from,
          to: m.to,
          promotion: m.promotion,
        });
        if (!ok) break;
      }
      return g;
    }
    return new Chess(initialFen ?? undefined);
  });
  const [startFen] = useState(() =>
    initialMoves?.length
      ? new Chess().fen()
      : new Chess(initialFen ?? undefined).fen(),
  );
  const [moves, setMoves] = useState<AnalyzeMove[]>(() => initialMoves ?? []);
  const [currentPly, setCurrentPly] = useState(0);
  const [position, setPosition] = useState(game.fen());
  const [lastMove, setLastMove] = useState<{ from: string; to: string } | null>(
    null,
  );
  const [boardOrientation, setBoardOrientation] = useState<"white" | "black">(
    "white",
  );
  /** On by default so opening Analyze shows lines and best-move arrow without an extra click. */
  const [engineEnabled, setEngineEnabled] = useState(true);
  /** Sync board to start of line (ply 0) before running Stockfish — avoids racing the worker before FEN is stable. */
  const [boardPrimed, setBoardPrimed] = useState(false);
  const [playing, setPlaying] = useState(false);
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

  useLayoutEffect(() => {
    const navGame = new Chess(startFen);
    setPosition(navGame.fen());
    setLastMove(null);
    setCurrentPly(0);
    setBoardPrimed(true);
  }, [startFen]);

  const setBoardAtPly = useCallback(
    (
      ply: number,
      moveList?: Array<{
        san: string;
        from: string;
        to: string;
        promotion?: "q" | "r" | "b" | "n";
      }>,
    ) => {
      const list = moveList ?? moves;
      const navGame = new Chess(startFen);
      for (let i = 0; i < ply; i += 1) {
        navGame.move({
          from: list[i].from,
          to: list[i].to,
          promotion: list[i].promotion,
        });
      }
      setPosition(navGame.fen());
      const previous = ply > 0 ? list[ply - 1] : null;
      setLastMove(previous ? { from: previous.from, to: previous.to } : null);
      setCurrentPly(ply);
    },
    [startFen, moves],
  );

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "ArrowLeft") {
        event.preventDefault();
        setPlaying(false);
        setBoardAtPly(Math.max(0, currentPly - 1));
      }
      if (event.key === "ArrowRight") {
        event.preventDefault();
        setPlaying(false);
        setBoardAtPly(Math.min(moves.length, currentPly + 1));
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [currentPly, moves.length, setBoardAtPly]);

  useEffect(() => {
    if (!playing) return;
    if (currentPly >= moves.length) {
      setPlaying(false);
      return;
    }
    const delayMs = 550;
    const t = window.setTimeout(() => {
      setBoardAtPly(currentPly + 1);
    }, delayMs);
    return () => window.clearTimeout(t);
  }, [playing, currentPly, moves, setBoardAtPly]);

  useEffect(() => {
    if (!engineEnabled || !ready || !boardPrimed) {
      setLines([]);
      setBestMoveArrow([]);
      return;
    }
    // Debounce: rapid arrow-key navigation was overlapping `go` and could crash Stockfish WASM
    const t = window.setTimeout(() => {
      getAnalysis(position).catch(() => {});
    }, 120);
    return () => window.clearTimeout(t);
  }, [position, engineEnabled, ready, boardPrimed, getAnalysis]);

  const handleDrop = useCallback(
    (source: string, target: string, piece: string) => {
      if (currentPly !== moves.length) return false;
      const gameCopy = new Chess(game.fen());
      const move = gameCopy.move({
        from: source,
        to: target,
        promotion: piece[1].toLowerCase() === "p" ? "q" : undefined,
      });
      if (!move) return false;
      game.load(gameCopy.fen());
      const nextMoves = [
        ...moves,
        {
          san: move.san,
          from: move.from,
          to: move.to,
          promotion: move.promotion as "q" | "r" | "b" | "n" | undefined,
        },
      ];
      setMoves(nextMoves);
      setBoardAtPly(nextMoves.length, nextMoves);
      return true;
    },
    [currentPly, moves, game, setBoardAtPly],
  );

  const squareStyles = useMemo(
    () =>
      lastMove
        ? {
            [lastMove.from]: { backgroundColor: "rgba(205, 210, 106, 0.8)" },
            [lastMove.to]: { backgroundColor: "rgba(205, 210, 106, 0.8)" },
          }
        : {},
    [lastMove],
  );

  const customArrows = useMemo(
    () => (engineEnabled ? bestMoveArrow : EMPTY_ARROWS),
    [engineEnabled, bestMoveArrow],
  );

  const annotations = (
    <Box sx={{ height: "100%", display: "flex", flexDirection: "column" }}>
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
        width="350px"
        maxHeight="25%"
        positionFen={position}
        linesFen={linesFen}
        workerReady={ready}
        boardReady={boardPrimed}
      />
      <Box sx={{ flex: 1, minHeight: 0 }}>
        <MoveHistory
          moves={moves}
          currentPly={currentPly}
          onSelectPly={(ply) => {
            setPlaying(false);
            setBoardAtPly(ply);
          }}
        />
      </Box>
    </Box>
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
            customArrows={customArrows}
            arePiecesDraggable={currentPly === moves.length}
          />
          <Box
            sx={{
              mt: 1,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              flexWrap: "wrap",
              gap: 0.5,
            }}
          >
            <IconButton
              size="small"
              aria-label="Go to start"
              disabled={currentPly === 0}
              onClick={() => {
                setPlaying(false);
                setBoardAtPly(0);
              }}
            >
              <SkipPreviousIcon fontSize="small" />
            </IconButton>
            <IconButton
              size="small"
              aria-label="Previous move"
              disabled={currentPly === 0}
              onClick={() => {
                setPlaying(false);
                setBoardAtPly(Math.max(0, currentPly - 1));
              }}
            >
              <FastRewindIcon fontSize="small" />
            </IconButton>
            <IconButton
              size="small"
              aria-label={playing ? "Pause autoplay" : "Play moves"}
              disabled={moves.length === 0 || currentPly >= moves.length}
              color={"default"}
              onClick={() => setPlaying((p) => !p)}
            >
              {playing ? (
                <PauseIcon fontSize="small" />
              ) : (
                <PlayArrowIcon fontSize="small" />
              )}
            </IconButton>
            <IconButton
              size="small"
              aria-label="Next move"
              disabled={currentPly >= moves.length}
              onClick={() => {
                setPlaying(false);
                setBoardAtPly(Math.min(moves.length, currentPly + 1));
              }}
            >
              <FastForwardIcon fontSize="small" />
            </IconButton>
            <IconButton
              size="small"
              aria-label="Go to last move"
              disabled={currentPly >= moves.length}
              onClick={() => {
                setPlaying(false);
                setBoardAtPly(moves.length);
              }}
            >
              <SkipNextIcon fontSize="small" />
            </IconButton>
            <IconButton
              size="small"
              aria-label="Flip board"
              onClick={() =>
                setBoardOrientation((o) => (o === "white" ? "black" : "white"))
              }
            >
              <ScreenRotationAltIcon fontSize="small" />
            </IconButton>
          </Box>
        </>
      }
      annotations={annotations}
    />
  );
}
