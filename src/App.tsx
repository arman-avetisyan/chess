import { useState } from 'react'
import {
  Box,
  Drawer,
  IconButton,
  List,
  ListItemButton,
  ListItemText,
  ListSubheader,
  Divider,
  Typography,
} from '@mui/material'
import { GameWithFriend } from './views/GameWithFriend'
import { GameWithStockfish } from './views/GameWithStockfish'
import { AnalyzeGame } from './views/AnalyzeGame'
import { SetPosition } from './views/SetPosition'

type TabPanelProps = {
  children: React.ReactNode
  value: number
  index: number
}

function TabPanel({ children, value, index }: TabPanelProps) {
  return (
    <div role="tabpanel" hidden={value !== index}>
      {value === index && <Box sx={{ py: 2 }}>{children}</Box>}
    </div>
  )
}

export default function App() {
  const [tab, setTab] = useState(0)
  const [gameSubTab, setGameSubTab] = useState(0)
  const [toolsSubTab, setToolsSubTab] = useState(0)
  const [drawerOpen, setDrawerOpen] = useState(false)
  const [analyzeFen, setAnalyzeFen] = useState<string | undefined>()

  const handleAnalyze = (fen: string) => {
    setAnalyzeFen(fen)
    setTab(1)
    setToolsSubTab(0)
  }

  return (
    <Box sx={{ display: 'flex', width: '100%', minHeight: '100vh', bgcolor: 'background.default' }}>
      <Box sx={{ flexGrow: 1, p: 2 }}>
        <Box sx={{ display: 'flex', justifyContent: 'flex-end' }}>
          <IconButton
            aria-label="Open navigation drawer"
            onClick={() => setDrawerOpen(true)}
            size="large"
          >
            ☰
          </IconButton>
        </Box>

        {tab === 0 && (
          <>
            <TabPanel value={gameSubTab} index={0}>
              <GameWithFriend onAnalyze={handleAnalyze} />
            </TabPanel>
            <TabPanel value={gameSubTab} index={1}>
              <GameWithStockfish onAnalyze={handleAnalyze} />
            </TabPanel>
          </>
        )}

        {tab === 1 && (
          <>
            <TabPanel value={toolsSubTab} index={0}>
              <AnalyzeGame key={analyzeFen} initialFen={analyzeFen} />
            </TabPanel>
            <TabPanel value={toolsSubTab} index={1}>
              <SetPosition />
            </TabPanel>
          </>
        )}
      </Box>

      <Drawer
        variant="persistent"
        anchor="right"
        open={drawerOpen}
        sx={{
          '& .MuiDrawer-paper': {
            width: 260,
            boxSizing: 'border-box',
          },
        }}
      >
        <Box sx={{ width: '100%', p: 2 }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
            <Typography variant="h6">Navigation</Typography>
            <IconButton
              aria-label="Close navigation drawer"
              size="small"
              onClick={() => setDrawerOpen(false)}
            >
              ×
            </IconButton>
          </Box>
          <Divider sx={{ mb: 1 }} />

          <List
            subheader={
              <ListSubheader component="div" disableSticky>
                Game
              </ListSubheader>
            }
          >
            <ListItemButton
              selected={tab === 0 && gameSubTab === 0}
              onClick={() => {
                setTab(0)
                setGameSubTab(0)
                setDrawerOpen(false)
              }}
            >
              <ListItemText primary="Game with friend" />
            </ListItemButton>
            <ListItemButton
              selected={tab === 0 && gameSubTab === 1}
              onClick={() => {
                setTab(0)
                setGameSubTab(1)
                setDrawerOpen(false)
              }}
            >
              <ListItemText primary="Game with Stockfish" />
            </ListItemButton>
          </List>

          <List
            subheader={
              <ListSubheader component="div" disableSticky>
                Tools
              </ListSubheader>
            }
          >
            <ListItemButton
              selected={tab === 1 && toolsSubTab === 0}
              onClick={() => {
                setTab(1)
                setToolsSubTab(0)
                setDrawerOpen(false)
              }}
            >
              <ListItemText primary="Analyze game" />
            </ListItemButton>
            <ListItemButton
              selected={tab === 1 && toolsSubTab === 1}
              onClick={() => {
                setTab(1)
                setToolsSubTab(1)
                setDrawerOpen(false)
              }}
            >
              <ListItemText primary="Set position" />
            </ListItemButton>
          </List>
        </Box>
      </Drawer>
    </Box>
  )
}
