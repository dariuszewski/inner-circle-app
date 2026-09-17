import { Box, CircularProgress, Paper, Typography } from '@mui/material'

import { useCollections } from '../hooks/useCollections'

export default function CollectionListPage() {
  const { data, isLoading, error } = useCollections()

  if (isLoading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
        <CircularProgress />
      </Box>
    )
  }

  if (error) {
    return <Typography color="error">Failed to load collections: {error}</Typography>
  }

  return (
    <Box sx={{ textAlign: 'left' }}>
      <Typography variant="h5" component="h1" sx={{ mb: 2 }}>
        My Collections
      </Typography>
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
        <pre style={{ margin: 0 }}>{JSON.stringify(data, null, 2)}</pre>
      </Paper>
    </Box>
  )
}
