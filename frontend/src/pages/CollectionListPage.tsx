import AddIcon from '@mui/icons-material/Add'
import {
  Box,
  Button,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  IconButton,
  Paper,
  TextField,
  Typography,
} from '@mui/material'
import { useState } from 'react'

import { useCollections } from '../hooks/useCollections'

export default function CollectionListPage() {
  const { data, isLoading, error } = useCollections()

  const [open, setOpen] = useState(false)
  const [collectionTitle, setCollectionTitle] = useState('')
  const [collectionDescription, setCollectionDescription] = useState('')

  const handleOpen = () => {
    setOpen(true)
  }

  const handleClose = () => {
    setOpen(false)
    setCollectionTitle('')
    setCollectionDescription('')
  }

  const handleSubmit = () => {
    console.log('Creating collection:', collectionTitle)
    console.log('Creating collection description:', collectionDescription)
    // TODO: call your API / mutation here

    handleClose()
  }

  if (isLoading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
        <CircularProgress />
      </Box>
    )
  }

  if (error) {
    return (
      <Typography color="error">
        Failed to load collections: {error}
      </Typography>
    )
  }

  return (
    <Box sx={{ textAlign: 'left' }}>
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          mb: 2,
        }}
      >
        <Typography variant="h5" component="h1">
          My Collections
        </Typography>

        <IconButton
          onClick={handleOpen}
          aria-label="add collection"
          sx={{
            backgroundColor: 'primary.main',
            color: 'white',
            borderRadius: '50%',
            width: 40,
            height: 40,
            '&:hover': {
              backgroundColor: 'primary.dark',
            },
          }}
        >
          <AddIcon />
        </IconButton>
      </Box>

      <Paper
        elevation={2}
        sx={{
          p: 2,
          borderRadius: 2,
          backgroundColor: '#FFFFFF',
          backgroundImage: 'none',
          overflow: 'auto',
        }}
      >
        <pre style={{ margin: 0 }}>
          {JSON.stringify(data, null, 2)}
        </pre>
      </Paper>

      <Dialog open={open} onClose={handleClose} fullWidth maxWidth="sm" >
        <DialogTitle>Create Collection</DialogTitle>

        <DialogContent>
          <TextField
            required
            fullWidth
            label="Title"
            value={collectionTitle}
            onChange={(e) => setCollectionTitle(e.target.value)}
            sx={{ mt: 1 }}
          />
          <TextField
            fullWidth
            label="Description"
            value={collectionDescription}
            onChange={(e) => setCollectionDescription(e.target.value)}
            sx={{ mt: 1 }}
          />
        </DialogContent>

        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={handleClose} color="inherit">
            Cancel
          </Button>

          <Button
            variant="contained"
            onClick={handleSubmit}
            disabled={!collectionTitle.trim()}
          >
            Create
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  )
}