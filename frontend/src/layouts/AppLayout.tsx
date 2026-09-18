import LogoutIcon from '@mui/icons-material/Logout'
import { AppBar, Box, Container, IconButton, Paper, Toolbar, Typography } from '@mui/material'
import { Navigate,Outlet } from 'react-router'

import innerCircleLogo from '../assets/logo.svg'
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
          <Toolbar sx={{ minHeight: 'auto' }}>
            <Box sx={{ flex: 1 }} />
            <Box sx={{ display: 'flex', alignItems: 'center' }}>
              <Typography variant="h6" component="span">
                INNER
              </Typography>
              <Box
                component="img"
                src={innerCircleLogo}
                alt=""
                sx={{ width: 28, height: 28 }}
              />
              <Typography variant="h6" component="span">
                CIRCLE
              </Typography>
            </Box>
            <Box sx={{ flex: 1, display: 'flex', justifyContent: 'flex-end' }}>
              <IconButton edge="end" aria-label="logout" onClick={logoutUser}>
                <LogoutIcon />
              </IconButton>
            </Box>
          </Toolbar>
        </AppBar>
        <Outlet />
      </Paper>
    </Container>
  )
}
