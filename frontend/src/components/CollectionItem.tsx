import BrokenImageIcon from '@mui/icons-material/BrokenImage'
import PlayArrowIcon from '@mui/icons-material/PlayArrow'
import VideoFileIcon from '@mui/icons-material/VideoFile'
import Box from '@mui/material/Box'
import Skeleton from '@mui/material/Skeleton'

import { useProtectedMediaState } from '../hooks/useProtectedMedia'

type CollectionItemProps = {
	src: string
	alt?: string
	mediaType?: string
	onClick?: () => void
}

export default function CollectionItem({
	src,
	alt = '',
	mediaType = 'image',
	onClick,
}: CollectionItemProps) {
	const isVideo = mediaType === 'video'
	const { url: imageUrl, hasError } = useProtectedMediaState(
		isVideo ? undefined : src,
	)

	if (!isVideo && hasError) {
		return (
			<Box
				role="img"
				aria-label="Failed to load media"
				sx={{
					aspectRatio: '3 / 4',
					borderRadius: 2,
					display: 'grid',
					placeItems: 'center',
					color: 'text.secondary',
					bgcolor: 'action.hover',
				}}
			>
				<BrokenImageIcon fontSize="large" />
			</Box>
		)
	}

	if (!isVideo && !imageUrl) {
		return (
			<Skeleton
				variant="rounded"
				aria-label="Loading media"
				sx={{ aspectRatio: '3 / 4', width: '100%', height: 'auto', borderRadius: 2 }}
			/>
		)
	}

	return (
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
				onClick={onClick}
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
	)
}