import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Chess } from "chess.js";
import {
  Alert,
  Box,
  Button,
  FormControlLabel,
  IconButton,
  Radio,
  RadioGroup,
  Snackbar,
  Switch,
  Typography,
} from "@mui/material";
import ScreenRotationAltIcon from "@mui/icons-material/ScreenRotationAlt";
import DeleteOutlinedIcon from '@mui/icons-material/DeleteOutlined';
import SkipPreviousIcon from "@mui/icons-material/SkipPrevious";
import FastRewindIcon from "@mui/icons-material/FastRewind";
import PlayArrowIcon from "@mui/icons-material/PlayArrow";
import FastForwardIcon from "@mui/icons-material/FastForward";
import SkipNextIcon from "@mui/icons-material/SkipNext";
import PauseIcon from "@mui/icons-material/Pause";
import {
  Chessboard,
  ChessboardProvider,
  SparePiece,
  type PieceDropHandlerArgs,
  type PositionDataType,
} from "react-chessboard";
import { BoardLayout, BOARD_WIDTH } from "../components/BoardLayout";
import { ChessBoard } from "../components/ChessBoard";
import { EngineLines } from "../components/EngineLines";
import { MoveHistory } from "../components/MoveHistory";
import { PromotionDialog } from "../components/PromotionDialog";
import { useStockfish } from "../hooks/useStockfish";
import type { AnalyzeMove } from "../types/analyze";
import type { PromotionChoice } from "../utils/promotion";
import { isPromotionMove } from "../utils/promotion";
import { getCustomPieces } from "../pieces";

const customPieces = getCustomPieces();
const COORDINATES_WIDTH = 20;

export function SetPosition() {
  const [game, setGame] = useState(() => new Chess());
  const [position, setPosition] = useState(game.fen());
  const [setupPosition, setSetupPosition] = useState<PositionDataType>({});
  const [turnToMove, setTurnToMove] = useState<"w" | "b">("w");
  const [startFen, setStartFen] = useState(game.fen());
  const [moves, setMoves] = useState<AnalyzeMove[]>([]);
  const [currentPly, setCurrentPly] = useState(0);
  const [lastMove, setLastMove] = useState<{ from: string; to: string } | null>(
    null,
  );
  const [boardOrientation, setBoardOrientation] = useState<"white" | "black">(
    "white",
  );
  const [engineEnabled, setEngineEnabled] = useState(false);
  const [playing, setPlaying] = useState(false);
  const [mode, setMode] = useState<"setup" | "play" | "analyze">("setup");
  const [positionError, setPositionError] = useState<string | null>(null);
  const [pendingPromotion, setPendingPromotion] = useState<{
    from: string;
    to: string;
    color: "w" | "b";
  } | null>(null);

  const boardAnchorRef = useRef<HTMLDivElement | null>(null);

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

  const blackSparePieces = useMemo(
    () => ["bK", "bQ", "bR", "bB", "bN", "bP"],
    [],
  );
  const whiteSparePieces = useMemo(
    () => ["wK", "wQ", "wR", "wB", "wN", "wP"],
    [],
  );

  const positionObjectToFen = (board: PositionDataType, turn: "w" | "b") => {
    const files = "abcdefgh";
    const ranks = "87654321";
    const rows: string[] = [];

    for (const rank of ranks) {
      let row = "";
      let empties = 0;

      for (const file of files) {
        const square = `${file}${rank}`;
        const piece = board[square];

        if (!piece) {
          empties += 1;
          continue;
        }

        if (empties > 0) {
          row += String(empties);
          empties = 0;
        }

        const color = piece.pieceType[0];
        const type = piece.pieceType[1].toLowerCase();
        row += color === "w" ? type.toUpperCase() : type;
      }

      if (empties > 0) {
        row += String(empties);
      }

      const emptyRow = "8";
      rows.push(row || emptyRow);
    }

    return `${rows.join("/")} ${turn} - - 0 1`;
  };

  const setBoardAtPly = useCallback(
    (ply: number, moveList: AnalyzeMove[] = moves) => {
      const navGame = new Chess(startFen);
      for (let i = 0; i < ply; i += 1) {
        navGame.move({
          from: moveList[i].from,
          to: moveList[i].to,
          promotion: moveList[i].promotion,
        });
      }
      setPosition(navGame.fen());
      const previous = ply > 0 ? moveList[ply - 1] : null;
      setLastMove(previous ? { from: previous.from, to: previous.to } : null);
      setCurrentPly(ply);
      setGame(navGame);
    },
    [moves, startFen],
  );

  useEffect(() => {
    setPendingPromotion(null);
  }, [currentPly, mode]);

  const startFromCurrentPosition = (nextMode: "play" | "analyze") => {
    const candidateFen = positionObjectToFen(setupPosition, turnToMove);
    let nextFen: string;
    try {
      nextFen = new Chess(candidateFen).fen();
    } catch {
      setPositionError(
        "Invalid position. Please place both kings and ensure the setup is legal.",
      );
      return;
    }

    const oppositeTurn = turnToMove === "w" ? "b" : "w";
    try {
      const oppositeGame = new Chess(positionObjectToFen(setupPosition, oppositeTurn));
      if (oppositeGame.isCheck()) {
        setPositionError(
          turnToMove === "w"
            ? "Invalid position: Black king is in check, so Black must be the side to move."
            : "Invalid position: White king is in check, so White must be the side to move.",
        );
        return;
      }
    } catch {
      // Already validated with candidateFen, so this is only a safety guard.
    }

    setStartFen(nextFen);
    setMoves([]);
    setCurrentPly(0);
    setLastMove(null);
    setPlaying(false);
    setMode(nextMode);
    setEngineEnabled(nextMode === "analyze");
    setGame(new Chess(nextFen));
    setPosition(nextFen);
  };

  useEffect(() => {
    if (mode === "setup") return;
    if (!engineEnabled || !ready) {
      setLines([]);
      setBestMoveArrow([]);
      return;
    }
    const t = window.setTimeout(() => {
      getAnalysis(position).catch(() => {});
    }, 120);
    return () => window.clearTimeout(t);
  }, [position, engineEnabled, ready, getAnalysis, mode, setBestMoveArrow, setLines]);

  useEffect(() => {
    if (mode === "setup") return;
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
  }, [currentPly, mode, moves.length, setBoardAtPly]);

  useEffect(() => {
    if (mode === "setup" || !playing) return;
    if (currentPly >= moves.length) {
      setPlaying(false);
      return;
    }
    const t = window.setTimeout(() => {
      setBoardAtPly(currentPly + 1);
    }, 550);
    return () => window.clearTimeout(t);
  }, [currentPly, mode, moves.length, playing, setBoardAtPly]);

  const commitMove = (
    source: string,
    target: string,
    promotion?: PromotionChoice,
  ) => {
    if (currentPly !== moves.length) return false;

    const move = game.move({
      from: source,
      to: target,
      ...(promotion ? { promotion } : {}),
    });
    if (!move) return false;

    const nextMoves = [
      ...moves,
      {
        san: move.san,
        from: move.from,
        to: move.to,
        promotion: move.promotion as "q" | "r" | "b" | "n" | undefined,
      },
    ];
    setPlaying(false);
    setPosition(game.fen());
    setMoves(nextMoves);
    setCurrentPly(nextMoves.length);
    setLastMove({ from: move.from, to: move.to });
    return true;
  };

  const handleDrop = (source: string, target: string, _piece: string) => {
    if (currentPly !== moves.length) return false;

    const preview = new Chess(game.fen());
    if (isPromotionMove(preview, source, target)) {
      setPendingPromotion({
        from: source,
        to: target,
        color: preview.turn(),
      });
      return false;
    }
    return commitMove(source, target);
  };

  const handleSetupPieceDrop = ({
    piece,
    sourceSquare,
    targetSquare,
  }: PieceDropHandlerArgs) => {
    if (mode !== "setup") return false;
    const nextPosition: PositionDataType = { ...setupPosition };

    if (targetSquare === null) {
      if (piece.isSparePiece) return false;
      delete nextPosition[sourceSquare];
      setSetupPosition(nextPosition);
      setLastMove(null);
      return true;
    }

    if (piece.isSparePiece) {
      nextPosition[targetSquare] = { pieceType: piece.pieceType };
    } else {
      const sourcePiece = nextPosition[sourceSquare];
      if (!sourcePiece) return false;
      delete nextPosition[sourceSquare];
      nextPosition[targetSquare] = sourcePiece;
    }

    setSetupPosition(nextPosition);
    setLastMove(null);
    return true;
  };

  const squareStyles = lastMove
    ? {
        [lastMove.from]: { backgroundColor: "rgba(205, 210, 106, 0.8)" },
        [lastMove.to]: { backgroundColor: "rgba(205, 210, 106, 0.8)" },
      }
    : {};

  const annotations =
    mode === "setup" ? (
      <Box sx={{ display: "flex", flexDirection: "column", gap: 1, alignItems: "center" }}>
        <Typography variant="subtitle2">Turn to move</Typography>
        <RadioGroup
          row
          value={turnToMove}
          onChange={(_, value) => {
            setTurnToMove(value === "b" ? "b" : "w");
          }}
        >
          <FormControlLabel value="w" control={<Radio size="small" />} label="White" />
          <FormControlLabel value="b" control={<Radio size="small" />} label="Black" />
        </RadioGroup>
        <Box sx={{ display: "flex", flexDirection: "row", gap: 3}}>
          <Button variant="contained" size="small" onClick={() => startFromCurrentPosition("play")}>
            Game
          </Button>
          <Button
            variant="contained"
            size="small"
            onClick={() => startFromCurrentPosition("analyze")}
          >
            Analyze
          </Button>
        </Box>
      </Box>
    ) : (
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
          positionFen={position}
          linesFen={linesFen}
          workerReady={ready}
        />
        <Box sx={{ flex: 1, minHeight: 0 }}>
          <MoveHistory
            moves={moves}
            currentPly={currentPly}
            onSelectPly={(ply) => {
              setPlaying(false);
              setBoardAtPly(ply);
            }}
            isDraw={game.isDraw()}
            isCheckmate={game.isCheckmate()}
            turn={game.turn()}
          />
        </Box>
      </Box>
    );

  return (
    <>
      <BoardLayout
        board={
          <>
            {mode === "setup" ? (
              <ChessboardProvider
                options={{
                  id: "set-position-board",
                  position: setupPosition,
                  boardOrientation,
                  pieces: customPieces,
                  allowDragging: true,
                  allowDragOffBoard: true,
                  showNotation: true,
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
                  onPieceDrop: handleSetupPieceDrop,
                }}
              >
                <Box
                  sx={{
                    width: BOARD_WIDTH + COORDINATES_WIDTH,
                    borderRadius: "10px",
                    boxShadow: "0 0 10px 0 rgba(0, 0, 0, 0.75)",
                    border: "1px solid #000",
                    backgroundColor: "rgba(181, 136, 99, 1)",
                    p: "10px",
                  }}
                >
                  <Box
                    sx={{
                      width: BOARD_WIDTH,
                      display: "grid",
                      gridTemplateColumns: "repeat(6, 1fr)",
                      gap: 4,
                      mb: 1
                    }}
                  >
                    {blackSparePieces.map((piece) => (
                      <Box key={piece} sx={{ width: 32, height: 32 }}>
                        <SparePiece pieceType={piece} />
                      </Box>
                    ))}
                  </Box>
                  <Box sx={{ width: BOARD_WIDTH, height: BOARD_WIDTH }}>
                    <Chessboard />
                  </Box>
                  <Box
                    sx={{
                      width: BOARD_WIDTH,
                      display: "grid",
                      gridTemplateColumns: "repeat(6, 1fr)",
                      gap: 4,
                      mt: 1
                    }}
                  >
                    {whiteSparePieces.map((piece) => (
                      <Box key={piece} sx={{ width: 32, height: 32 }}>
                        <SparePiece pieceType={piece} />
                      </Box>
                    ))}
                  </Box>
                </Box>
              </ChessboardProvider>
            ) : (
              <>
                <Box ref={boardAnchorRef} sx={{ display: "inline-block" }}>
                  <ChessBoard
                    position={position}
                    onDrop={handleDrop}
                    boardOrientation={boardOrientation}
                    customSquareStyles={squareStyles}
                    customArrows={engineEnabled ? bestMoveArrow : []}
                    arePiecesDraggable={currentPly === moves.length}
                  />
                </Box>
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
            )}
            {mode === "setup" ?
            <Box sx={{ display: "flex", flexDirection: "row", gap: 1 }}>
              <ScreenRotationAltIcon
                fontSize="small"
                onClick={() =>
                  setBoardOrientation((o) => (o === "white" ? "black" : "white"))
                }
                sx={{ mt: 1 }}
              />
              <DeleteOutlinedIcon
                fontSize="small"
                onClick={() => {
                  setSetupPosition({});
                  setLastMove(null);
                }}
                sx={{ mt: 1 }}
              />
            </Box> : null}
          </>
        }
        annotations={annotations}
      />
      <Snackbar
        open={Boolean(positionError)}
        autoHideDuration={3500}
        onClose={() => setPositionError(null)}
        anchorOrigin={{ vertical: "top", horizontal: "center" }}
      >
        <Alert severity="error" onClose={() => setPositionError(null)} variant="outlined">
          {positionError}
        </Alert>
      </Snackbar>
      <PromotionDialog
        open={pendingPromotion !== null}
        anchorEl={boardAnchorRef.current}
        color={pendingPromotion?.color ?? "w"}
        onClose={() => setPendingPromotion(null)}
        onSelect={(choice) => {
          if (!pendingPromotion) return;
          const { from, to } = pendingPromotion;
          setPendingPromotion(null);
          commitMove(from, to, choice);
        }}
      />
    </>
  );
}
