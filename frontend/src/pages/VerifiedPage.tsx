import { Box, CircularProgress, Link, Typography } from '@mui/material'
import { useEffect, useRef, useState } from 'react'
import { Link as RouterLink, useLocation, useNavigate } from 'react-router'

import { verifyVerificationToken } from '../api/verification'
import AnimatedLogo from '../components/AnimatedLogo'

type VerificationStatus = 'pending' | 'success' | 'error'

type VerifiedPageProps = {
  /** token to verify; falls back to the email-link hash when omitted */
  token?: string | null
  pendingTitle?: string
  successTitle?: string
  /** success body shown when the backend returns no detail message */
  successFallback?: string
  /** footer link; pass null to hide it */
  footerLink?: { to: string; label: string } | null
  showLogo?: boolean
  /** called after the verification request succeeds (e.g. to refresh auth state) */
  onVerified?: (detail: string) => void
}

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

export default function VerifiedPage({
  token: tokenProp,
  pendingTitle = 'Verifying your account...',
  successTitle = 'Thank you!',
  successFallback = 'Your account is now verified. You can log in and start using the app.',
  footerLink = { to: '/login', label: 'Go to login' },
  showLogo = true,
  onVerified,
}: VerifiedPageProps) {
  const location = useLocation()
  const navigate = useNavigate()
  const [token] = useState(() =>
    tokenProp ?? new URLSearchParams(location.hash.slice(1)).get('token'),
  )
  const [status, setStatus] = useState<VerificationStatus>(token ? 'pending' : 'error')
  const [message, setMessage] = useState<string>(token ? '' : 'No verification token provided.')


const onVerifiedRef = useRef(onVerified)

  useEffect(() => {
    onVerifiedRef.current = onVerified
  }, [onVerified])

  useEffect(() => {
    if (location.hash) {
      navigate(location.pathname, { replace: true })
    }
  }, [location.hash, location.pathname, navigate])

  useEffect(() => {
    if (!token) {
      return
    }

    let cancelled = false
    verifyOnce(token)
      .then((response) => {
        if (cancelled) return
        setStatus('success')
        setMessage(response.detail)
        onVerifiedRef.current?.(response.detail)
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
    <Box
      sx={{
        minHeight: {
          xs: 'calc(100dvh - 24px)',
          sm: 'calc(100dvh - 40px)',
        },
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      {showLogo && status === 'success' && <AnimatedLogo />}
      {status === 'pending' && (
        <>
          <Typography variant="h4" component="h1">
            {pendingTitle}
          </Typography>
          <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
            <CircularProgress />
          </Box>
        </>
      )}

      {status === 'success' && (
        <>
          <Typography variant="h4" component="h1">
            {successTitle}
          </Typography>
          <Typography variant="body1" sx={{ mt: 2 }}>
            {message || successFallback}
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

      {footerLink && (
        <Typography variant="body2" sx={{ mt: 2 }}>
          <Link component={RouterLink} to={footerLink.to}>
            {footerLink.label}
          </Link>
        </Typography>
      )}
    </Box>
  )
}
