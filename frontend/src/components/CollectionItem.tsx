import CloseIcon from '@mui/icons-material/Close'
import DeleteIcon from '@mui/icons-material/Delete'
import PlayArrowIcon from '@mui/icons-material/PlayArrow'
import VideoFileIcon from '@mui/icons-material/VideoFile'
import Box from '@mui/material/Box'
import CircularProgress from '@mui/material/CircularProgress'
import Dialog from '@mui/material/Dialog'
import IconButton from '@mui/material/IconButton'
import Typography from '@mui/material/Typography'
import { useEffect, useState } from 'react'

import { useProtectedImage } from '../hooks/useProtectedImage'
import { useAuth } from '../providers/useAuth'

type CollectionItemProps = {
	src: string
	alt?: string
	mediaType?: string
	fileName?: string
	onClick?: () => void
	onDeleteClick?: () => void
}

const videoMimeTypes: Record<string, string> = {
	avi: 'video/x-msvideo',
	m4v: 'video/mp4',
	mov: 'video/quicktime',
	mp4: 'video/mp4',
	ogg: 'video/ogg',
	ogv: 'video/ogg',
	webm: 'video/webm',
}

function getVideoMimeType(fileName?: string) {
	const extension = fileName?.split('.').pop()?.toLowerCase()
	return extension ? videoMimeTypes[extension] : undefined
}

export default function CollectionItem({
	src,
	alt = '',
	mediaType = 'image',
	fileName,
	onClick,
	onDeleteClick,
}: CollectionItemProps) {
	const isVideo = mediaType === 'video'
	const imageUrl = useProtectedImage(isVideo ? undefined : src)
	const auth = useAuth()
	const [lightboxOpen, setLightboxOpen] = useState(false)
	const [videoUrl, setVideoUrl] = useState<string | null>(null)
	const [videoLoading, setVideoLoading] = useState(false)
	const [videoError, setVideoError] = useState(false)

	useEffect(() => {
		if (!isVideo || !lightboxOpen) {
			return
		}

		if (!auth.accessToken) {
			return
		}

		const controller = new AbortController()
		let objectUrl: string | null = null

		async function fetchVideo() {
			setVideoLoading(true)
			setVideoError(false)

			try {
				const response = await fetch(src, {
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
					: getVideoMimeType(fileName)
				const videoBlob = mimeType
					? new Blob([blob], { type: mimeType })
					: blob

				objectUrl = URL.createObjectURL(videoBlob)
				setVideoUrl(objectUrl)
			} catch (error) {
				if (error instanceof DOMException && error.name === 'AbortError') {
					return
				}

				setVideoError(true)
			} finally {
				if (!controller.signal.aborted) {
					setVideoLoading(false)
				}
			}
		}

		fetchVideo()

		return () => {
			controller.abort()
			if (objectUrl) {
				URL.revokeObjectURL(objectUrl)
			}
		}
	}, [auth.accessToken, fileName, isVideo, lightboxOpen, src])

	if (!isVideo && !imageUrl) {
		return null
	}

	const openLightbox = () => {
		setLightboxOpen(true)
		onClick?.()
	}

	const closeLightbox = () => {
		setLightboxOpen(false)
		setVideoUrl(null)
	}

	return (
		<>
			<Box
				sx={{
					position: 'relative',
					aspectRatio: '3 / 4',
					borderRadius: 2,
					overflow: 'hidden',
					bgcolor: 'background.paper',
					boxShadow: (theme) =>
						theme.palette.mode === 'dark'
							? '0 12px 28px rgba(0,0,0,0.35)'
							: '0 12px 28px rgba(15,23,42,0.08)',
					'&:hover .collection-item-image': {
						transform: 'scale(1.04)',
					},
				}}
			>
				<Box
					component="button"
					type="button"
					aria-label={`Open ${alt || (isVideo ? 'video' : 'image')}`}
					onClick={openLightbox}
					sx={{
						position: 'absolute',
						inset: 0,
						width: '100%',
						height: '100%',
						p: 0,
						border: 0,
						color: 'inherit',
						textAlign: 'inherit',
						bgcolor: 'transparent',
						cursor: 'pointer',
						'&:focus-visible': {
							outline: '2px solid',
							outlineColor: 'primary.main',
							outlineOffset: -2,
						},
					}}
				>
					{isVideo ? (
						<Box
							sx={{
								width: '100%',
								height: '100%',
								display: 'grid',
								placeItems: 'center',
								color: 'common.white',
								bgcolor: 'grey.900',
							}}
						>
							<VideoFileIcon sx={{ fontSize: 56 }} />
							<PlayArrowIcon
								sx={{
									position: 'absolute',
									bottom: 12,
									right: 12,
									fontSize: 36,
								}}
							/>
						</Box>
					) : (
						<Box
							className="collection-item-image"
							component="img"
							src={imageUrl ?? undefined}
							alt={alt}
							sx={{
								width: '100%',
								height: '100%',
								objectFit: 'cover',
								display: 'block',
								transition: 'transform 0.35s ease',
							}}
						/>
					)}
				</Box>
			</Box>

			<Dialog
				open={lightboxOpen}
				onClose={closeLightbox}
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
				<Box
					sx={{
						position: 'relative',
						width: '100%',
						height: '100%',
						display: 'flex',
						flexDirection: 'column',
						px: { xs: 2, sm: 4 },
						py: { xs: 1, sm: 2 },
					}}
				>
					<Box
						sx={{
							width: '100%',
							minHeight: { xs: 48, sm: 56 },
							display: 'flex',
							alignItems: 'center',
							justifyContent: 'space-between',
						}}
					>
						{onDeleteClick ? (
							<IconButton
								aria-label={`Delete ${alt || 'media'}`}
								onClick={onDeleteClick}
								sx={{
									color: 'common.white',
									backgroundColor: 'rgba(15, 23, 42, 0.7)',
									'&:hover': { backgroundColor: 'error.main' },
								}}
							>
								<DeleteIcon />
							</IconButton>
						) : (
							<Box sx={{ width: 40, height: 40 }} />
						)}
						<IconButton
							aria-label="Close media"
							onClick={closeLightbox}
							sx={{
								color: 'common.white',
								backgroundColor: 'rgba(15, 23, 42, 0.7)',
								'&:hover': {
									backgroundColor: 'rgba(30, 41, 59, 0.9)',
								},
							}}
						>
							<CloseIcon />
						</IconButton>
					</Box>

					<Box
						sx={{
							flex: 1,
							minHeight: 0,
							width: '100%',
							display: 'flex',
							alignItems: 'center',
							justifyContent: 'center',
						}}
					>
					{isVideo ? (
						videoUrl ? (
							<Box
								component="video"
								src={videoUrl}
								controls
								autoPlay
								playsInline
								aria-label={alt || 'Video player'}
								sx={{
									maxWidth: '100%',
									maxHeight: '100%',
									minWidth: 0,
									minHeight: 0,
									borderRadius: { xs: 1, sm: 2 },
									boxShadow: '0 32px 100px rgba(0, 0, 0, 0.65)',
								}}
							/>
						) : (
							<Box sx={{ color: 'common.white', textAlign: 'center' }}>
								{videoLoading ? (
									<CircularProgress color="inherit" />
								) : (
									<Typography role="alert">
										{videoError || !auth.accessToken
											? 'Unable to load this video.'
											: 'Loading video...'}
									</Typography>
								)}
							</Box>
						)
					) : (
						<Box
							component="img"
							src={imageUrl ?? undefined}
							alt={alt}
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
					)}
					</Box>
					<Box sx={{ flexShrink: 0, height: { xs: 64, sm: 96 } }} />
				</Box>
			</Dialog>
		</>
	)
}
