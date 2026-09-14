import {
  Alert,
  Slide,
  type SlideProps,
  Snackbar,
} from '@mui/material'
import type { ReactNode } from 'react'

type SlidingSnackbarSeverity = 'success' | 'info' | 'danger'

type SlidingSnackbarProps = {
  open: boolean
  message: ReactNode
  severity: SlidingSnackbarSeverity
  onClose: () => void
}

function SlideTransition(props: SlideProps) {
  return <Slide {...props} direction="left" />
}

function SlidingSnackbar({ open, message, severity, onClose }: SlidingSnackbarProps) {
  return (
    <Snackbar
      open={open}
      autoHideDuration={5000}
      onClose={onClose}
      anchorOrigin={{ vertical: 'top', horizontal: 'right' }}
      slots={{ transition: SlideTransition }}
    >
      <Alert
        severity={severity === 'danger' ? 'error' : severity}
        variant="filled"
        onClose={onClose}
        onClick={onClose}
        sx={{ width: '100%', cursor: 'pointer' }}
      >
        {message}
      </Alert>
    </Snackbar>
  )
}

export default SlidingSnackbar
