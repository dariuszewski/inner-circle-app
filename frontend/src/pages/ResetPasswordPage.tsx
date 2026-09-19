import PasswordIcon from '@mui/icons-material/Password'
import { Box, Link, TextField, Typography } from '@mui/material'
import type { SubmitEventHandler } from 'react'
import { useState } from 'react'
import { Link as RouterLink } from 'react-router'

import type { VerificationRequestResponse } from '../api/user'
import CustomSubmitButton from '../components/CustomSubmitButton'
import SlidingSnackbar from '../components/SlidingSnackbar'


export default function ResetPasswordPage() {
  const [password, setPassword] = useState('')
  const [password2, setPassword2] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [snackbar, setSnackbar] = useState<{ message: string; severity: 'success' | 'danger' } | null>(null)
  const [verifyUrl, setVerifyUrl] = useState<string | null>(null)

  const handleSubmit: SubmitEventHandler<HTMLFormElement> = async (event) => {
    event.preventDefault()
    setIsLoading(true)
    setSnackbar(null)
    setVerifyUrl(null)
    try {
      const res = await fetch('/api/users/reset-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ password, password2 }),
      })
      if (!res.ok) {
        let message = `HTTP error! Status: ${res.status}`
        try {
          const body: unknown = await res.json()
          if (
            typeof body === 'object' &&
            body !== null &&
            'detail' in body &&
            typeof (body as { detail: unknown }).detail === 'string'
          ) {
            message = (body as { detail: string }).detail
          }
        } catch {
          // body was not JSON, keep the generic status message
        }
        throw new Error(message)
      }
      const data = await res.json() as VerificationRequestResponse
      // the backend link points at the API; route it through the protected frontend verify page instead
      const token = data.verification_link?.split('/reset-password/').pop()
      setVerifyUrl(token ? `/settings/verify?token=${encodeURIComponent(token)}` : null)
    } catch (err) {
      setSnackbar({
        message: err instanceof Error ? err.message : 'An unknown error occurred',
        severity: 'danger',
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <>
        <Typography variant="h4" component="h1">
            <PasswordIcon fontSize="medium" /> Reset Password
        </Typography>
      <Box
        component="form"
        onSubmit={handleSubmit}
        sx={{
          display: 'flex',
          flexDirection: 'column',
          gap: 2,
          maxWidth: 400,
          mx: 'auto',
          mt: 3,
        }}
      >
        <TextField
          id="password"
          label="New Password"
          name="password"
          type="password"
          variant="outlined"
          required
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />
        <TextField
          id="password2"
          label="Confirm New Password"
          name="password2"
          type="password"
          variant="outlined"
          required
          value={password2}
          onChange={(e) => setPassword2(e.target.value)}
        />
        <CustomSubmitButton isLoading={isLoading}>
          Submit
        </CustomSubmitButton>
      </Box>

      {verifyUrl && (
        <Box sx={{ maxWidth: 400, mx: 'auto', mt: 3 }}>
          <Typography variant="body1">
            Check your email address for a password reset link... when that is implemented.
          </Typography>
          <Typography variant="body1" sx={{ mt: 1 }}>
            For now, use this link:{' '}
            <Link component={RouterLink} to={verifyUrl}>
              Reset your password
            </Link>
          </Typography>
        </Box>
      )}

      <SlidingSnackbar
        open={snackbar !== null}
        message={snackbar?.message}
        severity={snackbar?.severity ?? 'info'}
        onClose={() => setSnackbar(null)}
      />
    </>
  )
}