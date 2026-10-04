import AddPhotoAlternateIcon from '@mui/icons-material/AddPhotoAlternate'
import ArrowBackIcon from '@mui/icons-material/ArrowBack'
import EditIcon from '@mui/icons-material/Edit'
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
import { useState } from 'react'
import { useNavigate } from 'react-router'
import { useParams } from 'react-router'

import { updateCollection } from '../api/collection'
import { deleteMedia, uploadMedia } from '../api/media'
import CollectionItem from '../components/CollectionItem'
import CustomIconButton from '../components/CustomIconButton'
import EditCollectionDialog from '../components/EditCollectionDialog'
import InviteDialog from '../components/InviteDialog'
import MediaGalleryViewer from '../components/MediaGalleryViewer'
import MembersSummary from '../components/MembersSummary'
import SlidingSnackbar from '../components/SlidingSnackbar'
import { useCollection } from '../hooks/useCollection'
import { useAuth } from '../providers/useAuth'

function CollectionPage() {
    const { collectionId } = useParams<{ collectionId: string }>()
    const auth = useAuth()
    const navigate = useNavigate()
    const {
        data: collection,
        isLoading: loading,
        error,
        refetch,
    } = useCollection(collectionId)
    const [uploading, setUploading] = useState(false)
    const [mediaPage, setMediaPage] = useState(1)
    const [activeMediaIndex, setActiveMediaIndex] = useState<number | null>(null)
    const [mediaToDelete, setMediaToDelete] = useState<{ id: number } | null>(null)
    const [deletingMedia, setDeletingMedia] = useState(false)
    const [inviteDialogOpen, setInviteDialogOpen] = useState(false)
    const [editDialogOpen, setEditDialogOpen] = useState(false)
    const [snackbar, setSnackbar] = useState<{
        message: string
        severity: 'success' | 'danger'
    } | null>(null)

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
            await refetch()
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
            setActiveMediaIndex(null)
            setMediaToDelete(null)
            setSnackbar({
                message: 'Media deleted permanently.',
                severity: 'success',
            })
            if (visibleMedia.length === 1 && mediaPage > 1) {
                setMediaPage(mediaPage - 1)
            }
            await refetch()
        } catch (error) {
            setSnackbar({
                message: error instanceof Error ? error.message : 'Failed to delete media.',
                severity: 'danger',
            })
        } finally {
            setDeletingMedia(false)
        }
    }

    const handleSetCover = async (item: { id: number }) => {
        if (!collectionId || !auth.accessToken) {
            return
        }

        try {
            await updateCollection({
                collectionId,
                coverImageId: item.id,
                accessToken: auth.accessToken,
            })
            setSnackbar({ message: 'Cover image updated.', severity: 'success' })
            await refetch()
        } catch (error) {
            setSnackbar({
                message: error instanceof Error ? error.message : 'Failed to set cover image.',
                severity: 'danger',
            })
        }
    }

    const media = collection?.media ?? []
    const isModerator = collection?.current_user_role === 'moderator'
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
                    mb: 0.5,
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
                    {isModerator && (
                        <CustomIconButton
                            onClick={() => setEditDialogOpen(true)}
                            ariaLabel="update"
                        >
                            <EditIcon />
                        </CustomIconButton>
                    )}

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
                        onClick={() => setInviteDialogOpen(true)}
                        ariaLabel="invite members"
                    >
                        <PersonAddAltIcon />
                    </CustomIconButton>

                </Box>
            </Box>

            {collection && (
                <MembersSummary
                    count={collection.members_count}
                    members={collection.members}
                    ownerId={collection.created_by_id}
                    itemsCount={collection.media.length}
                />
            )}
            <Box
                sx={{
                    display: 'grid',
                    gridTemplateColumns: {
                        xs: 'repeat(4, minmax(0, 1fr))',
                        sm: 'repeat(4, minmax(0, 1fr))',
                        md: 'repeat(4, minmax(0, 1fr))',
                    },
                    gap: 1,
                    mt: 2,
                }}
            >
                {visibleMedia.map((item) => (
                    <CollectionItem
                        key={item.id}
                        src={item.media_url}
                        alt={`Collection media ${item.id}`}
                        mediaType={item.media_type}
                        onClick={() => {
                            const index = media.findIndex(
                                (mediaItem) => mediaItem.id === item.id,
                            )
                            if (index !== -1) setActiveMediaIndex(index)
                        }}
                    />
                ))}
            </Box>
            <MediaGalleryViewer
                media={media}
                activeIndex={activeMediaIndex}
                onClose={() => setActiveMediaIndex(null)}
                onNavigate={setActiveMediaIndex}
                onDelete={(item) => setMediaToDelete({ id: item.id })}
                onSetCover={handleSetCover}
                coverImageId={collection?.cover_image?.id ?? null}
                isModerator={isModerator}
            />
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

            {editDialogOpen && collection && (
                <EditCollectionDialog
                    open={editDialogOpen}
                    collectionId={collection.id}
                    initialName={collection.name}
                    initialDescription={collection.description}
                    onClose={() => setEditDialogOpen(false)}
                    onSaved={refetch}
                />
            )}

            {inviteDialogOpen && collection && (
                <InviteDialog
                    open={inviteDialogOpen}
                    collectionId={collection.id}
                    onClose={() => setInviteDialogOpen(false)}
                />
            )}

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