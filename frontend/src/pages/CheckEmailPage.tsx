import { Box, Link, Typography } from '@mui/material'
import { useEffect } from 'react'
import { Link as RouterLink, useLocation, useNavigate } from 'react-router'

import AnimatedLogo from '../components/AnimatedLogo'

export default function CheckEmailPage() {
  const location = useLocation()
  const state = location.state as {
    detail?: string
    email?: string | null
    verificationRequired?: boolean
  } | null
  const detail = state?.detail ?? null
  const navigate = useNavigate()

  useEffect(() => {
    if (!detail) {
      navigate('/')
    }
  }, [detail, navigate])

  return (
    <>
      <AnimatedLogo />
      <Typography variant="h4" component="h1">
        Congratulations!
      </Typography>
      <Box sx={{ maxWidth: 400, mx: 'auto', mt: 3 }}>
        {state?.verificationRequired ? (
            <>
                <Typography variant="body1" sx={{ mt: 2 }}>
                    Your account has been created.
                </Typography>
                <Typography variant="body1" sx={{ mt: 2 }}>
              Check {state.email} for a verification link to activate your account.
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
