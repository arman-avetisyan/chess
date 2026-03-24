import { Box, Typography } from '@mui/material'
import type { EngineLine } from '../hooks/useStockfish'

type EngineLinesProps = {
  lines: EngineLine[]
  engineEnabled: boolean
  error?: string | null
  maxHeight?: number | string
  /** UCI worker finished handshake (uciok). Defaults to true for screens that don't need it. */
  workerReady?: boolean
  /** Board / replay state is synced before starting analysis. Defaults to true. */
  boardReady?: boolean
}

export function EngineLines({
  lines,
  engineEnabled,
  error,
  maxHeight,
  workerReady = true,
  boardReady = true,
}: EngineLinesProps) {
  const containerSx = maxHeight
    ? { p: 1, maxHeight, overflowY: 'auto' as const }
    : { p: 1 }

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
      <Typography variant="subtitle2" gutterBottom>
        Engine lines
      </Typography>
      {lines.map((line, i) => (
        <Box key={i} sx={{ mb: 1.5 }}>
          <Typography variant="body2">
            <strong>Line {i + 1}:</strong> {String(line.eval)}
          </Typography>
          <Typography variant="caption" display="block" color="text.secondary">
            {line.moves.join(' ')}
          </Typography>
        </Box>
      ))}
    </Box>
  )
}
