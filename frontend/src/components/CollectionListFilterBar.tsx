import SearchIcon from '@mui/icons-material/Search'
import Autocomplete from '@mui/material/Autocomplete'
import Box from '@mui/material/Box'
import Button from '@mui/material/Button'
import Checkbox from '@mui/material/Checkbox'
import Chip from '@mui/material/Chip'
import Collapse from '@mui/material/Collapse'
import InputAdornment from '@mui/material/InputAdornment'
import MenuItem from '@mui/material/MenuItem'
import TextField from '@mui/material/TextField'
import ToggleButton from '@mui/material/ToggleButton'
import ToggleButtonGroup from '@mui/material/ToggleButtonGroup'

import { type CollectionFilters,defaultCollectionFilters } from '../types/collectionFilters'
import type { UserResponsePublic } from '../types/userResponse'
import { autocompleteSlotProps, menuProps } from './filterMenuStyles'

const fieldSx = { flex: '1 1 0', minWidth: 0 }
// Side by side from `sm` up, one per row below.
const stackedFieldSx = { ...fieldSx, flexBasis: { xs: '100%', sm: 0 } }

type CollectionListFilterBarProps = {
	open: boolean
	value: CollectionFilters
	onChange: (value: CollectionFilters) => void
	onHide: () => void
	members: UserResponsePublic[]
	membersLoading: boolean
}

export default function CollectionListFilterBar({
	open,
	value,
	onChange,
	onHide,
	members,
	membersLoading,
}: CollectionListFilterBarProps) {
	return (
		<Collapse in={open} unmountOnExit>
			<Box
				sx={{
					display: 'flex',
					alignItems: 'center',
					gap: 1,
					mt: 2,
					mb: 2,
					p: 1.5,
					border: 1,
					borderColor: 'primary.main',
					borderRadius: 2,
				}}
			>
				<Box sx={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 2 }}>
					<Box sx={{ display: 'flex', gap: 1 }}>
						<TextField
							select
							label="Sort by"
							size="small"
							value={value.sort}
							onChange={(event) =>
								onChange({ ...value, sort: event.target.value as CollectionFilters['sort'] })
							}
							sx={{ flex: 1 }}
							slotProps={{ select: { MenuProps: menuProps } }}
						>
							<MenuItem value="created_at">Created date</MenuItem>
							<MenuItem value="last_activity">Last activity</MenuItem>
							<MenuItem value="number_items">Items</MenuItem>
							<MenuItem value="number_members">Members</MenuItem>
							<MenuItem value="name">Name</MenuItem>
						</TextField>
						<ToggleButtonGroup
							exclusive
							size="small"
							value={value.order}
							onChange={(_, order: CollectionFilters['order'] | null) =>
								order && onChange({ ...value, order })
							}
							aria-label="sort order"
						>
							<ToggleButton value="asc" aria-label="ascending">Asc</ToggleButton>
							<ToggleButton value="desc" aria-label="descending">Desc</ToggleButton>
						</ToggleButtonGroup>
					</Box>

					<Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2 }}>
						<TextField
							type="date"
							label="Created from"
							size="small"
							value={value.from}
							onChange={(event) => onChange({ ...value, from: event.target.value })}
							slotProps={{
								inputLabel: { shrink: true },
								htmlInput: { max: value.to || undefined },
							}}
							sx={{
								...fieldSx,
								'& input': { fontSize: '0.85rem', px: 1 },
								'& input::-webkit-calendar-picker-indicator': { filter: 'invert(1)', ml: 0 },
							}}
						/>
						<TextField
							type="date"
							label="Created to"
							size="small"
							value={value.to}
							onChange={(event) => onChange({ ...value, to: event.target.value })}
							slotProps={{
								inputLabel: { shrink: true },
								htmlInput: { min: value.from || undefined },
							}}
							sx={{
								...fieldSx,
								'& input': { fontSize: '0.85rem', px: 1 },
								'& input::-webkit-calendar-picker-indicator': { filter: 'invert(1)', ml: 0 },
							}}
						/>
					</Box>

					<Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2 }}>
						<TextField
							label="Search"
							size="small"
							value={value.search}
							onChange={(event) => onChange({ ...value, search: event.target.value })}
							slotProps={{
								input: {
									startAdornment: (
										<InputAdornment position="start">
											<SearchIcon fontSize="small" />
										</InputAdornment>
									),
								},
							}}
							sx={stackedFieldSx}
						/>
						<Autocomplete
							multiple
							disableCloseOnSelect
							size="small"
							options={members}
							loading={membersLoading}
							getOptionLabel={(member) => member.username}
							isOptionEqualToValue={(option, selected) => option.id === selected.id}
							value={members.filter((member) => value.memberIds.includes(member.id))}
							onChange={(_, selected) =>
								onChange({ ...value, memberIds: selected.map((member) => member.id) })
							}
							loadingText="Loading users..."
							noOptionsText="No users found"
							renderInput={(params) => (
								<TextField
									{...params}
									label="Members"
									slotProps={{
										...params.slotProps,
										inputLabel: { ...params.slotProps.inputLabel, shrink: true },
									}}
								/>
							)}
							renderValue={(selected, getItemProps) =>
								selected.map((member, index) => {
									const { key, ...itemProps } = getItemProps({ index })
									return <Chip key={key} size="small" label={member.username} {...itemProps} />
								})
							}
							renderOption={(props, member, { selected }) => {
								const { key, ...optionProps } = props
								return (
									<li key={key} {...optionProps}>
										<Checkbox checked={selected} sx={{ mr: 1 }} />
										{member.username}
									</li>
								)
							}}
							slotProps={autocompleteSlotProps}
							sx={stackedFieldSx}
						/>
					</Box>
				</Box>
				<Box sx={{ display: 'flex', flexDirection: 'column' }}>
					<Button onClick={() => onChange(defaultCollectionFilters)}>Reset</Button>
					<Button onClick={onHide}>Hide</Button>
				</Box>
			</Box>
		</Collapse>
	)
}
