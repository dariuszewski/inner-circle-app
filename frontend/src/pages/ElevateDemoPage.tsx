import VerifiedUserIcon from '@mui/icons-material/VerifiedUser'
import { Box, TextField, Typography } from '@mui/material'
import type { SubmitEventHandler } from 'react'
import { useState } from 'react'

import type { VerificationRequestResponse } from '../api/user'
import CustomSubmitButton from '../components/CustomSubmitButton'
import SlidingSnackbar from '../components/SlidingSnackbar'
import { useAuth } from '../providers/useAuth'


export default function ElevateDemoPage() {
  const auth = useAuth()
  const [email, setEmail] = useState(auth.user?.email || '')
  const [isLoading, setIsLoading] = useState(false)
  const [confirmationMessage, setConfirmationMessage] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  const handleSubmit: SubmitEventHandler<HTMLFormElement> = async (event) => {
    event.preventDefault()
    if (!auth.accessToken) {
      setError('You are not authenticated.')
      return
    }

    setIsLoading(true)
    setError(null)
    setConfirmationMessage(null)
    try {
      const response = await fetch('/api/users/elevate-demo', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${auth.accessToken}`,
        },
        body: JSON.stringify({ email }),
      })
      const body = await response.json() as VerificationRequestResponse
      if (!response.ok) {
        throw new Error(body.detail || 'Could not upgrade the demo account.')
      }
      setConfirmationMessage(body.detail)
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : 'Could not upgrade the demo account.')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <>
        <Typography variant="h4" component="h1">
            <VerifiedUserIcon fontSize="medium" /> Verify Account
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
          variant="outlined"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
          <CustomSubmitButton isLoading={isLoading}>Send verification email</CustomSubmitButton>
      </Box>
      {confirmationMessage && (
        <Typography variant="body1" sx={{ maxWidth: 400, mx: 'auto', mt: 3 }}>
          {confirmationMessage} Follow the link sent to this address to complete the upgrade.
        </Typography>
      )}
      <SlidingSnackbar
        open={error !== null}
        message={error}
        severity="danger"
        onClose={() => setError(null)}
      />
    </>
  )
}