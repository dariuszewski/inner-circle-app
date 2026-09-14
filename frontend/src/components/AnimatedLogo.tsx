import { Box } from '@mui/material'

import innerCircleLogo from '../assets/logo.svg'

function AnimatedLogo() {
  return (
    <Box
      sx={{
        mt: { xs: -2, sm: -3 },
        mb: 1,
        mx: 'auto',
        width: { xs: 260, sm: 330 },
        height: { xs: 260, sm: 330 },
        position: 'relative',
        display: 'grid',
        placeItems: 'center',
        '& img': {
          width: '100%',
          height: '100%',
          animation: 'spinRight 18s linear infinite',
        },
        '&::before': {
          content: '""',
          position: 'absolute',
          width: '42%',
          height: '42%',
          border: '2px solid rgba(59, 58, 63, 0.5)',
          borderRadius: '50%',
          animation: 'spinLeft 8s linear infinite',
          pointerEvents: 'none',
        },
        '&::after': {
          content: '""',
          position: 'absolute',
          width: 12,
          height: 12,
          borderRadius: '50%',
          backgroundColor: '#f9d589',
          animation: 'pulse 2s ease-in-out infinite',
          pointerEvents: 'none',
        },
        '@keyframes spinRight': {
          from: { transform: 'rotate(0deg)' },
          to: { transform: 'rotate(360deg)' },
        },
        '@keyframes spinLeft': {
          from: { transform: 'rotate(0deg)' },
          to: { transform: 'rotate(-360deg)' },
        },
        '@keyframes pulse': {
          '0%, 100%': { transform: 'scale(0.7)' },
          '50%': { transform: 'scale(2.4)' },
        },
        '@media (prefers-reduced-motion: reduce)': {
          '& img, &::before, &::after': {
            animation: 'none',
          },
        },
      }}
    >
      <img src={innerCircleLogo} alt="Inner Circle Logo" />
    </Box>
  )
}

export default AnimatedLogo
