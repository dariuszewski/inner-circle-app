import Box from '@mui/material/Box'
import Button from '@mui/material/Button'
import Dialog from '@mui/material/Dialog'
import DialogActions from '@mui/material/DialogActions'
import DialogContent from '@mui/material/DialogContent'
import DialogTitle from '@mui/material/DialogTitle'
import List from '@mui/material/List'
import ListItem from '@mui/material/ListItem'
import Typography from '@mui/material/Typography'

import type { UserResponsePublic } from '../types/userResponse'
import MemberAvatar from './MemberAvatar'

type MembersDialogProps = {
	open: boolean
	members: UserResponsePublic[]
	ownerId: number
	onClose: () => void
}

export default function MembersDialog({ open, members, ownerId, onClose }: MembersDialogProps) {
	return (
		<Dialog open={open} onClose={onClose} fullWidth maxWidth="xs">
			<DialogTitle>Members ({members.length})</DialogTitle>
			<DialogContent dividers sx={{ p: 0 }}>
				<List disablePadding>
					{members.map((member) => (
						<ListItem key={member.id} sx={{ gap: 1.5 }}>
							<MemberAvatar member={member} size={40} />
							<Typography noWrap sx={{ flex: 1, minWidth: 0 }}>
								{member.username}
							</Typography>
							{member.id === ownerId && (
								<Box component="span" sx={{ typography: 'caption', color: 'text.secondary' }}>
									Owner
								</Box>
							)}
						</ListItem>
					))}
				</List>
			</DialogContent>
			<DialogActions>
				<Button onClick={onClose}>Close</Button>
			</DialogActions>
		</Dialog>
	)
}
