import { useEffect, useLayoutEffect, useState } from "react";
import { createPortal } from "react-dom";
import { Box, IconButton, Paper } from "@mui/material";
import { getPieceSvgUrl } from "../pieces";
import type { PromotionChoice } from "../utils/promotion";

const ORDER: PromotionChoice[] = ["q", "r", "n", "b"];

type PromotionDialogProps = {
  open: boolean;
  /** Element whose screen bounds define the overlay (wrap the chessboard). */
  anchorEl: HTMLElement | null;
  color: "w" | "b";
  onSelect: (piece: PromotionChoice) => void;
  onClose: () => void;
};

export function PromotionDialog({
  open,
  anchorEl,
  color,
  onSelect,
  onClose,
}: PromotionDialogProps) {
  const [rect, setRect] = useState<DOMRect | null>(null);

  useLayoutEffect(() => {
    if (!open || !anchorEl) {
      setRect(null);
      return;
    }
    const read = () => {
      setRect(anchorEl.getBoundingClientRect());
    };
    read();
    const ro = new ResizeObserver(read);
    ro.observe(anchorEl);
    window.addEventListener("scroll", read, true);
    window.addEventListener("resize", read);
    return () => {
      ro.disconnect();
      window.removeEventListener("scroll", read, true);
      window.removeEventListener("resize", read);
    };
  }, [open, anchorEl]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  if (!open || !anchorEl || !rect) return null;

  const overlay = (
    <Box
      role="presentation"
      sx={{
        position: "fixed",
        top: rect.top,
        left: rect.left,
        width: rect.width,
        height: rect.height,
        zIndex: (t) => t.zIndex.modal,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        bgcolor: "rgba(0, 0, 0, 0.42)",
      }}
      onClick={onClose}
    >
      <Paper
        component="div"
        role="dialog"
        aria-modal="true"
        aria-labelledby="promotion-dialog-title"
        elevation={10}
        sx={{ p: 1.5, pointerEvents: "auto" }}
        onClick={(e) => e.stopPropagation()}
      >
        <Box
          sx={{
            display: "flex",
            justifyContent: "center",
            gap: 1,
            flexWrap: "wrap",
          }}
        >
          {ORDER.map((p) => {
            const pieceType = `${color}${p.toUpperCase()}`;
            const src = getPieceSvgUrl(pieceType);
            if (!src) return null;
            return (
              <IconButton
                key={p}
                onClick={() => onSelect(p)}
                sx={{
                  p: 1,
                  borderRadius: 1,
                  border: "1px solid rgba(0, 0, 0, 0.12)",
                  width: 45,
                  height: 45,
                }}
                aria-label={`Promote to ${p}`}
              >
                <img
                  src={src}
                  alt=""
                  draggable={false}
                  style={{ width: 35, height: 35, objectFit: "contain" }}
                />
              </IconButton>
            );
          })}
        </Box>
      </Paper>
    </Box>
  );

  return createPortal(overlay, document.body);
}
