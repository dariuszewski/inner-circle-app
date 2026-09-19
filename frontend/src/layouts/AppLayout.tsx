import LogoutIcon from '@mui/icons-material/Logout'
import SettingsIcon from '@mui/icons-material/Settings'
import { AppBar, Box, Container, Divider, IconButton, Paper, Toolbar, Typography } from '@mui/material'
import { Navigate,Outlet,useNavigate } from 'react-router'

import innerCircleLogo from '../assets/logo.svg'
import { useAuth } from '../providers/useAuth'

export default function AppLayout() {
  const navigate = useNavigate();
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
          <Toolbar disableGutters sx={{ minHeight: 'auto' }}>
            <Box sx={{ flex: 1, display: 'flex', justifyContent: 'flex-start' }}>
              <IconButton edge="start" aria-label="settings" onClick={() => navigate('/settings')}>
                <SettingsIcon />
              </IconButton>
            </Box>
            <Box
              role="link"
              aria-label="back to collections"
              onClick={() => navigate('/collections')}
              sx={{ display: 'flex', alignItems: 'center', cursor: 'pointer' }}
            >
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
        <Divider sx={{ mb: 2, mt: 0 }} />
        <Outlet />
      </Paper>
    </Container>
  )
}
