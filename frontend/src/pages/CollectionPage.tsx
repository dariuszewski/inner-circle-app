import AddPhotoAlternateIcon from '@mui/icons-material/AddPhotoAlternate'
import ArrowBackIcon from '@mui/icons-material/ArrowBack'
import ChangeCircle from '@mui/icons-material/ChangeCircle'
import PersonAddAltIcon from '@mui/icons-material/PersonAddAlt'
import Box from '@mui/material/Box'
import CircularProgress from '@mui/material/CircularProgress'
import IconButton from '@mui/material/IconButton'
import Paper from '@mui/material/Paper'
import Typography from '@mui/material/Typography'
import { useEffect, useState } from 'react'
import { useParams } from 'react-router'
import { useNavigate } from 'react-router'

import CustomIconButton from '../components/CustomIconButton'
import { useAuth } from '../providers/useAuth'
import type { CollectionDetailedRetrieve } from '../types/collectionResponse'

function CollectionPage() {
    const { collectionId } = useParams<{ collectionId: string }>()
    const auth = useAuth()
    const navigate = useNavigate()
    const [collection, setCollection] = useState<CollectionDetailedRetrieve | null>(null)
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)

    useEffect(() => {
        if (!collectionId || !auth.accessToken) {
            return
        }

        const controller = new AbortController()

        async function fetchCollection() {
            try {
                setLoading(true)
                setError(null)

                const response = await fetch(
                    `/api/collections/${collectionId}`,
                    {
                        headers: {
                            Authorization: `Bearer ${auth.accessToken}`,
                        },
                        signal: controller.signal,
                    },
                )

                if (!response.ok) {
                    throw new Error(`HTTP error! Status: ${response.status}`)
                }

                const data = await response.json()

                console.log(data)

                setCollection(data)
            } catch (error) {
                if (error instanceof DOMException && error.name === 'AbortError') {
                    return
                }

                setError(
                    error instanceof Error
                        ? error.message
                        : 'An unknown error occurred',
                )
            } finally {
                setLoading(false)
            }
        }

        fetchCollection()

        return () => {
            controller.abort()
        }
    }, [collectionId, auth.accessToken])

    if (loading) {
        return (
            <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
                <CircularProgress />
            </Box>
        )
    }

    if (error) {
        return (
            <Typography color="error">
                Failed to load collection: {error}
            </Typography>
        )
    }

    return (
        <Box>
            <Box
                sx={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    mb: 2,
                }}
            >
                <Box
                    sx={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 1,
                    }}
                >
                    <IconButton
                        onClick={() => navigate(-1)}
                        aria-label="go back"
                    >
                        <ArrowBackIcon />
                    </IconButton>

                    <Typography variant="h5" component="h1">
                        {collection?.name}
                    </Typography>
                </Box>

                <Box
                    sx={{
                        display: 'flex',
                        gap: 1,
                    }}
                >
                    <CustomIconButton
                        onClick={() => console.log('Update')}
                        ariaLabel="update"
                    >
                        <ChangeCircle />
                    </CustomIconButton>

                    <CustomIconButton
                        onClick={() => console.log('Add media')}
                        ariaLabel="add media"
                    >
                        <AddPhotoAlternateIcon />
                    </CustomIconButton>

                    <CustomIconButton
                        onClick={() => console.log('Invite members')}
                        ariaLabel="invite members"
                    >
                        <PersonAddAltIcon />
                    </CustomIconButton>

                </Box>
            </Box>
            <Paper
                elevation={2}
                sx={{
                    p: 2,
                    borderRadius: 2,
                    backgroundColor: '#fff',
                    color: '#000',
                    overflow: 'auto',
                    textAlign: 'left',
                }}
            >
                <Box
                    component="pre"
                    sx={{
                        m: 0,
                        whiteSpace: 'pre-wrap',
                        wordBreak: 'break-word',
                        color: 'inherit',
                    }}
                >
                    {JSON.stringify(collection, null, 2)}
                </Box>
            </Paper>
        </Box>
    )
}

export default CollectionPage