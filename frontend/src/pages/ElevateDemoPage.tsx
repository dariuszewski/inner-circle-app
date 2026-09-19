import VerifiedUserIcon from '@mui/icons-material/VerifiedUser'
import { Box, Button,TextField, Typography } from '@mui/material'
import type { SubmitEventHandler } from 'react'
import { useState } from 'react'

import { useAuth } from '../providers/useAuth'


export default function ElevateDemoPage() {
  const auth = useAuth()
  const [email, setEmail] = useState(auth.user?.email || '')

  const handleSubmit: SubmitEventHandler<HTMLFormElement> = async (event) => {
    event.preventDefault()
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
        <Button type="submit" variant="contained" color="primary">
          Submit
        </Button>
      </Box>
    </>
  )
}