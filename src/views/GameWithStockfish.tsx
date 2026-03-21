import { useEffect, useState } from 'react'
import { Chess } from 'chess.js'
import { Box, Button } from '@mui/material'
import { BoardLayout } from '../components/BoardLayout'
import { ChessBoard } from '../components/ChessBoard'
import { useStockfish } from '../hooks/useStockfish'
import { MoveHistory } from '../components/MoveHistory'

type GameWithStockfishProps = {
  onAnalyze?: (fen: string) => void
}

export function GameWithStockfish({ onAnalyze }: GameWithStockfishProps) {
  const [game] = useState(() => new Chess())
  const [initialFen] = useState(game.fen())
  const [moves, setMoves] = useState<
    Array<{ san: string; from: string; to: string; promotion?: 'q' | 'r' | 'b' | 'n' }>
  >([])
  const [currentPly, setCurrentPly] = useState(0)
  const [position, setPosition] = useState(game.fen())
  const [lastMove, setLastMove] = useState<{ from: string; to: string } | null>(null)
  const [boardOrientation, setBoardOrientation] = useState<'white' | 'black'>('white')
  const [gameOver, setGameOver] = useState(false)
  const [engineColor, setEngineColor] = useState<'w' | 'b'>('b')
  const { ready, getBestMove } = useStockfish()

  useEffect(() => {
    if (moves.length > 0) return
    setEngineColor(boardOrientation === 'white' ? 'b' : 'w')
  }, [boardOrientation, moves.length])

  const setBoardAtPly = (
    ply: number,
    moveList: Array<{ san: string; from: string; to: string; promotion?: 'q' | 'r' | 'b' | 'n' }> =
      moves,
  ) => {
    const navGame = new Chess(initialFen)
    for (let i = 0; i < ply; i += 1) {
      navGame.move({
        from: moveList[i].from,
        to: moveList[i].to,
        promotion: moveList[i].promotion,
      })
    }
    setPosition(navGame.fen())
    const previous = ply > 0 ? moveList[ply - 1] : null
    setLastMove(previous ? { from: previous.from, to: previous.to } : null)
    setCurrentPly(ply)
  }

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'ArrowLeft') {
        event.preventDefault()
        setBoardAtPly(Math.max(0, currentPly - 1))
      }
      if (event.key === 'ArrowRight') {
        event.preventDefault()
        setBoardAtPly(Math.min(moves.length, currentPly + 1))
      }
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [currentPly, moves.length])

  const makeEngineMove = async (
    latestMoves: Array<{ san: string; from: string; to: string; promotion?: 'q' | 'r' | 'b' | 'n' }> =
      moves,
    latestPly = currentPly,
  ) => {
    if (!ready || gameOver) return
    if (game.turn() !== engineColor) return
    if (latestPly !== latestMoves.length) return

    const bestMove = await getBestMove(game.fen())
    if (!bestMove || bestMove === '(none)') return

    const from = bestMove.slice(0, 2)
    const to = bestMove.slice(2, 4)
    const promotionChar = bestMove.length > 4 ? bestMove[4] : undefined

    const gameCopy = new Chess(game.fen())
    const move = gameCopy.move({
      from,
      to,
      promotion: promotionChar as 'q' | 'r' | 'b' | 'n' | undefined,
    })
    if (!move) return

    game.load(gameCopy.fen())
    const nextMoves = [
      ...latestMoves,
      {
        san: move.san,
        from: move.from,
        to: move.to,
        promotion: move.promotion as 'q' | 'r' | 'b' | 'n' | undefined,
      },
    ]
    setMoves(nextMoves)
    setBoardAtPly(nextMoves.length, nextMoves)
    if (gameCopy.isGameOver()) setGameOver(true)
  }

  useEffect(() => {
    if (!ready) return
    if (moves.length === 0) {
      void makeEngineMove(moves, currentPly)
    }
  }, [ready, engineColor, moves.length, currentPly])

  const handleDrop = (source: string, target: string, piece: string) => {
    if (currentPly !== moves.length) return false
    const gameCopy = new Chess(game.fen())
    const move = gameCopy.move({
      from: source,
      to: target,
      promotion: piece[1].toLowerCase() === 'p' ? 'q' : undefined,
    })
    if (!move) return false
    game.load(gameCopy.fen())
    const nextMoves = [
      ...moves,
      {
        san: move.san,
        from: move.from,
        to: move.to,
        promotion: move.promotion as 'q' | 'r' | 'b' | 'n' | undefined,
      },
    ]
    setMoves(nextMoves)
    setBoardAtPly(nextMoves.length, nextMoves)
    if (gameCopy.isGameOver()) setGameOver(true)
    void makeEngineMove(nextMoves, nextMoves.length)
    return true
  }

  const squareStyles = lastMove
    ? {
        [lastMove.from]: { backgroundColor: 'rgba(205, 210, 106, 0.8)' },
        [lastMove.to]: { backgroundColor: 'rgba(205, 210, 106, 0.8)' },
      }
    : {}

  return (
    <BoardLayout
      board={
        <>
          <ChessBoard
            position={position}
            onDrop={handleDrop}
            boardOrientation={boardOrientation}
            customSquareStyles={squareStyles}
            customArrows={[]}
          />
          <Button
            size="small"
            onClick={() => setBoardOrientation((o) => (o === 'white' ? 'black' : 'white'))}
            sx={{ mt: 1 }}
          >
            Flip board
          </Button>
        </>
      }
      annotations={
        <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
          <Box sx={{ flex: 1, minHeight: 0 }}>
            <MoveHistory moves={moves} currentPly={currentPly} onSelectPly={setBoardAtPly} />
          </Box>
          {gameOver && (
            <Button variant="contained" onClick={() => onAnalyze?.(game.fen())} sx={{ mt: 1 }}>
              Analyze
            </Button>
          )}
        </Box>
      }
    />
  )
}
