import { Box, Typography } from '@mui/material'
import type { EngineLine } from '../hooks/useStockfish'

type EngineLinesProps = {
  lines: EngineLine[]
  engineEnabled: boolean
  error?: string | null
  maxHeight?: number | string
}

export function EngineLines({ lines, engineEnabled, error, maxHeight }: EngineLinesProps) {
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
    return (
      <Box sx={containerSx}>
        <Typography variant="body2" color="text.secondary">
          {engineEnabled ? 'Analyzing…' : 'Engine off'}
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
