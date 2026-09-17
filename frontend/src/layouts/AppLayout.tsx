import LogoutIcon from '@mui/icons-material/Logout'
import { AppBar, Container, IconButton, Paper, Toolbar } from '@mui/material'
import { Navigate,Outlet } from 'react-router'

import { useAuth } from '../providers/useAuth'

export default function AppLayout() {
  const {
    user,
    isLoading,
    logoutUser,
  } = useAuth();

  if (isLoading) {
    return null;
  }

  if (!user) {
    return <Navigate to="/" replace />;
  }


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
        <AppBar position="static" color="transparent" elevation={0}>
          <Toolbar sx={{ justifyContent: 'flex-end', minHeight: 'auto' }}>
            <IconButton edge="end" aria-label="logout" onClick={logoutUser}>
              <LogoutIcon />
            </IconButton>
          </Toolbar>
        </AppBar>
        <Outlet />
      </Paper>
    </Container>
  )
}
