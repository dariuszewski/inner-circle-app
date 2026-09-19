import AlternateEmailIcon from '@mui/icons-material/AlternateEmail'
import { Box, TextField,Typography } from '@mui/material'
import { Link } from '@mui/material'
import type { SubmitEventHandler } from 'react'
import { useState } from 'react'
import { Link as RouterLink } from 'react-router'

import type { VerificationRequestResponse } from '../api/user'
import CustomSubmitButton from '../components/CustomSubmitButton'
import SlidingSnackbar from '../components/SlidingSnackbar'
import { useAuth } from '../providers/useAuth'


export default function ChangeEmailPage() {
  const auth = useAuth()
  const [email, setEmail] = useState(auth.user?.email || '')
  const [isLoading, setIsLoading] = useState(false)
  const [snackbar, setSnackbar] = useState<{ message: string; severity: 'success' | 'danger' } | null>(null)
  const [verifyUrl, setVerifyUrl] = useState<string | null>(null)

  const handleSubmit: SubmitEventHandler<HTMLFormElement> = async (event) => {
    event.preventDefault()
    setIsLoading(true)
    setSnackbar(null)
    setVerifyUrl(null)
    try {
      if (!auth.accessToken) {
        throw new Error('You are not authenticated.')
      }
      const res = await fetch('/api/users/change-email', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${auth.accessToken}`,
        },
        body: JSON.stringify({ email }),
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
      const token = data.verification_link?.split('/verify/').pop()
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
            <AlternateEmailIcon fontSize="medium" /> Change Email
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
          id="email"
          label="Email"
          name="email"
          type="email"
          variant="outlined"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
        <CustomSubmitButton isLoading={isLoading}>
          Submit
        </CustomSubmitButton>
      </Box>

      {verifyUrl && (
        <Box sx={{ maxWidth: 400, mx: 'auto', mt: 3 }}>
          <Typography variant="body1">
            Check your new email address to verify the change... when that is implemented.
          </Typography>
          <Typography variant="body1" sx={{ mt: 1 }}>
            For now, use this link:{' '}
            <Link component={RouterLink} to={verifyUrl}>
              Verify your new email
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