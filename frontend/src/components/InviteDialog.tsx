import ContentCopyIcon from '@mui/icons-material/ContentCopy'
import Alert from '@mui/material/Alert'
import Box from '@mui/material/Box'
import Button from '@mui/material/Button'
import CircularProgress from '@mui/material/CircularProgress'
import Dialog from '@mui/material/Dialog'
import DialogActions from '@mui/material/DialogActions'
import DialogContent from '@mui/material/DialogContent'
import DialogTitle from '@mui/material/DialogTitle'
import Typography from '@mui/material/Typography'
import { QRCodeSVG } from 'qrcode.react'
import { useEffect, useState } from 'react'

import { createInvitation } from '../api/invitations'
import { useAuth } from '../providers/useAuth'

type InviteDialogProps = {
	open: boolean
	collectionId: number | string
	onClose: () => void
}

export default function InviteDialog({
	open,
	collectionId,
	onClose,
}: InviteDialogProps) {
	const auth = useAuth()
	const [token, setToken] = useState<string | null>(null)
	const [loading, setLoading] = useState(true)
	const [error, setError] = useState<string | null>(null)
	const [linkCopied, setLinkCopied] = useState(false)
	const [attempt, setAttempt] = useState(0)

	const inviteUrl = token
		? `${window.location.origin}/invite/${encodeURIComponent(token)}`
		: ''

	// the dialog is mounted per open, so loading starts true and the first fetch runs on mount
	useEffect(() => {
		let cancelled = false
		const request = auth.accessToken
			? createInvitation(collectionId, auth.accessToken)
			: Promise.reject(new Error('Please sign in again to create an invitation.'))

		request
			.then((invitationToken) => {
				if (!cancelled) setToken(invitationToken)
			})
			.catch((cause) => {
				if (!cancelled) {
					setError(
						cause instanceof Error
							? cause.message
							: 'Unable to create an invitation.',
					)
				}
			})
			.finally(() => {
				if (!cancelled) setLoading(false)
			})

		return () => {
			cancelled = true
		}
	}, [attempt, auth.accessToken, collectionId])

	const handleRetry = () => {
		setError(null)
		setLoading(true)
		setAttempt((value) => value + 1)
	}

	const handleCopyLink = async () => {
		try {
			await navigator.clipboard.writeText(inviteUrl)
			setLinkCopied(true)
		} catch {
			setError('Could not copy the invite link. You can scan the QR code instead.')
		}
	}

	return (
		<Dialog open={open} onClose={onClose} fullWidth maxWidth="xs">
			<DialogTitle>Invite to collection</DialogTitle>
			<DialogContent>
				{error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
				{token ? (
					<Box sx={{ display: 'grid', justifyItems: 'center', gap: 2, py: 1 }}>
						<Box sx={{ bgcolor: 'common.white', p: 1.5, borderRadius: 1 }}>
							<QRCodeSVG value={inviteUrl} size={220} level="M" />
						</Box>
						<Typography color="text.secondary" sx={{ textAlign: 'center' }}>
							This invite expires in 60 minutes. Anyone with the link can join.
						</Typography>
						<Button
							startIcon={<ContentCopyIcon />}
							onClick={handleCopyLink}
						>
							{linkCopied ? 'Link copied' : 'Copy invite link'}
						</Button>
					</Box>
				) : loading ? (
					<Box sx={{ display: 'grid', justifyItems: 'center', py: 3 }}>
						<CircularProgress />
					</Box>
				) : (
					<Button fullWidth variant="contained" onClick={handleRetry}>
						Try again
					</Button>
				)}
			</DialogContent>
			<DialogActions>
				<Button onClick={onClose}>Close</Button>
			</DialogActions>
		</Dialog>
	)
}