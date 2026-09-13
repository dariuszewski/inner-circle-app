import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  Container,
  Divider,
  Paper,
  Typography,
} from '@mui/material'
import { useLoaderData } from 'react-router'

import AnimatedLogo from '../components/AnimatedLogo'
import type { RootData } from '../types/rootResponse'


function HomePage() {
  const { records, error } = useLoaderData<RootData>()

  return (
    <Container 
      maxWidth="sm" 
      disableGutters 
      sx={{ minHeight: '100dvh' }}
    >
      <Paper elevation={3} sx={{ minHeight: '100dvh', p: { xs: 2, sm: 3 }, pt: { xs: 1, sm: 2 }, textAlign: 'center', borderRadius: 2 }}>

        <AnimatedLogo />

        <Typography variant="h4" component="h1">
          Join the Inner Circle!
        </Typography>

        <Typography variant="body1" sx={{ my: { xs: 1.5, sm: 2 } }}>
          Create private spaces for you and your friends to share memories securely in your inner circle.
        </Typography>

        <Card variant="outlined" sx={{ my: { xs: 2, sm: 3 }, p: 0 }}>
          <CardContent sx={{ p: { xs: 1.5, sm: 2.5 }, '&:last-child': { pb: { xs: 1.5, sm: 2.5 } } }}>
            <Box
              sx={{
                display: 'flex',
                alignItems: 'stretch',
                justifyContent: 'center',
                gap: { xs: 1.5, sm: 3 },
                flexDirection: { xs: 'column', sm: 'row' },
              }}
            >
              <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                <Typography variant="h6" sx={{ fontSize: { xs: '1rem', sm: '1.25rem' }, mb: { xs: 0.5, sm: 1 } }}>
                  Already in the circle?
                </Typography>
                <Button variant="contained" color="primary" href="/login" sx={{ width: '100%', maxWidth: 180, py: 1 }}>
                  Log in
                </Button>
              </Box>

              <Divider orientation="vertical" flexItem sx={{ display: { xs: 'none', sm: 'block' } }} />
              <Divider sx={{ display: { xs: 'block', sm: 'none' }, my: 0.5 }} />

              <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                <Typography variant="h6" sx={{ fontSize: { xs: '1rem', sm: '1.25rem' }, mb: { xs: 0.5, sm: 1 } }}>
                  New to the circle?
                </Typography>
                <Button variant="outlined" color="primary" href="/register" sx={{ width: '100%', maxWidth: 180, py: 1 }}>
                  Register
                </Button>
              </Box>
            </Box>
          </CardContent>
        </Card>

        <Box sx={{ mt: { xs: 2, sm: 3 } }}>
          <Typography variant="h6" align="left" gutterBottom>
            API Status
          </Typography>

          {error && (
            <Alert severity="error" sx={{ textAlign: 'left' }}>
              Error: {error}
            </Alert>
          )}

          {records && (
            <Paper
              variant="outlined"
              sx={{
                p: 2,
                backgroundColor: 'grey.100',
                textAlign: 'left',
                overflowX: 'auto',
                fontFamily: 'monospace',
              }}
            >
              <pre style={{ margin: 0 }}>{JSON.stringify(records, null, 2)}</pre>
            </Paper>
          )}
        </Box>
      </Paper>
    </Container>
  )
}

export default HomePage;
