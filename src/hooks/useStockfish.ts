import { useCallback, useEffect, useRef, useState } from "react";
import { Chess } from "chess.js";

export type EngineLine = {
  eval: number | string;
  moves: string[];
};

type QueuedAnalysis = {
  fen: string;
  depth: number;
  multiPv: number;
  resolve: (lines: EngineLine[]) => void;
};

export function useStockfish(
  workerUrl: string = `${import.meta.env.BASE_URL}stockfish-18-lite-single.js`,
) {
  const [ready, setReady] = useState(false);
  const [lines, setLines] = useState<EngineLine[]>([]);
  /** FEN the current `lines` were computed for; `null` while a new search is pending (stale UI). */
  const [linesFen, setLinesFen] = useState<string | null>(null);
  const [bestMoveArrow, setBestMoveArrow] = useState<[string, string][]>([]);
  const [error, setError] = useState<string | null>(null);
  const workerRef = useRef<Worker | null>(null);
  /** Mirrors UCI readiness; state `ready` can lag one frame behind the worker — use this inside getAnalysis. */
  const readyRef = useRef(false);
  const pendingRef = useRef<{ resolve: (lines: EngineLine[]) => void } | null>(
    null,
  );
  const linesRef = useRef<EngineLine[]>([]);
  const bestMoveRef = useRef<string | null>(null);
  /** True while a `go` is in progress until we receive `bestmove`. */
  const searchingRef = useRef(false);
  /** Next search to run after `bestmove` (latest request wins while overlapping). */
  const queuedRef = useRef<QueuedAnalysis | null>(null);
  /** Runs a new search; must only be called when engine is idle or right after `bestmove`. */
  const beginSearchRef = useRef<(q: QueuedAnalysis) => void>(() => {});
  /** FEN for the search currently running (for eval POV). */
  const currentAnalysisFenRef = useRef<string>("");
  /** First `info` after a new search replaces lines instead of merging with stale UI. */
  const replaceLinesOnNextInfoRef = useRef(false);

  useEffect(() => {
    let worker: Worker;
    try {
      worker = new Worker(workerUrl);
      workerRef.current = worker;

      const beginSearch = (q: QueuedAnalysis) => {
        const w = workerRef.current;
        if (!w || !readyRef.current) {
          q.resolve([]);
          searchingRef.current = false;
          return;
        }
        let fen = q.fen;
        try {
          fen = new Chess(fen).fen();
        } catch {
          q.resolve([]);
          searchingRef.current = false;
          return;
        }
        searchingRef.current = true;
        currentAnalysisFenRef.current = fen;
        replaceLinesOnNextInfoRef.current = true;
        linesRef.current = [];
        setLinesFen(null);
        // Don't clear React `lines` or `bestMoveArrow` here — avoids board twitch on navigation; `bestmove` / `info` updates replace.
        pendingRef.current = { resolve: q.resolve };
        w.postMessage(`setoption name MultiPV value ${q.multiPv}`);
        w.postMessage(`position fen ${fen}`);
        w.postMessage(`go depth ${q.depth}`);
      };
      beginSearchRef.current = beginSearch;

      const processLine = (raw: string) => {
        const message = raw.trim();
        if (!message) return;

        if (message === "uciok") {
          readyRef.current = true;
          setReady(true);
          setError(null);
          return;
        }

        if (message.startsWith("bestmove")) {
          const parts = message.split(/\s+/);
          const bestMove = parts[1];
          if (bestMove && bestMove !== "(none)") {
            bestMoveRef.current = bestMove;
            const from = bestMove.slice(0, 2);
            const to = bestMove.slice(2, 4);
            setBestMoveArrow([[from, to]]);
          } else {
            bestMoveRef.current = null;
            setBestMoveArrow([]);
            if (linesRef.current.length === 0) {
              const fallback: EngineLine[] = [
                { eval: "Game over (no legal moves)", moves: [] },
              ];
              linesRef.current = fallback;
              setLines(fallback);
              try {
                setLinesFen(new Chess(currentAnalysisFenRef.current).fen());
              } catch {
                setLinesFen(currentAnalysisFenRef.current);
              }
            }
          }
          searchingRef.current = false;
          if (pendingRef.current) {
            pendingRef.current.resolve([...linesRef.current]);
            pendingRef.current = null;
          }
          const next = queuedRef.current;
          queuedRef.current = null;
          if (next) {
            beginSearch(next);
          }
          return;
        }

        if (message.startsWith("info") && message.includes("score")) {
          const scoreMatch = message.match(/score (cp|mate) (-?\d+)/);
          if (!scoreMatch) return;
          const hasPv = /\bpv\b/.test(message);
          const pvMatch = hasPv ? message.match(/\bpv\s+(.+)$/) : null;
          const moves = pvMatch
            ? pvMatch[1].trim().split(/\s+/).filter(Boolean)
            : [];
          const isMate = scoreMatch[1] === "mate";
          const raw = parseInt(scoreMatch[2], 10);
          // Stockfish reports cp from the side-to-move's perspective; convert to White POV (+ = White better).
          let fenForPov = currentAnalysisFenRef.current;
          try {
            fenForPov = new Chess(fenForPov).fen();
          } catch {
            fenForPov = currentAnalysisFenRef.current;
          }
          const turn = new Chess(fenForPov).turn();
          // Internal eval is from the side to move; UCI cp follows that — convert to White POV (+ = White better).
          let evalStr: number | string;
          if (isMate) {
            evalStr = `Mate in ${Math.abs(raw)}`;
          } else {
            const whiteCp = turn === "w" ? raw : -raw;
            evalStr = whiteCp / 100;
          }
          const line: EngineLine = { eval: evalStr, moves };
          const multiPvMatch = message.match(/\bmultipv\s+(\d+)/);
          const idx = multiPvMatch ? parseInt(multiPvMatch[1], 10) - 1 : 0;

          const resetBatch = replaceLinesOnNextInfoRef.current;
          if (resetBatch) {
            replaceLinesOnNextInfoRef.current = false;
            linesRef.current = [];
          }
          linesRef.current[idx] = line;
          setLines((prev) => {
            const base = resetBatch ? [] : [...prev];
            const next = [...base];
            next[idx] = line;
            return next.filter(Boolean);
          });
          try {
            setLinesFen(new Chess(currentAnalysisFenRef.current).fen());
          } catch {
            setLinesFen(currentAnalysisFenRef.current);
          }
        }
      };

      worker.onmessage = (event: MessageEvent<unknown>) => {
        const data = event.data;
        const text = typeof data === "string" ? data : String(data ?? "");
        for (const line of text.split(/\r?\n/)) {
          processLine(line);
        }
      };

      worker.onerror = () => {
        searchingRef.current = false;
        queuedRef.current = null;
        if (pendingRef.current) {
          pendingRef.current.resolve([]);
          pendingRef.current = null;
        }
        setError(
          "Failed to load Stockfish worker. Copy stockfish-18-lite-single.js and .wasm to public/.",
        );
        setReady(false);
        readyRef.current = false;
      };

      worker.postMessage("uci");
    } catch (e) {
      setError("Worker not supported or failed to load.");
      setReady(false);
    }

    return () => {
      readyRef.current = false;
      searchingRef.current = false;
      queuedRef.current = null;
      if (pendingRef.current) {
        pendingRef.current.resolve([]);
        pendingRef.current = null;
      }
      setReady(false);
      worker?.terminate();
      workerRef.current = null;
    };
  }, [workerUrl]);

  const getAnalysis = useCallback(
    (fen: string, depth: number = 15, multiPv: number = 3) => {
      return new Promise<EngineLine[]>((resolve) => {
        if (!workerRef.current || !readyRef.current) {
          resolve([]);
          return;
        }

        const entry: QueuedAnalysis = { fen, depth, multiPv, resolve };

        if (searchingRef.current) {
          // Replace any already-queued request; only send `stop` once until `bestmove` (extra stops can crash WASM)
          if (queuedRef.current) {
            queuedRef.current.resolve([]);
          } else {
            if (pendingRef.current) {
              pendingRef.current.resolve([...linesRef.current]);
              pendingRef.current = null;
            }
            workerRef.current.postMessage("stop");
          }
          queuedRef.current = entry;
          return;
        }

        beginSearchRef.current(entry);
      });
    },
    [],
  );

  const stopAnalysis = useCallback(() => {
    if (workerRef.current) workerRef.current.postMessage("stop");
  }, []);

  const getBestMove = useCallback(
    async (fen: string, depth: number = 15): Promise<string | null> => {
      bestMoveRef.current = null;
      await getAnalysis(fen, depth, 1);
      return bestMoveRef.current;
    },
    [getAnalysis],
  );

  return {
    ready,
    error,
    lines,
    linesFen,
    bestMoveArrow,
    setLines,
    setBestMoveArrow,
    getAnalysis,
    getBestMove,
    stopAnalysis,
  };
}
