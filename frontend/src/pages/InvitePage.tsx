import ArrowForwardIcon from '@mui/icons-material/ArrowForward'
import Box from '@mui/material/Box'
import Button from '@mui/material/Button'
import CircularProgress from '@mui/material/CircularProgress'
import Typography from '@mui/material/Typography'
import { useState } from 'react'
import { Link as RouterLink, useLocation, useNavigate, useParams } from 'react-router'

import { acceptInvitation } from '../api/invitations'
import { useAuth } from '../providers/useAuth'

export default function InvitePage() {
	const { token } = useParams<{ token: string }>()
	const auth = useAuth()
	const location = useLocation()
	const navigate = useNavigate()
	const [joining, setJoining] = useState(false)
	const [joined, setJoined] = useState(false)
	const [error, setError] = useState<string | null>(null)

	const handleJoin = async () => {
		if (!token || !auth.accessToken) {
			return
		}

		try {
			setJoining(true)
			setError(null)
			await acceptInvitation(token, auth.accessToken)
			setJoined(true)
		} catch (cause) {
			setError(
				cause instanceof Error
					? cause.message
					: 'Unable to accept this invitation.',
			)
		} finally {
			setJoining(false)
		}
	}

	const loginUrl = `/login?returnTo=${encodeURIComponent(location.pathname)}`

	return (
		<Box sx={{ maxWidth: 400, mx: 'auto', py: 6 }}>
			<Typography variant="h4" component="h1" gutterBottom>
				{joined ? 'You joined the collection' : 'You’re invited'}
			</Typography>
			<Typography color="text.secondary" sx={{ mb: 3 }}>
				{joined
					? 'You can now find this collection with your other collections.'
					: 'Sign in to join this collection. This invitation expires after 60 minutes.'}
			</Typography>
			{error && (
				<Typography color="error" role="alert" sx={{ mb: 2 }}>
					{error}
				</Typography>
			)}
			{joined ? (
				<Button
					variant="contained"
					endIcon={<ArrowForwardIcon />}
					onClick={() => navigate('/collections')}
				>
					Go to collections
				</Button>
			) : auth.user ? (
				<Button
					variant="contained"
					disabled={joining || !token}
					startIcon={joining ? <CircularProgress size={18} /> : undefined}
					onClick={handleJoin}
				>
					{joining ? 'Joining…' : 'Join collection'}
				</Button>
			) : (
				<Button component={RouterLink} to={loginUrl} variant="contained">
					Log in to join
				</Button>
			)}
		</Box>
	)
}