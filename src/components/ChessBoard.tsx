import { Chessboard } from 'react-chessboard'
import { BOARD_WIDTH } from './BoardLayout'
import { getCustomPieces } from '../pieces'

const customPieces = getCustomPieces()

const ARROW_COLOR = 'rgba(67, 160, 71, 0.9)'

type ChessBoardProps = {
  position: string
  onDrop: (source: string, target: string, piece: string) => boolean
  boardOrientation?: 'white' | 'black'
  customSquareStyles?: Record<string, React.CSSProperties>
  customArrows?: Array<[string, string]>
  arePiecesDraggable?: boolean
}

export function ChessBoard({
  position,
  onDrop,
  boardOrientation = 'white',
  customSquareStyles = {},
  customArrows = [],
  arePiecesDraggable = true,
}: ChessBoardProps) {
  const arrows = customArrows.map(([from, to]) => ({
    startSquare: from,
    endSquare: to,
    color: ARROW_COLOR,
  }))

  return (
    <div style={{ width: BOARD_WIDTH, height: BOARD_WIDTH }}>
      <Chessboard
        options={{
          id: 'main-board',
          position,
          boardOrientation,
          pieces: customPieces,
          boardStyle: {
            borderRadius: '10px',
            boxShadow: '0 0 10px 0 rgba(0, 0, 0, 0.5)',
            border: '1px solid #000',
            margin: '20px 0'
          },
          squareStyles: customSquareStyles,
          arrows,
          onPieceDrop: ({ sourceSquare, targetSquare, piece }) =>
            targetSquare ? onDrop(sourceSquare, targetSquare, piece.pieceType) : false,
          allowDragging: arePiecesDraggable,
          showNotation: true,
        }}
      />
    </div>
  )
}
