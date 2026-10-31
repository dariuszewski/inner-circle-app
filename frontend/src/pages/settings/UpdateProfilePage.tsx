import AttachFileIcon from '@mui/icons-material/AttachFile'
import BadgeIcon from '@mui/icons-material/Badge'
import CloseIcon from '@mui/icons-material/Close'
import { Box, TextField,Typography } from '@mui/material'
import { MuiFileInput } from 'mui-file-input'
import type { SubmitEventHandler } from 'react'
import { useState } from 'react'

import { updateUserRequest } from '../../api/user'
import AnimatedLogo from '../../components/AnimatedLogo'
import CustomSubmitButton from '../../components/CustomSubmitButton'
import SlidingSnackbar from '../../components/SlidingSnackbar'
import { useAuth } from '../../providers/useAuth'


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
      const updatedUser = await updateUserRequest(auth.accessToken, {
        username,
        profile_image: profileImage ?? undefined,
      })
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
        <AnimatedLogo />
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