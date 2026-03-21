import type { ReactNode } from 'react'
import { Box } from '@mui/material'

const BOARD_WIDTH = 350

type BoardLayoutProps = {
  board: ReactNode
  annotations: ReactNode
}

export function BoardLayout({ board, annotations }: BoardLayoutProps) {
  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: { xs: 'column', md: 'row' },
        alignItems: { xs: 'center', md: 'flex-start' },
        justifyContent: 'center',
        gap: 2,
        minHeight: '100%',
        p: 2,
      }}
    >
      <Box sx={{ flexShrink: 0 }}>{board}</Box>
      <Box
        sx={{
          minWidth: { xs: '100%', md: 280 },
          maxWidth: { xs: '100%', md: 360 },
          order: { xs: 2, md: 0 },
          height: { xs: 'auto', md: BOARD_WIDTH },
        }}
      >
        {annotations}
      </Box>
    </Box>
  )
}

export { BOARD_WIDTH }
