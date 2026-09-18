import { Box, Button, Divider,Link, TextField, Typography } from '@mui/material'
import type { SubmitEventHandler } from 'react'
import { useState } from 'react'
import { Link as RouterLink, useNavigate } from 'react-router'

import { register } from '../api/auth'
import AnimatedLogo from '../components/AnimatedLogo'
import SlidingSnackbar from '../components/SlidingSnackbar'

export default function RegisterPage() {

  const [error, setError] = useState<string | null>(null)
  const navigate = useNavigate()

  const handleSubmit: SubmitEventHandler<HTMLFormElement> = async (event) => {
    event.preventDefault()
    const formData = new FormData(event.currentTarget)
    const username = formData.get('username') as string
    const password = formData.get('password') as string
    const password2 = formData.get('confirm-password') as string
    const email = formData.get('email') as string | null

    if (password !== password2) {
      setError("Passwords do not match.")
      return
    }

    try {
      const response = await register({ username, password, password2, email: email || undefined })
      navigate(
        '/check-email',
        {
          state:
          {
            detail: response.detail,
            verificationLink: response.verification_link
          }
        }
      )
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Registration failed. Please try again.')
    }
  }
  return (
    <>
      <AnimatedLogo />
      <Typography variant="h4" component="h1">
        Join the Inner Circle!
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
        <TextField id="username" label="Username" name="username" variant="outlined" required />
        <TextField id="password" label="Password" name="password" type="password" variant="outlined" required />
        <TextField id="confirm-password" label="Confirm Password" name="confirm-password" type="password" variant="outlined" required />

        <Divider sx={{ my: 1 }} />
        <Typography variant="body1">
          Optionally, provide your email to enjoy all features.
        </Typography>
        <TextField id="email" label="Email (Optional)" name="email" type="email" variant="outlined" />

        <Button type="submit" variant="contained" color="primary">
          Register
        </Button>
      </Box>

      <Typography variant="body2" sx={{ mt: 2 }}>
        Already have an account?{' '}
        <Link component={RouterLink} to="/login">
          Login here
        </Link>
      </Typography>

      <SlidingSnackbar
        open={error !== null}
        message={error}
        severity="danger"
        onClose={() => setError(null)}
      />

    </>
  )
}
