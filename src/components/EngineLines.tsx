import { Box, Typography } from '@mui/material'
import type { EngineLine } from '../hooks/useStockfish'
import { normalizeFen, uciPvToSan } from '../utils/enginePvDisplay'

type EngineLinesProps = {
  lines: EngineLine[]
  engineEnabled: boolean
  error?: string | null
  maxHeight?: number | string
  /** FEN of the analyzed position (SAN moves instead of UCI in the PV). */
  positionFen?: string
  /** FEN the current `lines` belong to (from the engine hook). If unset or mismatched, show UCI. */
  linesFen?: string | null
  /** UCI worker finished handshake (uciok). Defaults to true for screens that don't need it. */
  workerReady?: boolean
  /** Board / replay state is synced before starting analysis. Defaults to true. */
  boardReady?: boolean
}

function formatPvMoves(
  positionFen: string | undefined,
  linesFen: string | null | undefined,
  uciMoves: string[],
): string {
  if (!positionFen || uciMoves.length === 0) return uciMoves.join(' ')
  if (linesFen == null || normalizeFen(positionFen) !== normalizeFen(linesFen)) {
    return uciMoves.join(' ')
  }
  const sans = uciPvToSan(positionFen, uciMoves)
  return sans.length > 0 ? sans.join(' ') : uciMoves.join(' ')
}

export function EngineLines({
  lines,
  engineEnabled,
  error,
  maxHeight,
  positionFen,
  linesFen,
  workerReady = true,
  boardReady = true,
}: EngineLinesProps) {
  const containerSx = maxHeight
    ? { p: 0.5, maxHeight, overflowY: 'auto' as const }
    : { p: 0.5 }

  if (error) {
    return (
      <Box sx={containerSx}>
        <Typography variant="body2" color="error">
          {error}
        </Typography>
      </Box>
    )
  }
  if (!engineEnabled || lines.length === 0) {
    let status = 'Engine off'
    if (engineEnabled) {
      if (!workerReady) status = 'Starting engine…'
      else if (!boardReady) status = 'Preparing board…'
      else status = 'Analyzing…'
    }
    return (
      <Box sx={containerSx}>
        <Typography variant="body2" color="text.secondary">
          {status}
        </Typography>
      </Box>
    )
  }
  return (
    <Box sx={containerSx}>
      {lines.map((line, i) => (
        <Box key={i} sx={{ mb: 0.5 }}>
          <Typography variant="caption" display="block" color="text.secondary">
            <strong>{String(line.eval)}</strong> {i + 1}. {formatPvMoves(positionFen, linesFen, line.moves)}
          </Typography>
        </Box>
      ))}
    </Box>
  )
}
