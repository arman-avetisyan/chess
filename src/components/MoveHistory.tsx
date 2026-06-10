import type { ReactNode } from "react";
import { Box, Button, Typography } from "@mui/material";

type HistoryMove = {
  san: string;
};

type MoveHistoryProps = {
  moves: HistoryMove[];
  currentPly: number;
  onSelectPly: (ply: number) => void;
  title?: string;
  isDraw: boolean;
  isCheckmate: boolean;
  turn: string;
};

export function MoveHistory({
  moves,
  currentPly,
  onSelectPly,
  title = "Game history",
  isDraw,
  isCheckmate,
  turn,
}: MoveHistoryProps) {
  return (
    <Box
      sx={{
        display: "flex",
        flexDirection: "column",
        minHeight: 0,
        height: "100%",
      }}
    >
      <Typography variant="subtitle2" sx={{ px: 1, pt: 1, pb: 0.5 }}>
        {title}
      </Typography>
      <Box sx={{ overflowY: "auto", px: 1, pb: 1 }}>
        {moves.length === 0 ? (
          <Typography variant="body2" color="text.secondary">
            No moves yet
          </Typography>
        ) : (
          moves.reduce<ReactNode[]>((rows, _move, index) => {
            if (index % 2 !== 0) return rows;
            const whitePly = index + 1;
            const blackPly = index + 2;
            const whiteMove = moves[index];
            const blackMove = moves[index + 1];
            rows.push(
              <Box
                key={whitePly}
                sx={{
                  display: "flex",
                  alignItems: "center",
                  mb: 0.5,
                  gap: 0.5,
                }}
              >
                <Typography
                  variant="caption"
                  color="text.secondary"
                  sx={{ minWidth: 26, textAlign: "right", pr: 0.5 }}
                >
                  {Math.floor(index / 2) + 1}.
                </Typography>
                <Button
                  size="small"
                  variant={currentPly === whitePly ? "contained" : "text"}
                  onClick={() => onSelectPly(whitePly)}
                  sx={{ minWidth: 54, justifyContent: "flex-start" }}
                >
                  {whiteMove.san}
                </Button>
                {blackMove ? (
                  <Button
                    size="small"
                    variant={currentPly === blackPly ? "contained" : "text"}
                    onClick={() => onSelectPly(blackPly)}
                    sx={{ minWidth: 54, justifyContent: "flex-start" }}
                  >
                    {blackMove.san}
                  </Button>
                ) : (
                  <Box sx={{ width: 54 }} />
                )}
              </Box>,
            );
            return rows;
          }, [])
        )}
      </Box>
      {(isDraw || isCheckmate) && (
        <Typography variant="subtitle2" sx={{ alignSelf: "center" }}>
          {isDraw ? "1/2-1/2" : (isCheckmate && turn === "b") ? "1-0" : "0-1"}
        </Typography>
      )}
    </Box>
  );
}
