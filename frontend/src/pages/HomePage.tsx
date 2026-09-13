import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  Container,
  Paper,
  Typography,
} from '@mui/material'
import { useState } from 'react'
import { useLoaderData } from 'react-router'

import innerCircleLogo from '../assets/logo.svg'
import type { RootData } from '../types/rootResponse'


function HomePage() {
  const { records, error } = useLoaderData<RootData>()
  const [count, setCount] = useState<number>(0)

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

          {error && (
            <Alert severity="error" sx={{ textAlign: 'left' }}>
              Error: {error}
            </Alert>
          )}

          {records && (
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
              <pre style={{ margin: 0 }}>{JSON.stringify(records, null, 2)}</pre>
            </Paper>
          )}
        </Box>
      </Paper>
    </Container>
  )
}

export default HomePage;
