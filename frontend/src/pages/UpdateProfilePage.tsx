import AttachFileIcon from '@mui/icons-material/AttachFile'
import BadgeIcon from '@mui/icons-material/Badge'
import CloseIcon from '@mui/icons-material/Close'
import { Box, TextField,Typography } from '@mui/material'
import { MuiFileInput } from 'mui-file-input'
import type { SubmitEventHandler } from 'react'
import { useState } from 'react'

import CustomSubmitButton from '../components/CustomSubmitButton'
import SlidingSnackbar from '../components/SlidingSnackbar'
import { useAuth } from '../providers/useAuth'
import type { UserResponsePrivate } from '../types/userResponse'


export default function UpdateProfilePage() {
  const auth = useAuth()
  const [username, setUsername] = useState(auth.user?.username || '')
  const [profileImage, setProfileImage] = useState<File | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [snackbar, setSnackbar] = useState<{ message: string; severity: 'success' | 'danger' } | null>(null)

  const handleProfileImageChange = (newValue: File | null) => {
    setProfileImage(newValue)
  }

  const handleSubmit: SubmitEventHandler<HTMLFormElement> = async (event) => {
    event.preventDefault()
    setIsLoading(true)
    setSnackbar(null)
    try {
      if (!auth.accessToken) {
        throw new Error('You are not authenticated.')
      }
      const formData = new FormData()
      formData.append('username', username)
      if (profileImage) {
        formData.append('profile_image', profileImage)
      }

      const res = await fetch('/api/users/update', {
        method: 'PATCH',
        headers: {
          Authorization: `Bearer ${auth.accessToken}`,
        },
        body: formData,
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
          label="Username"
          name="username"
          variant="outlined"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
        />
        <MuiFileInput
          value={profileImage}
          onChange={handleProfileImageChange}
          slotProps={{
            htmlInput: {
              accept: 'image/*',
            },
            input: {
              startAdornment: <AttachFileIcon />,
            }
          }}
          clearIconButtonProps={{
            title: "Remove",
            children: <CloseIcon fontSize="small" />
          }}
          sx={{
            '& .MuiInputBase-root *': {
              color: '#fff !important',
              opacity: 0.9,
            },
          }}
          placeholder="Choose a profile picture"
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