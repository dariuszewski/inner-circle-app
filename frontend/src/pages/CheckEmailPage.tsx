import { Box, Link, Typography } from '@mui/material'
import { useEffect } from 'react'
import { Link as RouterLink, useLocation, useNavigate } from 'react-router'

import AnimatedLogo from '../components/AnimatedLogo'

export default function CheckEmailPage() {
  const location = useLocation()
  const verificationLink = location.state?.verificationLink || null
  const detail = location.state?.detail || null
  const navigate = useNavigate()

  // the backend link points at the API; route it through the frontend verify page instead
  const token = verificationLink?.split('/verify/').pop()
  const verifyUrl = token ? `/verify?token=${encodeURIComponent(token)}` : null

  useEffect(() => {
    if (!verificationLink && !detail) {
      navigate('/')
    }
  }, [verificationLink, detail, navigate])

  return (
    <>
      <AnimatedLogo />
      <Typography variant="h4" component="h1">
        Congratulations!
      </Typography>
      <Box sx={{ maxWidth: 400, mx: 'auto', mt: 3 }}>
        {verificationLink ? (
            <>
                <Typography variant="body1" sx={{ mt: 2 }}>
                    Your account has been created.
                </Typography>
                <Typography variant="body1" sx={{ mt: 2 }}>
                    Please check your email for a verification link... but after I add this feature. For now:
                </Typography>
                <Typography variant="body1" sx={{ mt: 2 }}>
                    {verifyUrl && (
                        <Link component={RouterLink} to={verifyUrl}>Verify your account here</Link>
                    )}
                </Typography>
            </>
        ) : (
            <>
                <Typography variant="body1" sx={{ mt: 2 }}>
                    Your demo account has been created. 
                </Typography>
                <Typography variant="body1" sx={{ mt: 2 }}>
                    You can now log in using your credentials.
                </Typography>
            </>
        )}
      </Box>
      <Typography variant="body2" sx={{ mt: 2 }}>
        <Link component={RouterLink} to="/login">
          Back to login
        </Link>
      </Typography>
    </>
  )
}
