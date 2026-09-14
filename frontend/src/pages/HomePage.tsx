import {
  Box,
  Button,
  Card,
  CardContent,
  Container,
  Divider,
  Paper,
  Typography,
} from '@mui/material'
import { QRCodeSVG } from 'qrcode.react'
import { useState } from 'react'
import { useLoaderData } from 'react-router'

import AnimatedLogo from '../components/AnimatedLogo'
import SlidingSnackbar from '../components/SlidingSnackbar'
import type { RootData } from '../types/rootResponse'

function HomePage() {
  const { records, error } = useLoaderData<RootData>()
  const [toastOpen, setToastOpen] = useState(Boolean(records || error))

  return (
    <Container 
      maxWidth="sm" 
      disableGutters 
      sx={{ minHeight: '100dvh' }}
    >
      <Paper sx={{ boxShadow: 'none', minHeight: '100dvh', p: { xs: 2, sm: 3 }, pt: { xs: 1, sm: 2 }, textAlign: 'center', borderRadius: 2 }}>

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
                <Typography variant="body1" sx={{ mb: { xs: 0.5, sm: 1 } }}>
                  Already in the circle?
                </Typography>
                <Button variant="contained" color="primary" href="/login" sx={{ width: '100%', maxWidth: 240, py: 1 }}>
                  Log in
                </Button>
              </Box>

              <Divider orientation="vertical" flexItem sx={{ display: { xs: 'none', sm: 'block' } }} />
              <Divider sx={{ display: { xs: 'block', sm: 'none' }, my: 0.5 }} />

              <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                <Typography variant="body1" sx={{ mb: { xs: 0.5, sm: 1 } }}>
                  No email required to join!
                </Typography>
                <Button variant="outlined" color="primary" href="/register" sx={{ width: '100%', maxWidth: 240, py: 1 }}>
                  Sign up
                </Button>
              </Box>
            </Box>
          </CardContent>
        </Card>

        <Box sx={{ mt: { xs: 2, sm: 3 }, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
          <Typography variant="h6" gutterBottom>
            Share the Inner Circle app with your friends!
          </Typography>
          <Box sx={{ p: 1.5, backgroundColor: '#FFFFFF', borderRadius: 1 }}>
            <QRCodeSVG
              value={window.location.origin}
              size={220}
              bgColor="#FFFFFF"
              fgColor="#000000"
            />
          </Box>
        </Box>

        <SlidingSnackbar
          open={toastOpen}
          onClose={() => setToastOpen(false)}
          severity={error ? 'danger' : 'success'}
          message={error ? `API error: ${error}` : 'Services are up and running.'}
        />
      </Paper>
    </Container>
  )
}

export default HomePage;
