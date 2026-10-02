import AddPhotoAlternateIcon from '@mui/icons-material/AddPhotoAlternate'
import ArrowBackIcon from '@mui/icons-material/ArrowBack'
import ChangeCircle from '@mui/icons-material/ChangeCircle'
import PersonAddAltIcon from '@mui/icons-material/PersonAddAlt'
import Box from '@mui/material/Box'
import Button from '@mui/material/Button'
import CircularProgress from '@mui/material/CircularProgress'
import Dialog from '@mui/material/Dialog'
import DialogActions from '@mui/material/DialogActions'
import DialogContent from '@mui/material/DialogContent'
import DialogContentText from '@mui/material/DialogContentText'
import DialogTitle from '@mui/material/DialogTitle'
import IconButton from '@mui/material/IconButton'
import Pagination from '@mui/material/Pagination'
import Typography from '@mui/material/Typography'
import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router'
import { useParams } from 'react-router'

import { deleteMedia, uploadMedia } from '../api/media'
import CollectionItem from '../components/CollectionItem'
import CustomIconButton from '../components/CustomIconButton'
import SlidingSnackbar from '../components/SlidingSnackbar'
import { useAuth } from '../providers/useAuth'
import type { CollectionDetailedRetrieve } from '../types/collectionResponse'

function CollectionPage() {
    const { collectionId } = useParams<{ collectionId: string }>()
    const auth = useAuth()
    const navigate = useNavigate()
    const [collection, setCollection] = useState<CollectionDetailedRetrieve | null>(null)
    const [loading, setLoading] = useState(true)
    const [uploading, setUploading] = useState(false)
    const [mediaPage, setMediaPage] = useState(1)
    const [mediaToDelete, setMediaToDelete] = useState<{ id: number } | null>(null)
    const [deletingMedia, setDeletingMedia] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const [version, setVersion] = useState(0)
    const [snackbar, setSnackbar] = useState<{
        message: string
        severity: 'success' | 'danger'
    } | null>(null)

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
    }, [collectionId, auth.accessToken, version])

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

    const handleMediaSelect = async (
        event: React.ChangeEvent<HTMLInputElement>,
    ) => {
        const files = Array.from(event.target.files ?? [])

        if (!files.length || !collectionId || !auth.accessToken) {
            return
        }

        try {
            setUploading(true)
            setSnackbar(null)

            const uploaded = await uploadMedia({
                collectionId,
                files,
                accessToken: auth.accessToken,
            })

            setSnackbar({
                message: `${uploaded.length} file${uploaded.length === 1 ? '' : 's'} uploaded successfully`,
                severity: 'success',
            })
            setVersion(version + 1)
        } catch (error) {
            setSnackbar({
                message:
                    error instanceof Error
                        ? error.message
                        : 'Failed to upload media',
                severity: 'danger',
            })
        } finally {
            setUploading(false)
            event.target.value = ''
        }

    }

    const handleMediaDelete = async () => {
        if (!mediaToDelete || !auth.accessToken) {
            return
        }

        try {
            setDeletingMedia(true)
            await deleteMedia({
                mediaId: mediaToDelete.id,
                accessToken: auth.accessToken,
            })
            setMediaToDelete(null)
            setSnackbar({
                message: 'Media deleted permanently.',
                severity: 'success',
            })
            if (visibleMedia.length === 1 && mediaPage > 1) {
                setMediaPage(mediaPage - 1)
            }
            setVersion((currentVersion) => currentVersion + 1)
        } catch (error) {
            setSnackbar({
                message: error instanceof Error ? error.message : 'Failed to delete media.',
                severity: 'danger',
            })
        } finally {
            setDeletingMedia(false)
        }
    }

    const media = collection?.media ?? []
    const mediaPageSize = 16
    const mediaPageCount = Math.ceil(media.length / mediaPageSize)
    const visibleMedia = media.slice(
        (mediaPage - 1) * mediaPageSize,
        mediaPage * mediaPageSize,
    )

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
                        component="label"
                        ariaLabel="add media"
                        isLoading={uploading}
                    >
                        <AddPhotoAlternateIcon />

                        {!uploading && (
                            <input
                                type="file"
                                multiple
                                hidden
                                onChange={handleMediaSelect}
                            />
                        )}
                    </CustomIconButton>

                    <CustomIconButton
                        onClick={() => console.log('Invite members')}
                        ariaLabel="invite members"
                    >
                        <PersonAddAltIcon />
                    </CustomIconButton>

                </Box>
            </Box>
            <Box
                sx={{
                    display: 'grid',
                    gridTemplateColumns: {
                        xs: 'repeat(2, minmax(0, 1fr))',
                        sm: 'repeat(3, minmax(0, 1fr))',
                        md: 'repeat(4, minmax(0, 1fr))',
                    },
                    gap: 1,
                    mt: 2,
                }}
            >
                {visibleMedia.map((media) => (
                    <CollectionItem
                        key={media.id}
                        src={media.media_url}
                        alt={`Collection media ${media.id}`}
                        mediaType={media.media_type}
                        fileName={media.file_path}
                        onDeleteClick={() => setMediaToDelete({ id: media.id })}
                    />
                ))}
            </Box>
            {mediaPageCount > 1 && (
                <Box sx={{ display: 'flex', justifyContent: 'center', mt: 2 }}>
                    <Pagination
                        count={mediaPageCount}
                        page={mediaPage}
                        onChange={(_, value) => setMediaPage(value)}
                        color="primary"
                    />
                </Box>
            )}

            <Dialog
                open={mediaToDelete !== null}
                onClose={() => !deletingMedia && setMediaToDelete(null)}
            >
                <DialogTitle>Delete this media?</DialogTitle>
                <DialogContent>
                    <DialogContentText>
                        This action is irreversible. The media will be permanently deleted.
                    </DialogContentText>
                </DialogContent>
                <DialogActions>
                    <Button
                        onClick={() => setMediaToDelete(null)}
                        disabled={deletingMedia}
                    >
                        Cancel
                    </Button>
                    <Button
                        onClick={handleMediaDelete}
                        color="error"
                        variant="contained"
                        disabled={deletingMedia}
                    >
                        {deletingMedia ? 'Deleting...' : 'Delete permanently'}
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

export default CollectionPage