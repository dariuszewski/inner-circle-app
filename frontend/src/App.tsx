import { useState, useEffect } from 'react'
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  CircularProgress,
  Container,
  Paper,
  Typography,
} from '@mui/material'
import innerCircleLogo from './assets/logo.svg'

interface ApiResponse {
  message: string
}

function App() {
  const [count, setCount] = useState<number>(0)
  const [loading, setLoading] = useState<boolean>(true)
  const [data, setData] = useState<ApiResponse | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetch('/api/')
      .then((response): Promise<ApiResponse> => {
        if (!response.ok) {
          throw new Error(`HTTP error! Status: ${response.status}`)
        }
        return response.json()
      })
      .then((responseData: ApiResponse) => {
        console.log(responseData)
        setData(responseData)
        setLoading(false)
      })
      .catch((err: unknown) => {
        const errorMessage = err instanceof Error ? err.message : 'An unknown error occurred'
        console.error('Error fetching data:', err)
        setError(errorMessage)
        setLoading(false)
      })
  }, [])

  return (
    <Container maxWidth="sm" sx={{ py: 6 }}>
      <Paper elevation={3} sx={{ p: 4, textAlign: 'center', borderRadius: 2 }}>
        <Box sx={{ mb: 3 }}>
          <img width="160" src={innerCircleLogo} alt="Inner Circle Logo" />
        </Box>

        <Typography variant="h4" component="h1">
          Hello, Inner Circle!
        </Typography>

        <Card variant="outlined" sx={{ my: 3, p: 2 }}>
          <CardContent>
            <Typography variant="h6" color="text.secondary" gutterBottom>
              Counter
            </Typography>
            <Typography variant="h3" color="primary" sx={{ my: 1, fontWeight: 'medium' }}>
              {count}
            </Typography>
            <Button
              variant="contained"
              color="primary"
              onClick={() => setCount(prev => prev + 1)}
              sx={{ mt: 1 }}
            >
              Increment
            </Button>
          </CardContent>
        </Card>

        <Box sx={{ mt: 3 }}>
          <Typography variant="h6" align="left" gutterBottom>
            API Status
          </Typography>

          {loading && (
            <Box sx={{ display: 'flex', justifyContent: 'center', py: 2 }}>
              <CircularProgress />
            </Box>
          )}

          {error && (
            <Alert severity="error" sx={{ textAlign: 'left' }}>
              Error: {error}
            </Alert>
          )}

          {data && (
            <Paper
              variant="outlined"
              sx={{
                p: 2,
                backgroundColor: 'grey.100',
                textAlign: 'left',
                overflowX: 'auto',
                fontFamily: 'monospace',
              }}
            >
              <pre style={{ margin: 0 }}>{JSON.stringify(data, null, 2)}</pre>
            </Paper>
          )}
        </Box>
      </Paper>
    </Container>
  )
}

export default App
