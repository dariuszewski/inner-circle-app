import PeopleAltIcon from '@mui/icons-material/PeopleAlt'
import PhotoLibraryIcon from '@mui/icons-material/PhotoLibrary'
import Box from '@mui/material/Box'
import ButtonBase from '@mui/material/ButtonBase'
import Typography from '@mui/material/Typography'
import { useState } from 'react'

import type { UserResponsePublic } from '../types/userResponse'
import MemberAvatar from './MemberAvatar'
import MembersDialog from './MembersDialog'

const MAX_AVATARS = 7

type MembersSummaryProps = {
	count: number
	members: UserResponsePublic[]
	ownerId: number
	itemsCount: number
}

export default function MembersSummary({ count, members, ownerId, itemsCount }: MembersSummaryProps) {
	const [dialogOpen, setDialogOpen] = useState(false)

	return (
		<Box
			sx={{
				display: 'flex',
				width: '100%',
				alignItems: 'center',
				gap: 1,
				px: 1.5,
				py: 0.5,
				borderRadius: 999,
				bgcolor: 'action.hover',
			}}
		>
			<ButtonBase
				aria-label="Show members"
				onClick={() => setDialogOpen(true)}
				sx={{ display: 'flex', alignItems: 'center', gap: 1, borderRadius: 999 }}
			>
				<PeopleAltIcon fontSize="small" />
				<Typography variant="body2" sx={{ fontWeight: 600 }}>
					{count}
				</Typography>
				<Box sx={{ display: 'flex', alignItems: 'center' }}>
					{members.slice(0, MAX_AVATARS).map((member, index) => (
						<MemberAvatar
							key={member.id}
							member={member}
							size={28}
							sx={{
								ml: index === 0 ? 0 : -1.5,
								zIndex: MAX_AVATARS - index,
								border: 2,
								borderColor: 'background.paper',
							}}
						/>
					))}
				</Box>
			</ButtonBase>
			<Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, ml: 'auto', pr: 0.5 }}>
				<PhotoLibraryIcon fontSize="small" />
				<Typography variant="body2" sx={{ fontWeight: 600 }}>
					{itemsCount}
				</Typography>
			</Box>
			<MembersDialog
				open={dialogOpen}
				members={members}
				ownerId={ownerId}
				onClose={() => setDialogOpen(false)}
			/>
		</Box>
	)
}
