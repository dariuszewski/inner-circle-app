import { Box, Button, TextField, Typography } from '@mui/material'
import type { SubmitEventHandler } from 'react'

import AnimatedLogo from '../components/AnimatedLogo'

export default function LoginPage() {
  const handleSubmit: SubmitEventHandler<HTMLFormElement> = (event) => {
    event.preventDefault()
    console.log('Form submitted')
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
    </>
  )
}