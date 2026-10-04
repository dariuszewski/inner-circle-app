import PasswordIcon from '@mui/icons-material/Password'
import { Box, Link, TextField, Typography } from '@mui/material'
import type { SubmitEventHandler } from 'react'
import { useState } from 'react'
import { Link as RouterLink } from 'react-router'

import { requestPasswordReset } from '../api/auth'
import CustomSubmitButton from '../components/CustomSubmitButton'
import SlidingSnackbar from '../components/SlidingSnackbar'
import { useAuth } from '../providers/useAuth'

export default function ForgotPasswordPage() {
  const auth = useAuth()
  const [email, setEmail] = useState(auth.user?.email ?? '')
  const [isLoading, setIsLoading] = useState(false)
  const [submitted, setSubmitted] = useState<{ detail: string; resetUrl: string | null } | null>(null)
  const [snackbar, setSnackbar] = useState<{ message: string; severity: 'success' | 'danger' } | null>(null)

  const handleSubmit: SubmitEventHandler<HTMLFormElement> = async (event) => {
    event.preventDefault()
    setIsLoading(true)
    setSnackbar(null)
    try {
      const data = await requestPasswordReset(email)
      // the backend link points at the API; route it through the frontend reset page instead
      const token = data.verification_link?.split('/reset-password/').pop()
      setSubmitted({
        detail: data.detail,
        resetUrl: token ? `/reset-password?token=${encodeURIComponent(token)}` : null,
      })
    } catch (error) {
      setSnackbar({
        message: error instanceof Error ? error.message : 'An unknown error occurred',
        severity: 'danger',
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <>
      <Typography variant="h4" component="h1">
        <PasswordIcon fontSize="medium" /> Forgot Password
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
          Send reset link
        </CustomSubmitButton>
      </Box>

      {submitted && (
        <Box sx={{ maxWidth: 400, mx: 'auto', mt: 3 }}>
          <Typography variant="body1">{submitted.detail}</Typography>
          {submitted.resetUrl && (
            <Typography variant="body1" sx={{ mt: 2 }}>
              Check your email for the link... but after I add this feature. For now:{' '}
              <Link component={RouterLink} to={submitted.resetUrl}>
                Reset your password here
              </Link>
            </Typography>
          )}
        </Box>
      )}

      <Typography variant="body2" sx={{ mt: 2 }}>
        <Link component={RouterLink} to={auth.user ? '/settings' : '/login'}>
          {auth.user ? 'Back to settings' : 'Back to login'}
        </Link>
      </Typography>

      <SlidingSnackbar
        open={snackbar !== null}
        message={snackbar?.message}
        severity={snackbar?.severity ?? 'info'}
        onClose={() => setSnackbar(null)}
      />
    </>
  )
}
