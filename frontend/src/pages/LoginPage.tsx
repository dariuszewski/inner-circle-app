import { Box, Button, Link, TextField, Typography } from '@mui/material'
import type { SubmitEventHandler } from 'react'
import { useState } from 'react'
import { Link as RouterLink } from 'react-router'

import { getCurrentUser, login } from '../api/auth'
import AnimatedLogo from '../components/AnimatedLogo'
import SlidingSnackbar from '../components/SlidingSnackbar'
import { useAuth } from '../providers/useAuth'

export default function LoginPage() {
  const auth = useAuth()
  // const [error, setError] = useState<string | null>(null)
  const [snackbar, setSnackbar] = useState<{ message: string; severity: 'success' | 'danger' } | null>(null)

  const handleSubmit: SubmitEventHandler<HTMLFormElement> = async (event) => {
    event.preventDefault()
    const formData = new FormData(event.currentTarget)
    const username = formData.get('username') as string
    const password = formData.get('password') as string
    try {
      // login the user and retrieve tokens
      const tokens = await login({ username, password })
      // store the refresh token in local storage
      localStorage.setItem("refresh_token", tokens.refresh_token);
      // get the current user using the access token
      const currentUser = await getCurrentUser(tokens.access_token)
      // log the user in frontend by updating the auth context
      auth.loginUser(currentUser, tokens.access_token)
    } catch (error) {
      console.error(error)
      setSnackbar({ message: 'Login failed. Please check your credentials and try again.', severity: 'danger' })
    }
  }

  const handleResetPassword = () => {
    // Implement the reset password logic here
    setSnackbar({ message: 'Feature not implemented yet', severity: 'danger' })
  }
  
  return (
    <>
      <AnimatedLogo />
      <Typography variant="h4" component="h1">
        Welcome Back!
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
        <TextField id="username" label="Username or Email" name="username" variant="outlined" required />
        <TextField id="password" label="Password" name="password" type="password" variant="outlined" required />
        <Button type="submit" variant="contained" color="primary">
          Login
        </Button>
      </Box>

      <Typography variant="body2" sx={{ mt: 2 }}>
        No account yet?{' '}
        <Link component={RouterLink} to="/register">
          Register here
        </Link>
      </Typography>

      <Typography variant="body2" sx={{ mt: 2 }}>
        Forgot your password?{' '}
        <Typography component={Link} onClick={handleResetPassword}>
          Reset it here
        </Typography>
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