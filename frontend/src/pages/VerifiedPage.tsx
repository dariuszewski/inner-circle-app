import { Box, CircularProgress, Link, Typography } from '@mui/material'
import { useEffect, useState } from 'react'
import { Link as RouterLink, useSearchParams } from 'react-router'

import { verifyVerificationToken } from '../api/verification'
import AnimatedLogo from '../components/AnimatedLogo'

type VerificationStatus = 'pending' | 'success' | 'error'

// tokens are single-use, so dedupe the request across StrictMode's
// double-invoked effects (and accidental remounts) by caching the promise
const pendingVerifications = new Map<string, Promise<{ detail: string }>>()

function verifyOnce(token: string) {
  let promise = pendingVerifications.get(token)
  if (!promise) {
    promise = verifyVerificationToken(token).finally(() => {
      pendingVerifications.delete(token)
    })
    pendingVerifications.set(token, promise)
  }
  return promise
}

export default function VerifiedPage() {
  const [searchParams] = useSearchParams()
  const token = searchParams.get('token')
  const [status, setStatus] = useState<VerificationStatus>(token ? 'pending' : 'error')
  const [message, setMessage] = useState<string>(token ? '' : 'No verification token provided.')

  useEffect(() => {
    if (!token) {
      return
    }

    // StrictMode double-invokes effects in dev: the first run's cleanup sets
    // `cancelled = true`, then the effect re-runs with a live flag. Both runs
    // share the same request via verifyOnce, so only one HTTP call is made.
    let cancelled = false
    verifyOnce(token)
      .then((response) => {
        if (cancelled) return
        setStatus('success')
        setMessage(response.detail)
      })
      .catch((err) => {
        if (cancelled) return
        setStatus('error')
        setMessage(err instanceof Error ? err.message : 'Verification failed.')
      })

    return () => {
      cancelled = true
    }
  }, [token])

  return (
    <>
      <AnimatedLogo />
      {status === 'pending' && (
        <>
          <Typography variant="h4" component="h1">
            Verifying your account...
          </Typography>
          <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
            <CircularProgress />
          </Box>
        </>
      )}

      {status === 'success' && (
        <>
          <Typography variant="h4" component="h1">
            Thank you!
          </Typography>
          <Typography variant="body1" sx={{ mt: 2 }}>
            Your account is now verified. You can log in and start using the app.
          </Typography>
        </>
      )}

      {status === 'error' && (
        <>
          <Typography variant="h4" component="h1">
            Verification failed
          </Typography>
          <Typography variant="body1" sx={{ mt: 2 }}>
            {message || 'This verification link is invalid or has expired.'}
          </Typography>
        </>
      )}

      <Typography variant="body2" sx={{ mt: 2 }}>
        <Link component={RouterLink} to="/login">
          Go to login
        </Link>
      </Typography>
    </>
  )
}
