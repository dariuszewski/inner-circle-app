import { Button, Container, Paper, Typography } from '@mui/material'

import AnimatedLogo from '../components/AnimatedLogo'

function NotFoundPage() {
  return (
    <Container
      maxWidth="sm"
      disableGutters
      sx={{ minHeight: '100dvh', display: 'grid', placeItems: 'center' }}
    >
      <Paper
        elevation={3}
        sx={{
          width: '100%',
          minHeight: '100dvh',
          p: { xs: 2, sm: 4 },
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          textAlign: 'center',
          borderRadius: { xs: 0, sm: 2 },
        }}
      >
        <AnimatedLogo />
        <Typography variant="h1" color="primary" sx={{ fontWeight: 700, lineHeight: 1 }}>
          404
        </Typography>
        <Typography variant="h5" sx={{ mt: 2 }}>
          This circle is out of reach.
        </Typography>
        <Typography color="text.secondary" sx={{ mt: 1, mb: 3, maxWidth: 360 }}>
          The page you are looking for does not exist or may have moved.
        </Typography>
        <Button variant="contained" color="primary" href="/">
          Return home
        </Button>
      </Paper>
    </Container>
  )
}

export default NotFoundPage
