import BadgeIcon from '@mui/icons-material/Badge'
import { Box, TextField,Typography } from '@mui/material'
import type { SubmitEventHandler } from 'react'
import { useState } from 'react'

import CustomSubmitButton from '../components/CustomSubmitButton'
import SlidingSnackbar from '../components/SlidingSnackbar'
import { useAuth } from '../providers/useAuth'
import type { UserResponsePrivate } from '../types/userResponse'
export default function UpdateProfilePage() {
  const auth = useAuth()
  const [username, setUsername] = useState(auth.user?.username || '')
  const [isLoading, setIsLoading] = useState(false)
  const [snackbar, setSnackbar] = useState<{ message: string; severity: 'success' | 'danger' } | null>(null)

  const handleSubmit: SubmitEventHandler<HTMLFormElement> = async (event) => {
    event.preventDefault()
    setIsLoading(true)
    setSnackbar(null)
    try {
      if (!auth.accessToken) {
        throw new Error('You are not authenticated.')
      }
      const res = await fetch('/api/users/update', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${auth.accessToken}`,
        },
        body: JSON.stringify({ username }),
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
      const updatedUser = await res.json() as UserResponsePrivate
      auth.updateUser(updatedUser)
      setSnackbar({ message: 'Profile updated successfully.', severity: 'success' })
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
            <BadgeIcon fontSize="medium" /> Update Profile
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
          id="username"
          label="Username or Email"
          name="username"
          variant="outlined"
          required
          value={username}
          onChange={(e) => setUsername(e.target.value)}
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