import { Container, Paper } from '@mui/material'
import { Outlet } from 'react-router'

export default function RootLayout() {
  return (
    <Container
      maxWidth="sm"
      disableGutters
      sx={{ minHeight: '100dvh' }}
    >
      <Paper
        sx={{
          boxShadow: 'none',
          minHeight: '100dvh',
          p: { xs: 2, sm: 3 },
          pt: { xs: 1, sm: 2 },
          textAlign: 'center',
          borderRadius: 2,
        }}
      >
        <Outlet />
      </Paper>
    </Container>
  )
}
