import AccountCircleIcon from '@mui/icons-material/AccountCircle'
import AlternateEmailIcon from '@mui/icons-material/AlternateEmail'
import BadgeIcon from '@mui/icons-material/Badge'
import ChevronRightIcon from '@mui/icons-material/ChevronRight'
import CloseIcon from '@mui/icons-material/Close'
import PasswordIcon from '@mui/icons-material/Password'
import VerifiedUserIcon from '@mui/icons-material/VerifiedUser'
import {
  Avatar,
  Box,
  Button,
  Chip,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  Divider,
  IconButton,
  Link,
  List,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Paper,
  Typography,
} from '@mui/material'
import { useState } from 'react'
import { Link as RouterLink, useNavigate } from 'react-router'

import { requestAccountDeletion } from '../api/user'
import SlidingSnackbar from '../components/SlidingSnackbar'
import { useAuth } from '../providers/useAuth'

type SnackbarState = {
  message: string
  severity: 'success' | 'danger'
}

type DeletionResult = {
  detail: string
  verifyUrl: string | null
}

export default function SettingsPage() {
  const auth = useAuth()
  console.log(auth.user)
  const navigate = useNavigate()
  const [snackbar, setSnackbar] = useState<SnackbarState | null>(null)
  const [confirmOpen, setConfirmOpen] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const [deletionResult, setDeletionResult] = useState<DeletionResult | null>(null)
  const isDemoUser = auth.user?.user_role === 'demo'

  const handleDeleteAccount = async () => {
    if (!auth.accessToken) return

    setIsDeleting(true)
    try {
      const response = await requestAccountDeletion(auth.accessToken)
      // the backend link points at the API; route it through the frontend verify page instead
      const token = response.verification_link?.split('/verify/').pop()
      setConfirmOpen(false)
      setDeletionResult({
        detail: response.detail,
        verifyUrl: token ? `/verify?token=${encodeURIComponent(token)}` : null,
      })
    } catch (error) {
      setConfirmOpen(false)
      setSnackbar({
        message: error instanceof Error ? error.message : 'Failed to request account deletion.',
        severity: 'danger',
      })
    } finally {
      setIsDeleting(false)
    }
  }

  return (
    <Box sx={{ textAlign: 'left' }}>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
        <IconButton edge="start" aria-label="close settings" onClick={() => navigate('/collections')}>
          <CloseIcon />
        </IconButton>
        <Typography variant="h5" component="h1">
          Settings
        </Typography>
      </Box>
      <Paper
        elevation={2}
        sx={{ p: 1, borderRadius: 2, backgroundImage: 'none', backgroundColor: '#24242659', mb: 2 }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mx: 1 }}>
        <Avatar
          src={auth.user?.profile_image_url ?? undefined}
          sx={{ width: 56, height: 56 }}
        >
          <AccountCircleIcon />
        </Avatar>
          <Box sx={{ minWidth: 0, flex: 1 }}>
            <Typography variant="subtitle1" component="div">
              {auth.user?.username}
            </Typography>
            <Typography variant="body2" color="text.secondary" component="div" sx={{ wordBreak: 'break-word' }}>
              {auth.user?.email}
            </Typography>
          </Box>
          <Chip
            label={auth.user?.user_role.toUpperCase()}
            color="primary"
            size="small"
            sx={{ fontWeight: 700, letterSpacing: 1 }}
          />
        </Box>
        <Divider sx={{ my: 1 }} />
        {/* TODO: wire each option up to its form/dialog */}
        <List disablePadding>
          <ListItemButton onClick={() => navigate('/settings/update-profile')}>
            <ListItemIcon>
              <BadgeIcon fontSize="small" />
            </ListItemIcon>
            <ListItemText>Update Profile</ListItemText>
            <ChevronRightIcon fontSize="small" color="action" />
          </ListItemButton>
          <ListItemButton onClick={() => navigate('/settings/change-email')}>
            <ListItemIcon>
              <AlternateEmailIcon fontSize="small" />
            </ListItemIcon>
            <ListItemText>Change email</ListItemText>
            <ChevronRightIcon fontSize="small" color="action" />
          </ListItemButton>
          <ListItemButton onClick={() => navigate('/settings/reset-password')}>
            <ListItemIcon>
              <PasswordIcon fontSize="small" />
            </ListItemIcon>
            <ListItemText>Reset password</ListItemText>
            <ChevronRightIcon fontSize="small" color="action" />
          </ListItemButton>
          {isDemoUser && (
            // TODO: wire up to PATCH /api/users/elevate-demo
            <ListItemButton onClick={() => navigate('/settings/verify-account')}>
              <ListItemIcon>
                <VerifiedUserIcon fontSize="small" />
              </ListItemIcon>
              <ListItemText>Verify account</ListItemText>
              <ChevronRightIcon fontSize="small" color="action" />
            </ListItemButton>
          )}
        </List>
      </Paper>

      <Paper
        elevation={2}
        sx={{
          p: 2,
          borderRadius: 2,
          backgroundImage: 'none',
          border: 1,
          borderColor: 'error.main',
        }}
      >
        <Typography variant="h6" component="h2" color="error" sx={{ mb: 1 }}>
          Danger Zone
        </Typography>
        <Typography variant="body2" sx={{ mb: 2 }}>
          Deleting your account is permanent. A verification link will be sent to your email to
          confirm the deletion.
        </Typography>
        <Button variant="outlined" color="error" onClick={() => setConfirmOpen(true)}>
          Delete Account
        </Button>
      </Paper>

      <Dialog open={confirmOpen} onClose={() => !isDeleting && setConfirmOpen(false)}>
        <DialogTitle>Delete your account?</DialogTitle>
        <DialogContent>
          <DialogContentText>
            This action cannot be undone. A verification link will be sent to your email address to
            confirm the deletion.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setConfirmOpen(false)} disabled={isDeleting}>
            Cancel
          </Button>
          <Button onClick={handleDeleteAccount} color="error" variant="contained" disabled={isDeleting}>
            {isDeleting ? 'Requesting…' : 'Delete Account'}
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog open={deletionResult !== null} onClose={() => setDeletionResult(null)}>
        <DialogTitle>Confirm account deletion</DialogTitle>
        <DialogContent>
          <DialogContentText>{deletionResult?.detail}</DialogContentText>
          {deletionResult?.verifyUrl && (
            <DialogContentText sx={{ mt: 2 }}>
              Email sending is not wired up yet, so for now:{' '}
              <Link component={RouterLink} to={deletionResult.verifyUrl}>
                Confirm account deletion here
              </Link>
            </DialogContentText>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeletionResult(null)}>Close</Button>
        </DialogActions>
      </Dialog>

      <SlidingSnackbar
        open={snackbar !== null}
        message={snackbar?.message}
        severity={snackbar?.severity ?? 'info'}
        onClose={() => setSnackbar(null)}
      />
    </Box>
  )
}
