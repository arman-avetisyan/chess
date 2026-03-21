import { useState, useEffect } from 'react'
import { Chess } from 'chess.js'
import { Box, Button, FormControlLabel, Switch } from '@mui/material'
import { BoardLayout } from '../components/BoardLayout'
import { ChessBoard } from '../components/ChessBoard'
import { EngineLines } from '../components/EngineLines'
import { useStockfish } from '../hooks/useStockfish'
import { MoveHistory } from '../components/MoveHistory'

type AnalyzeGameProps = {
  initialFen?: string
}

export function AnalyzeGame({ initialFen }: AnalyzeGameProps) {
  const [game] = useState(() => new Chess(initialFen ?? undefined))
  const [startFen] = useState(game.fen())
  const [moves, setMoves] = useState<
    Array<{ san: string; from: string; to: string; promotion?: 'q' | 'r' | 'b' | 'n' }>
  >([])
  const [currentPly, setCurrentPly] = useState(0)
  const [position, setPosition] = useState(game.fen())
  const [lastMove, setLastMove] = useState<{ from: string; to: string } | null>(null)
  const [boardOrientation, setBoardOrientation] = useState<'white' | 'black'>('white')
  const [engineEnabled, setEngineEnabled] = useState(false)
  const { ready, lines, bestMoveArrow, getAnalysis, setLines, setBestMoveArrow, error } = useStockfish()

  const setBoardAtPly = (
    ply: number,
    moveList: Array<{ san: string; from: string; to: string; promotion?: 'q' | 'r' | 'b' | 'n' }> =
      moves,
  ) => {
    const navGame = new Chess(startFen)
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

  useEffect(() => {
    if (engineEnabled && ready) {
      getAnalysis(position).catch(() => {})
    } else {
      setLines([])
      setBestMoveArrow([])
    }
  }, [position, engineEnabled, ready])

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
    return true
  }

  const squareStyles = lastMove
    ? {
        [lastMove.from]: { backgroundColor: 'rgba(205, 210, 106, 0.8)' },
        [lastMove.to]: { backgroundColor: 'rgba(205, 210, 106, 0.8)' },
      }
    : {}

  const annotations = (
    <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      <FormControlLabel
        control={
          <Switch
            checked={engineEnabled}
            onChange={(_, v) => setEngineEnabled(v)}
            disabled={!ready}
          />
        }
        label="Chess engine"
      />
      <EngineLines lines={lines} engineEnabled={engineEnabled} error={error} maxHeight="40%" />
      <Box sx={{ flex: 1, minHeight: 0 }}>
        <MoveHistory moves={moves} currentPly={currentPly} onSelectPly={setBoardAtPly} />
      </Box>
      <Button
        size="small"
        onClick={() => setBoardOrientation((o) => (o === 'white' ? 'black' : 'white'))}
        sx={{ mt: 1 }}
      >
        Flip board
      </Button>
    </Box>
  )

  return (
    <BoardLayout
      board={
        <ChessBoard
          position={position}
          onDrop={handleDrop}
          boardOrientation={boardOrientation}
          customSquareStyles={squareStyles}
          customArrows={engineEnabled ? bestMoveArrow : []}
          arePiecesDraggable={currentPly === moves.length}
        />
      }
      annotations={annotations}
    />
  )
}
