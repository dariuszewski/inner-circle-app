import { Box, Button, Typography } from '@mui/material'

import AnimatedLogo from '../components/AnimatedLogo'

function NotFoundPage() {
  return (
    <Box
        sx={{
          minHeight: '100dvh',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          textAlign: 'center',
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
      </Box>
  )
}

export default NotFoundPage
