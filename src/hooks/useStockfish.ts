import { useCallback, useEffect, useRef, useState } from 'react'

export type EngineLine = {
  eval: number | string
  moves: string[]
}

export function useStockfish(workerUrl: string = '/stockfish-18-lite-single.js') {
  const [ready, setReady] = useState(false)
  const [lines, setLines] = useState<EngineLine[]>([])
  const [bestMoveArrow, setBestMoveArrow] = useState<[string, string][]>([])
  const [error, setError] = useState<string | null>(null)
  const workerRef = useRef<Worker | null>(null)
  const pendingRef = useRef<{ resolve: (lines: EngineLine[]) => void } | null>(null)
  const linesRef = useRef<EngineLine[]>([])
  const bestMoveRef = useRef<string | null>(null)

  useEffect(() => {
    let worker: Worker
    try {
      worker = new Worker(workerUrl)
      workerRef.current = worker

      worker.onmessage = (event: MessageEvent<string>) => {
        const message = event.data

        if (message === 'uciok') {
          setReady(true)
          setError(null)
          return
        }

        if (message.startsWith('bestmove')) {
          const parts = message.split(/\s+/)
          const bestMove = parts[1]
          if (bestMove && bestMove !== '(none)') {
            bestMoveRef.current = bestMove
            const from = bestMove.slice(0, 2)
            const to = bestMove.slice(2, 4)
            setBestMoveArrow([[from, to]])
          }
          if (pendingRef.current) {
            pendingRef.current.resolve([...linesRef.current])
            pendingRef.current = null
          }
          return
        }

        if (message.startsWith('info') && message.includes('score') && message.includes(' pv ')) {
          const scoreMatch = message.match(/score (cp|mate) (-?\d+)/)
          const pvMatch = message.match(/ pv ([^\n]+)/)
          const moves = pvMatch ? pvMatch[1].trim().split(/\s+/) : []
          const isMate = scoreMatch?.[1] === 'mate'
          const value = scoreMatch ? parseInt(scoreMatch[2], 10) : 0
          const evalStr = isMate ? `Mate in ${Math.abs(value)}` : value / 100
          const line: EngineLine = { eval: evalStr, moves }
          const multiPvMatch = message.match(/ multipv (\d+)/)
          const idx = multiPvMatch ? parseInt(multiPvMatch[1], 10) - 1 : 0
          linesRef.current[idx] = line
          setLines((prev) => {
            const next = [...prev]
            next[idx] = line
            return next.filter(Boolean)
          })
        }
      }

      worker.onerror = () => {
        setError('Failed to load Stockfish worker. Copy stockfish-18-lite-single.js and .wasm to public/.')
        setReady(false)
      }

      worker.postMessage('uci')
    } catch (e) {
      setError('Worker not supported or failed to load.')
      setReady(false)
    }

    return () => {
      worker?.terminate()
      workerRef.current = null
    }
  }, [workerUrl])

  const getAnalysis = useCallback((fen: string, depth: number = 15, multiPv: number = 3) => {
    return new Promise<EngineLine[]>((resolve) => {
      if (!workerRef.current || !ready) {
        resolve([])
        return
      }
      linesRef.current = []
      setLines([])
      setBestMoveArrow([])
      pendingRef.current = { resolve }
      workerRef.current.postMessage(`setoption name MultiPV value ${multiPv}`)
      workerRef.current.postMessage(`position fen ${fen}`)
      workerRef.current.postMessage(`go depth ${depth}`)
    })
  }, [ready])

  const stopAnalysis = useCallback(() => {
    if (workerRef.current) workerRef.current.postMessage('stop')
  }, [])

  const getBestMove = useCallback(
    async (fen: string, depth: number = 15): Promise<string | null> => {
      bestMoveRef.current = null
      await getAnalysis(fen, depth, 1)
      return bestMoveRef.current
    },
    [getAnalysis],
  )

  return {
    ready,
    error,
    lines,
    bestMoveArrow,
    setLines,
    setBestMoveArrow,
    getAnalysis,
    getBestMove,
    stopAnalysis,
  }
}
