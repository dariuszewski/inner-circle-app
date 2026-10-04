import PasswordIcon from '@mui/icons-material/Password'
import { Box, Link, TextField, Typography } from '@mui/material'
import type { SubmitEventHandler } from 'react'
import { useState } from 'react'
import { Link as RouterLink, useSearchParams } from 'react-router'

import { confirmPasswordReset } from '../api/auth'
import CustomSubmitButton from '../components/CustomSubmitButton'
import SlidingSnackbar from '../components/SlidingSnackbar'


export default function ResetPasswordPage() {
  const [searchParams] = useSearchParams()
  const token = searchParams.get('token')
  const [password, setPassword] = useState('')
  const [password2, setPassword2] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [done, setDone] = useState(false)
  const [snackbar, setSnackbar] = useState<{ message: string; severity: 'success' | 'danger' } | null>(null)

  const handleSubmit: SubmitEventHandler<HTMLFormElement> = async (event) => {
    event.preventDefault()
    if (!token) return

    if (password !== password2) {
      setSnackbar({ message: 'Passwords do not match.', severity: 'danger' })
      return
    }

    setIsLoading(true)
    setSnackbar(null)
    try {
      await confirmPasswordReset({ token, password, password2 })
      setDone(true)
    } catch (error) {
      setSnackbar({
        message: error instanceof Error ? error.message : 'An unknown error occurred',
        severity: 'danger',
      })
    } finally {
      setIsLoading(false)
    }
  }

  if (!token) {
    return (
      <Typography variant="body1" role="alert">
        No reset token provided.{' '}
        <Link component={RouterLink} to="/forgot-password">
          Request a new link
        </Link>
      </Typography>
    )
  }

  if (done) {
    return (
      <>
        <Typography variant="h4" component="h1">
          <PasswordIcon fontSize="medium" /> Password updated
        </Typography>
        <Typography variant="body1" sx={{ mt: 2 }}>
          Your password has been reset. Please log in with the new password.
        </Typography>
        <Typography variant="body2" sx={{ mt: 2 }}>
          <Link component={RouterLink} to="/login">
            Go to login
          </Link>
        </Typography>
      </>
    )
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


      <SlidingSnackbar
        open={snackbar !== null}
        message={snackbar?.message}
        severity={snackbar?.severity ?? 'info'}
        onClose={() => setSnackbar(null)}
      />
    </>
  )
}