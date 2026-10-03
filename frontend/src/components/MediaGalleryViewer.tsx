import ChatBubbleIcon from '@mui/icons-material/ChatBubble'
import CloseIcon from '@mui/icons-material/Close'
import DeleteIcon from '@mui/icons-material/Delete'
import DeleteOutlinedIcon from '@mui/icons-material/DeleteOutlined'
import FavoriteIcon from '@mui/icons-material/Favorite'
import FavoriteBorderIcon from '@mui/icons-material/FavoriteBorder'
import NavigateBeforeIcon from '@mui/icons-material/NavigateBefore'
import NavigateNextIcon from '@mui/icons-material/NavigateNext'
import SendIcon from '@mui/icons-material/Send'
import VideoFileIcon from '@mui/icons-material/VideoFile'
import Avatar from '@mui/material/Avatar'
import Badge from '@mui/material/Badge'
import Box from '@mui/material/Box'
import Button from '@mui/material/Button'
import CircularProgress from '@mui/material/CircularProgress'
import Dialog from '@mui/material/Dialog'
import DialogActions from '@mui/material/DialogActions'
import DialogContent from '@mui/material/DialogContent'
import DialogContentText from '@mui/material/DialogContentText'
import DialogTitle from '@mui/material/DialogTitle'
import Divider from '@mui/material/Divider'
import IconButton from '@mui/material/IconButton'
import Menu from '@mui/material/Menu'
import MenuItem from '@mui/material/MenuItem'
import TextField from '@mui/material/TextField'
import Typography from '@mui/material/Typography'
import { type SubmitEventHandler, useEffect, useRef, useState } from 'react'

import {
	createMediaComment,
	createMediaReaction,
	deleteMediaComment,
	deleteMediaReaction,
	getMediaDetails,
} from '../api/media'
import { useProtectedMedia } from '../hooks/useProtectedMedia'
import { useAuth } from '../providers/useAuth'
import type {
	CommentRetrieve,
	MediaRetrieve,
	MediaRetrieveDetailed,
	ReactionType,
} from '../types/collectionResponse'

const videoMimeTypes: Record<string, string> = {
	avi: 'video/x-msvideo',
	m4v: 'video/mp4',
	mov: 'video/quicktime',
	mp4: 'video/mp4',
	ogg: 'video/ogg',
	ogv: 'video/ogg',
	webm: 'video/webm',
}

function getVideoMimeType(fileName: string) {
	const extension = fileName.split('.').pop()?.toLowerCase()
	return extension ? videoMimeTypes[extension] : undefined
}

type GalleryMediaProps = {
	media: MediaRetrieve
}

function GalleryMedia({ media }: GalleryMediaProps) {
	const auth = useAuth()
	const isVideo = media.media_type === 'video'
	const imageUrl = useProtectedMedia(isVideo ? undefined : media.media_url)
	const [videoUrl, setVideoUrl] = useState<string | null>(null)
	const [videoLoading, setVideoLoading] = useState(true)
	const [videoError, setVideoError] = useState(false)

	useEffect(() => {
		if (!isVideo) return

		if (!auth.accessToken) return

		const controller = new AbortController()
		let objectUrl: string | null = null
		queueMicrotask(() => {
			if (controller.signal.aborted) return
			setVideoUrl(null)
			setVideoLoading(true)
			setVideoError(false)
		})

		async function loadVideo() {
			try {
				const response = await fetch(media.media_url, {
					headers: {
						Authorization: `Bearer ${auth.accessToken}`,
					},
					signal: controller.signal,
				})

				if (!response.ok) {
					throw new Error(`Failed to load video: ${response.status}`)
				}

				const blob = await response.blob()
				const responseMimeType = response.headers
					.get('content-type')
					?.split(';')[0]
				const mimeType = responseMimeType?.startsWith('video/')
					? responseMimeType
					: getVideoMimeType(media.file_path)
				const videoBlob = mimeType
					? new Blob([blob], { type: mimeType })
					: blob

				objectUrl = URL.createObjectURL(videoBlob)
				setVideoUrl(objectUrl)
			} catch (error) {
				if (error instanceof DOMException && error.name === 'AbortError') {
					return
				}
				if (!controller.signal.aborted) {
					setVideoError(true)
					setVideoLoading(false)
				}
			}
		}

		loadVideo()

		return () => {
			controller.abort()
			if (objectUrl) URL.revokeObjectURL(objectUrl)
		}
	}, [auth.accessToken, isVideo, media.file_path, media.media_url])

	if (isVideo) {
		if (videoUrl) {
			return (
				<Box
					component="video"
					src={videoUrl}
					controls
					autoPlay
					playsInline
					aria-label={`Video ${media.id}`}
					sx={{
						maxWidth: '100%',
						maxHeight: '100%',
						minWidth: 0,
						minHeight: 0,
						borderRadius: { xs: 1, sm: 2 },
						boxShadow: '0 32px 100px rgba(0, 0, 0, 0.65)',
					}}
				/>
			)
		}

		return (
			<Box sx={{ color: 'common.white', textAlign: 'center' }}>
				{videoError || !auth.accessToken ? (
					<Typography role="alert">Unable to load this video.</Typography>
				) : videoLoading ? (
					<CircularProgress color="inherit" />
				) : null}
			</Box>
		)
	}

	return imageUrl ? (
		<Box
			component="img"
			src={imageUrl}
			alt={`Collection media ${media.id}`}
			draggable={false}
			sx={{
				maxWidth: '100%',
				maxHeight: '100%',
				minWidth: 0,
				minHeight: 0,
				objectFit: 'contain',
				borderRadius: { xs: 1, sm: 2 },
				boxShadow: '0 32px 100px rgba(0, 0, 0, 0.65)',
			}}
		/>
	) : (
		<CircularProgress color="inherit" />
	)
}

type UploaderDetailsProps = {
	media: MediaRetrieve
}

function UploaderDetails({ media }: UploaderDetailsProps) {
	const profileImageUrl = useProtectedMedia(media.uploaded_by?.profile_image_url)
	const uploadedAt = new Intl.DateTimeFormat(undefined, {
		dateStyle: 'medium',
		timeStyle: 'short',
	}).format(new Date(media.uploaded_at))

	return (
		<Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, maxWidth: '100%' }}>
			{media.uploaded_by && (
				<Avatar
					src={profileImageUrl ?? undefined}
					alt={media.uploaded_by.username}
					sx={{ width: 40, height: 40, flexShrink: 0 }}
				>
					{media.uploaded_by.username.slice(0, 1).toUpperCase()}
				</Avatar>
			)}
			<Box sx={{ minWidth: 0 }}>
				{media.uploaded_by && (
					<Typography variant="body2" noWrap>
						{media.uploaded_by.username}
					</Typography>
				)}
				<Typography variant="caption" color="grey.400" noWrap>
					Uploaded {uploadedAt}
				</Typography>
			</Box>
		</Box>
	)
}

type MediaCommentItemProps = {
	comment: CommentRetrieve
	canDelete: boolean
	deleteDisabled: boolean
	onDelete: (commentId: number) => void
}

function MediaCommentItem({
	comment,
	canDelete,
	deleteDisabled,
	onDelete,
}: MediaCommentItemProps) {
	const profileImageUrl = useProtectedMedia(comment.author?.profile_image_url)
	const createdAt = new Intl.DateTimeFormat(undefined, {
		dateStyle: 'medium',
		timeStyle: 'short',
	}).format(new Date(comment.created_at))

	return (
		<Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 1 }}>
			<Avatar
				src={profileImageUrl ?? undefined}
				alt={comment.author?.username ?? 'Former member'}
				sx={{ width: 32, height: 32, flexShrink: 0 }}
			>
				{comment.author?.username.slice(0, 1).toUpperCase() ?? '?'}
			</Avatar>
			<Box sx={{ flex: 1, minWidth: 0 }}>
				<Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75, width: '100%', minWidth: 0 }}>
					<Typography
						variant="caption"
						sx={{ fontWeight: 700, color: 'common.white', minWidth: 0 }}
						noWrap
					>
						{comment.author?.username ?? 'Former member'}
					</Typography>
					<Typography variant="caption" color="grey.500" aria-hidden="true">
						·
					</Typography>
					<Typography variant="caption" color="grey.400" noWrap>
						{createdAt}
					</Typography>
					{canDelete && (
						<IconButton
							aria-label="Delete your comment"
							disabled={deleteDisabled}
							onClick={() => onDelete(comment.id)}
							size="small"
							sx={{
								ml: 'auto',
								width: 28,
								height: 28,
								flexShrink: 0,
								color: 'error.light',
								'&:hover': { color: 'error.main', backgroundColor: 'grey.800' },
							}}
						>
							<DeleteOutlinedIcon fontSize="small" />
						</IconButton>
					)}
				</Box>
				<Typography
					variant="body2"
					color="grey.200"
					sx={{
						mt: 0.5,
						p: 1,
						borderRadius: 1,
						backgroundColor: 'grey.800',
						whiteSpace: 'pre-wrap',
						overflowWrap: 'anywhere',
					}}
				>
					{comment.content}
				</Typography>
			</Box>
		</Box>
	)
}

type MediaGalleryViewerProps = {
	media: MediaRetrieve[]
	activeIndex: number | null
	onClose: () => void
	onNavigate: (index: number) => void
	onDelete: (media: MediaRetrieve) => void
	isModerator: boolean
}

const reactionOptions: {
	type: ReactionType
	label: string
	emoji: string
}[] = [
	{ type: 'like', label: 'Like', emoji: '👍' },
	{ type: 'love', label: 'Love', emoji: '❤️' },
	{ type: 'haha', label: 'Haha', emoji: '😂' },
	{ type: 'wow', label: 'Wow', emoji: '😮' },
	{ type: 'sad', label: 'Sad', emoji: '😢' },
	{ type: 'angry', label: 'Angry', emoji: '😡' },
]

export default function MediaGalleryViewer({
	media,
	activeIndex,
	onClose,
	onNavigate,
	onDelete,
	isModerator,
}: MediaGalleryViewerProps) {
	const touchStart = useRef<{ x: number; y: number } | null>(null)
	const auth = useAuth()
	const isOpen = activeIndex !== null && activeIndex >= 0 && activeIndex < media.length
	const selectedMedia = isOpen && activeIndex !== null ? media[activeIndex] : null
	const commentPreviewUrl = useProtectedMedia(
		selectedMedia?.media_type === 'image' ? selectedMedia.media_url : undefined,
	)
	const [details, setDetails] = useState<MediaRetrieveDetailed | null>(null)
	const [detailsLoading, setDetailsLoading] = useState(false)
	const [detailsError, setDetailsError] = useState<string | null>(null)
	const [detailsVersion, setDetailsVersion] = useState(0)
	const [commentsOpen, setCommentsOpen] = useState(false)
	const [commentToDelete, setCommentToDelete] = useState<number | null>(null)
	const [commentText, setCommentText] = useState('')
	const [actionLoading, setActionLoading] = useState(false)
	const [actionError, setActionError] = useState<string | null>(null)
	const [reactionMenuAnchor, setReactionMenuAnchor] = useState<HTMLElement | null>(null)
	const canDelete =
		selectedMedia !== null &&
		(isModerator || selectedMedia.uploaded_by?.id === auth.user?.id)
	const currentDetails =
		isOpen && details?.id === selectedMedia?.id ? details : null
	const currentReaction = currentDetails?.reactions.find(
		(reaction) => reaction.user.id === auth.user?.id,
	)

	useEffect(() => {
		if (!isOpen || !selectedMedia || !auth.accessToken) return

		const controller = new AbortController()
		queueMicrotask(() => {
			if (controller.signal.aborted) return
			setDetails(null)
			setDetailsLoading(true)
			setDetailsError(null)
		})

		getMediaDetails({
			mediaId: selectedMedia.id,
			accessToken: auth.accessToken,
			signal: controller.signal,
		})
			.then((mediaDetails) => {
				if (!controller.signal.aborted) setDetails(mediaDetails)
			})
			.catch((error) => {
				if (!controller.signal.aborted) {
					setDetailsError(
						error instanceof Error ? error.message : 'Failed to load media details',
					)
				}
			})
			.finally(() => {
				if (!controller.signal.aborted) setDetailsLoading(false)
			})

		return () => controller.abort()
	// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [auth.accessToken, detailsVersion, isOpen, selectedMedia?.id])

	async function handleReactionSelection(type: ReactionType) {
		if (!selectedMedia || !auth.accessToken || actionLoading) return

		setActionLoading(true)
		setActionError(null)
		setReactionMenuAnchor(null)
		try {
			if (currentReaction) {
				await deleteMediaReaction({
					mediaId: selectedMedia.id,
					accessToken: auth.accessToken,
				})
				if (currentReaction.type !== type) {
					await createMediaReaction({
						mediaId: selectedMedia.id,
						type,
						accessToken: auth.accessToken,
					})
				}
			} else {
				await createMediaReaction({
					mediaId: selectedMedia.id,
					type,
					accessToken: auth.accessToken,
				})
			}
			setDetailsVersion((version) => version + 1)
		} catch (error) {
			setActionError(error instanceof Error ? error.message : 'Failed to save reaction')
		} finally {
			setActionLoading(false)
		}
	}

	const handleCommentSubmit: SubmitEventHandler<HTMLFormElement> = async (event) => {
		event.preventDefault()
		const content = commentText.trim()
		if (!selectedMedia || !auth.accessToken || !content || actionLoading) return

		setActionLoading(true)
		setActionError(null)
		try {
			await createMediaComment({
				mediaId: selectedMedia.id,
				content,
				accessToken: auth.accessToken,
			})
			setCommentText('')
			setDetailsVersion((version) => version + 1)
		} catch (error) {
			setActionError(error instanceof Error ? error.message : 'Failed to post comment')
		} finally {
			setActionLoading(false)
		}
	}

	async function handleCommentDelete(commentId: number) {
		if (!auth.accessToken || actionLoading) return

		setActionLoading(true)
		setActionError(null)
		try {
			await deleteMediaComment({ commentId, accessToken: auth.accessToken })
			setCommentToDelete(null)
			setDetailsVersion((version) => version + 1)
		} catch (error) {
			setActionError(error instanceof Error ? error.message : 'Failed to delete comment')
		} finally {
			setActionLoading(false)
		}
	}

	useEffect(() => {
		if (!isOpen || activeIndex === null) return
		const currentIndex = activeIndex

		function handleKeyDown(event: KeyboardEvent) {
			const target = event.target
			if (
				target instanceof HTMLElement &&
				(target.isContentEditable || target.closest('input, textarea'))
			) {
				return
			}

			if (event.key === 'ArrowLeft' && currentIndex > 0) {
				event.preventDefault()
				onNavigate(currentIndex - 1)
			} else if (event.key === 'ArrowRight' && currentIndex < media.length - 1) {
				event.preventDefault()
				onNavigate(currentIndex + 1)
			}
		}

		window.addEventListener('keydown', handleKeyDown)
		return () => window.removeEventListener('keydown', handleKeyDown)
	}, [activeIndex, isOpen, media.length, onNavigate])

	function handleTouchEnd(event: React.TouchEvent<HTMLDivElement>) {
		const start = touchStart.current
		touchStart.current = null
		if (!start || activeIndex === null) return

		const touch = event.changedTouches[0]
		const deltaX = touch.clientX - start.x
		const deltaY = touch.clientY - start.y
		if (Math.abs(deltaX) < 48 || Math.abs(deltaX) < Math.abs(deltaY) * 1.2) return

		if (deltaX < 0 && activeIndex < media.length - 1) {
			onNavigate(activeIndex + 1)
		} else if (deltaX > 0 && activeIndex > 0) {
			onNavigate(activeIndex - 1)
		}
	}

	return (
		<Dialog
			open={isOpen}
			onClose={onClose}
			fullScreen
			sx={{
				'& .MuiBackdrop-root': {
					backgroundColor: 'rgba(3, 7, 18, 0.94)',
					backdropFilter: 'blur(10px)',
				},
				'& .MuiDialog-paper': {
					m: 0,
					width: '100%',
					height: '100%',
					maxWidth: 'none',
					maxHeight: 'none',
					overflow: 'hidden',
					backgroundColor: 'transparent',
					boxShadow: 'none',
				},
			}}
		>
			{selectedMedia && activeIndex !== null && (
				<>
				<Box
					sx={{
						position: 'relative',
						width: '100%',
						height: '100%',
						display: 'flex',
						flexDirection: 'column',
						px: { xs: 0, sm: 4 },
						pt: { xs: 'max(env(safe-area-inset-top, 0px), 4px)', sm: 2 },
						pb: { xs: 'max(env(safe-area-inset-bottom, 0px), 4px)', sm: 2 },
					}}
				>
					<Box
						sx={{
							width: '100%',
							minHeight: { xs: 44, sm: 56 },
							px: { xs: 2, sm: 0 },
							display: 'flex',
							alignItems: 'center',
							justifyContent: 'space-between',
						}}
					>
						{canDelete ? (
						<IconButton
							aria-label="Delete media"
							disableRipple
							onClick={() => onDelete(selectedMedia)}
							sx={{
								alignSelf: 'center',
								color: 'error.light',
								backgroundColor: 'transparent',
								'&:hover': { backgroundColor: 'transparent' },
								'&:active': { backgroundColor: 'transparent' },
							}}
						>
							<DeleteIcon />
						</IconButton>
						) : (
						<Box />
						)}
						<Typography
							variant="body2"
							aria-live="polite"
							sx={{
								position: 'absolute',
								left: '50%',
								transform: 'translateX(-50%)',
								color: 'common.white',
							}}
						>
							{activeIndex + 1} / {media.length}
						</Typography>
						<IconButton
							aria-label="Close media gallery"
							disableRipple
							onClick={onClose}
							sx={{
								color: 'common.white',
								backgroundColor: 'transparent',
								'&:hover': { backgroundColor: 'transparent' },
								'&:active': { backgroundColor: 'transparent' },
							}}
						>
							<CloseIcon />
						</IconButton>
					</Box>

					<Box
						sx={{
							position: 'relative',
							flex: 1,
							minHeight: 0,
							width: '100%',
							display: 'flex',
							alignItems: 'center',
							justifyContent: 'center',
						}}
					>
						<Box
							key={selectedMedia.id}
							 sx={{
								width: '100%',
								height: '100%',
								display: 'flex',
								alignItems: 'center',
								justifyContent: 'center',
								touchAction: 'pan-y',
							}}
							onTouchStart={(event) => {
								const touch = event.touches[0]
								touchStart.current = { x: touch.clientX, y: touch.clientY }
							}}
							onTouchEnd={handleTouchEnd}
							onTouchCancel={() => {
								touchStart.current = null
							}}
						>
							<GalleryMedia media={selectedMedia} />
						</Box>
						{media.length > 1 && (
							<>
								<IconButton
									aria-label="Previous media"
									disableRipple
									disabled={activeIndex === 0}
									onClick={() => onNavigate(activeIndex - 1)}
									sx={{
										position: 'absolute',
										left: { xs: 0, sm: 2 },
										top: '50%',
										transform: 'translateY(-50%)',
										width: 48,
										height: 48,
										color: 'common.white',
										backgroundColor: 'transparent',
										'&:hover': { backgroundColor: 'transparent' },
										'&:active': { backgroundColor: 'transparent' },
										'&.Mui-disabled': { color: 'rgba(255,255,255,0.3)' },
									}}
								>
									<NavigateBeforeIcon />
								</IconButton>
								<IconButton
									aria-label="Next media"
									disableRipple
									disabled={activeIndex === media.length - 1}
									onClick={() => onNavigate(activeIndex + 1)}
									sx={{
										position: 'absolute',
										right: { xs: 0, sm: 2 },
										top: '50%',
										transform: 'translateY(-50%)',
										width: 48,
										height: 48,
										color: 'common.white',
										backgroundColor: 'transparent',
										'&:hover': { backgroundColor: 'transparent' },
										'&:active': { backgroundColor: 'transparent' },
										'&.Mui-disabled': { color: 'rgba(255,255,255,0.3)' },
									}}
								>
									<NavigateNextIcon />
								</IconButton>
							</>
						)}
					</Box>

					<Box
						sx={{
							flexShrink: 0,
							minHeight: { xs: 56, sm: 80 },
							width: '100%',
							px: { xs: 2, sm: 0 },
							display: 'flex',
							alignItems: 'center',
							justifyContent: 'space-between',
							gap: 1,
							color: 'common.white',
						}}
					>
						<Box sx={{ minWidth: 0, flex: 1 }}>
							<UploaderDetails key={selectedMedia.id} media={selectedMedia} />
						</Box>
						<Box sx={{ display: 'flex', alignItems: 'center', flexShrink: 0 }}>
							<IconButton
								aria-label="Choose a reaction"
								disabled={!currentDetails || detailsLoading || actionLoading}
								onClick={(event) => setReactionMenuAnchor(event.currentTarget)}
								sx={{
									color: currentReaction ? 'error.light' : 'common.white',
									backgroundColor: 'grey.900',
									'&:hover': { backgroundColor: 'grey.800' },
									'&:active': { backgroundColor: 'grey.800' },
									'&.Mui-disabled': {
										backgroundColor: 'grey.900',
										color: 'grey.600',
									},
								}}
							>
								<Badge
									badgeContent={currentDetails?.reactions.length ?? 0}
									color="error"
								>
									{currentReaction ? <FavoriteIcon /> : <FavoriteBorderIcon />}
								</Badge>
							</IconButton>
							<IconButton
								aria-label="Open comments"
								disabled={!currentDetails && !detailsError}
								onClick={() => setCommentsOpen(true)}
								sx={{
									color: 'common.white',
									backgroundColor: 'grey.900',
									'&:hover': { backgroundColor: 'grey.800' },
									'&:active': { backgroundColor: 'grey.800' },
									'&.Mui-disabled': {
										backgroundColor: 'grey.900',
										color: 'grey.600',
									},
								}}
							>
								<Badge
									badgeContent={currentDetails?.comments.length ?? 0}
									color="primary"
								>
									<ChatBubbleIcon />
								</Badge>
							</IconButton>
						</Box>
					</Box>
					<Menu
						anchorEl={reactionMenuAnchor}
						open={Boolean(reactionMenuAnchor)}
						onClose={() => setReactionMenuAnchor(null)}
						slotProps={{
							paper: {
								sx: {
									backgroundColor: 'grey.900',
									backgroundImage: 'none',
									width: 320,
									maxWidth: 'calc(100vw - 24px)',
									maxHeight: 'min(60dvh, 420px)',
									color: 'common.white',
									'& .MuiMenuItem-root:hover': {
										backgroundColor: 'grey.800',
									},
									'& .MuiMenuItem-root.Mui-selected': {
										backgroundColor: 'grey.800',
									},
									'& .MuiMenuItem-root.Mui-selected:hover': {
										backgroundColor: 'grey.700',
									},
								},
							},
						}}
					>
						{reactionOptions.map((option) => {
							const reactionsForType = currentDetails?.reactions.filter(
								(reaction) => reaction.type === option.type,
							) ?? []

							return (
								<MenuItem
									key={option.type}
									selected={currentReaction?.type === option.type}
									disabled={actionLoading}
									onClick={() => void handleReactionSelection(option.type)}
									sx={{ py: 0.75 }}
								>
									<Box sx={{ minWidth: 0, width: '100%' }}>
										<Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
											<Box component="span" aria-hidden="true">
												{option.emoji}
											</Box>
											<Typography component="span" sx={{ flex: 1 }}>
												{option.label}
											</Typography>
											<Typography component="span" variant="body2" sx={{ fontWeight: 700 }}>
												{reactionsForType.length}
											</Typography>
										</Box>
									</Box>
								</MenuItem>
							)
						})}
					</Menu>
					{actionError && !commentsOpen && (
						<Typography role="alert" variant="caption" color="error.light">
							{actionError}
						</Typography>
					)}
				</Box>
				<Dialog
					open={commentsOpen}
					onClose={() => setCommentsOpen(false)}
					fullWidth
					maxWidth="sm"
					sx={{
						zIndex: (theme) => theme.zIndex.modal + 1,
						'& .MuiDialog-container': { alignItems: 'flex-end' },
						'& .MuiDialog-paper': {
							position: 'absolute',
							bottom: 0,
							m: 0,
							width: '100%',
							maxWidth: 600,
							height: 'min(70dvh, 560px)',
							maxHeight: '80dvh',
							borderRadius: '16px 16px 0 0',
							overflow: 'hidden',
							backgroundColor: 'grey.900',
							backgroundImage: 'none',
							color: 'common.white',
						},
					}}
				>
					<Box
						sx={{
							height: '100%',
							display: 'flex',
							flexDirection: 'column',
							pt: 1,
							pb: 'max(env(safe-area-inset-bottom, 0px), 12px)',
						}}
					>
						<Box
							sx={{
								display: 'flex',
								alignItems: 'center',
								justifyContent: 'space-between',
								px: 2,
								pb: 1,
							}}
						>
							<Typography variant="h6" color="common.white">
								Comments
							</Typography>
							<IconButton
								aria-label="Close comments"
								onClick={() => setCommentsOpen(false)}
								sx={{
									color: 'grey.300',
									'&:hover': { backgroundColor: 'grey.800' },
								}}
							>
								<CloseIcon />
							</IconButton>
						</Box>
						<Divider sx={{ borderColor: 'rgba(255,255,255,0.14)' }} />
						<Box
							sx={{
								flex: 1,
								minHeight: 0,
								overflowY: 'auto',
								px: 2,
								py: 1.5,
							}}
						>
							{detailsLoading ? (
								<Box sx={{ display: 'flex', justifyContent: 'center', py: 3 }}>
									<CircularProgress size={24} />
								</Box>
							) : detailsError ? (
								<Typography color="error" role="alert">
									{detailsError}
								</Typography>
							) : currentDetails?.comments.length ? (
								<Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
									{currentDetails.comments.map((comment) => (
										<MediaCommentItem
											key={comment.id}
											comment={comment}
											canDelete={comment.author?.id === auth.user?.id}
											deleteDisabled={actionLoading}
											onDelete={(commentId) => {
											setActionError(null)
											setCommentToDelete(commentId)
										}}
										/>
									))}
								</Box>
							) : (
								<Typography variant="body2" color="grey.400">
									No comments yet.
								</Typography>
							)}
						</Box>
						{actionError && (
							<Typography role="alert" color="error" variant="caption" sx={{ px: 2 }}>
								{actionError}
							</Typography>
						)}
						<Box
							component="form"
							onSubmit={handleCommentSubmit}
							sx={{
								width: '100%',
								boxSizing: 'border-box',
								display: 'flex',
								alignItems: 'center',
								gap: 1,
								pl: 2,
								pr: 1,
								pt: 1,
							}}
						>
							{selectedMedia.media_type === 'image' && commentPreviewUrl ? (
								<Box
									component="img"
									src={commentPreviewUrl}
									alt="Photo being commented on"
									sx={{
										width: 40,
										height: 40,
										flexShrink: 0,
										objectFit: 'cover',
										borderRadius: 1,
									}}
								/>
							) : selectedMedia.media_type === 'video' ? (
								<Box
									aria-label="Video being commented on"
									sx={{
										width: 40,
										height: 40,
										flexShrink: 0,
										display: 'grid',
										placeItems: 'center',
										color: 'grey.300',
										backgroundColor: 'grey.800',
										borderRadius: 1,
									}}
								>
									<VideoFileIcon fontSize="small" />
								</Box>
							) : null}
							<TextField
								value={commentText}
								onChange={(event) => setCommentText(event.target.value)}
								placeholder="Write a comment"
								aria-label="Write a comment"
								size="small"
								multiline
								maxRows={2}
								disabled={actionLoading || !auth.accessToken}
								slotProps={{ htmlInput: { maxLength: 1000 } }}
								sx={{
									minWidth: 0,
									width: 0,
									flex: '1 1 0%',
									'& .MuiInputBase-root': {
										color: 'common.white',
										backgroundColor: 'grey.800',
									},
									'& .MuiOutlinedInput-notchedOutline': {
										borderColor: 'grey.700',
									},
									'& .MuiOutlinedInput-root:hover .MuiOutlinedInput-notchedOutline': {
										borderColor: 'grey.500',
									},
									'& .MuiInputBase-input::placeholder': {
										color: 'grey.400',
										opacity: 1,
									},
								}}
							/>
							<IconButton
								type="submit"
								aria-label="Post comment"
								disabled={!commentText.trim() || actionLoading || !auth.accessToken}
								color="primary"
								sx={{ width: 40, height: 40, flexShrink: 0 }}
							>
								<SendIcon />
							</IconButton>
						</Box>
					</Box>
				</Dialog>
				<Dialog
					open={commentToDelete !== null}
					onClose={() => {
						if (!actionLoading) {
							setCommentToDelete(null)
							setActionError(null)
						}
					}}
					sx={{
						zIndex: (theme) => theme.zIndex.modal + 2,
						'& .MuiDialog-paper': {
							backgroundColor: 'grey.900',
							backgroundImage: 'none',
							color: 'common.white',
						},
					}}
				>
					<DialogTitle>Delete this comment?</DialogTitle>
					<DialogContent>
						<DialogContentText sx={{ color: 'grey.300' }}>
							Are you sure you want to permanently delete this comment?
						</DialogContentText>
						{actionError && (
							<Typography role="alert" color="error.light" sx={{ mt: 1 }}>
								{actionError}
							</Typography>
						)}
					</DialogContent>
					<DialogActions>
						<Button
							onClick={() => {
							setCommentToDelete(null)
							setActionError(null)
						}}
							disabled={actionLoading}
						>
							Cancel
						</Button>
						<Button
							onClick={() => {
							if (commentToDelete !== null) {
								void handleCommentDelete(commentToDelete)
							}
						}}
							color="error"
							variant="contained"
							disabled={actionLoading}
						>
							{actionLoading ? 'Deleting...' : 'Delete comment'}
						</Button>
					</DialogActions>
				</Dialog>
				</>
			)}
		</Dialog>
	)
}
