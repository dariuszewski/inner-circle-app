import AddIcon from '@mui/icons-material/Add'
import {
  Box,
  Button,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Pagination,
  TextField,
  Typography,
} from '@mui/material'
import { useState } from 'react'

import { createCollection } from '../api/collection'
import CollectionListItemCard from '../components/CollectionListItemCard'
import CustomIconButton from '../components/CustomIconButton'
import SlidingSnackbar from '../components/SlidingSnackbar'
import { useCollections } from '../hooks/useCollections'
import { useAuth } from '../providers/useAuth'


export default function CollectionListPage() {
  const auth = useAuth()
  const [page, setPage] = useState(1)
  const { data, isLoading, error, refetch } = useCollections(page)
  const [loading, setLoading] = useState(false)
  const [open, setOpen] = useState(false)
  const [snackbar, setSnackbar] = useState<{ message: string; severity: 'success' | 'danger' } | null>(null)
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

  const handleSubmit = async () => {
    try {
      setSnackbar(null)
      setLoading(true)
      await createCollection({
        name: collectionTitle,
        description: collectionDescription,
        accessToken: auth.accessToken,
      })
      await refetch()
    } catch (error) {
      setSnackbar({
        message: error instanceof Error ? error.message : 'An unknown error occurred',
        severity: 'danger',
      })
    } finally {
      setLoading(false)
      handleClose()
    }
  }

  if (isLoading || loading) {
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
          My Collections ({data?.total_items ?? 0})
        </Typography>

        <CustomIconButton
          onClick={handleOpen}
          ariaLabel="add collection"
        >
          <AddIcon />
        </CustomIconButton>
      </Box>

      {data?.total_items === 0 ? (
        <Box
          sx={{
            mt: 3,
            mb: 3,
            p: 4,
            border: '1px solid',
            borderColor: 'divider',
            borderRadius: 2,
            textAlign: 'center',
            bgcolor: 'background.paper',
          }}
        >
          <Typography variant="h6" sx={{ mb: 1, color: 'primary.main' }}>
            No collections yet
          </Typography>

          <Typography variant="body2">
            Press the “+” button to create your first collection.
          </Typography>
        </Box>
      ) : (
        <>
          {data?.items?.map((collection) => (
            <CollectionListItemCard
              key={collection.id}
              id={collection.id}
              title={collection.name}
              body={collection.description}
              imageSrc={collection.cover_image?.media_url}
            />
          ))}
        </>
      )}
      {data?.total_pages && data.total_pages > 1 && (
        <Box sx={{ display: 'flex', justifyContent: 'center', mt: 2 }}>
          <Pagination
            count={data.total_pages}
            page={page}
            onChange={(_, value) => setPage(value)}
            color="primary"
          />
        </Box>
      )}


      <Dialog
        open={open}
        onClose={handleClose}
        fullWidth
      >
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

      <SlidingSnackbar
        open={snackbar !== null}
        message={snackbar?.message}
        severity={snackbar?.severity ?? 'info'}
        onClose={() => setSnackbar(null)}
      />
    </Box>

  )
}