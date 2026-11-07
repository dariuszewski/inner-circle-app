import Box from '@mui/material/Box'
import Button from '@mui/material/Button'
import Collapse from '@mui/material/Collapse'

import { defaultMediaFilters, type MediaFilters } from '../types/mediaFilters'
import type { UserResponsePublic } from '../types/userResponse'
import MediaFilterFields from './MediaFilterFields'

type MediaFilterBarProps = {
	open: boolean
	value: MediaFilters
	onChange: (value: MediaFilters) => void
	members: UserResponsePublic[]
	onHide: () => void
}

export default function MediaFilterBar({ open, value, onChange, members, onHide }: MediaFilterBarProps) {
	return (
		<Collapse in={open} unmountOnExit>
			<Box
				sx={{
					display: 'flex',
					alignItems: 'center',
					gap: 1,
					mt: 2,
					p: 1.5,
					border: 1,
					borderColor: 'primary.main',
					borderRadius: 2,
				}}
			>
				<Box sx={{ flex: 1 }}>
					<MediaFilterFields
						value={value}
						onChange={onChange}
						members={members}
						direction="row"
					/>
				</Box>
				<Box sx={{ display: 'flex', flexDirection: 'column' }}>
					<Button onClick={() => onChange(defaultMediaFilters)}>Reset</Button>
					<Button onClick={onHide}>Hide</Button>
				</Box>
			</Box>
		</Collapse>
	)
}
