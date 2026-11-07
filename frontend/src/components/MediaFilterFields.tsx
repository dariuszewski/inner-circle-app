import Autocomplete from '@mui/material/Autocomplete'
import Box from '@mui/material/Box'
import Checkbox from '@mui/material/Checkbox'
import Chip from '@mui/material/Chip'
import MenuItem from '@mui/material/MenuItem'
import TextField from '@mui/material/TextField'
import ToggleButton from '@mui/material/ToggleButton'
import ToggleButtonGroup from '@mui/material/ToggleButtonGroup'

import type { MediaFilters, MediaTypeFilter } from '../types/mediaFilters'
import type { UserResponsePublic } from '../types/userResponse'

// Matches the reaction menu in MediaGalleryViewer.
const menuProps = {
	slotProps: {
		paper: {
			sx: {
				backgroundColor: 'grey.900',
				backgroundImage: 'none',
				color: 'common.white',
				'& .MuiMenuItem-root:hover': { backgroundColor: 'grey.800' },
				'& .MuiMenuItem-root.Mui-selected': { backgroundColor: 'grey.800' },
				'& .MuiMenuItem-root.Mui-selected:hover': { backgroundColor: 'grey.700' },
			},
		},
	},
}

type MediaFilterFieldsProps = {
	value: MediaFilters
	onChange: (value: MediaFilters) => void
	members: UserResponsePublic[]
	direction?: 'column' | 'row'
}

export default function MediaFilterFields({
	value,
	onChange,
	members,
	direction = 'column',
}: MediaFilterFieldsProps) {
	const isRow = direction === 'row'
	const fieldSx = isRow ? { flex: '1 1 160px', minWidth: 140 } : undefined
	const dateSx = {
		flex: 1,
		minWidth: 0,
		'& input': { fontSize: '0.85rem', px: 1 },
		'& input::-webkit-calendar-picker-indicator': { filter: 'invert(1)', ml: 0 },
	}

	return (
		<Box
			sx={{
				display: 'flex',
				flexDirection: direction,
				flexWrap: 'wrap',
				alignItems: isRow ? 'center' : 'stretch',
				gap: 2,
			}}
		>
			<Box sx={{ display: 'flex', gap: 1, ...fieldSx }}>
				<TextField
					select
					label="Sort by"
					size="small"
					value={value.sort}
					onChange={(event) =>
						onChange({ ...value, sort: event.target.value as MediaFilters['sort'] })
					}
					sx={{ flex: 1 }}
					slotProps={{ select: { MenuProps: menuProps } }}
				>
					<MenuItem value="uploaded_at">Date</MenuItem>
					<MenuItem value="popularity_score">Popularity</MenuItem>
				</TextField>
				<ToggleButtonGroup
					exclusive
					size="small"
					value={value.order}
					onChange={(_, order: MediaFilters['order'] | null) =>
						order && onChange({ ...value, order })
					}
					aria-label="sort order"
				>
					<ToggleButton value="asc" aria-label="ascending">Asc</ToggleButton>
					<ToggleButton value="desc" aria-label="descending">Desc</ToggleButton>
				</ToggleButtonGroup>
			</Box>

			<Box sx={{ display: 'flex', gap: 1, ...fieldSx }}>
				<TextField
					type="date"
					label="From"
					size="small"
					value={value.from}
					onChange={(event) => onChange({ ...value, from: event.target.value })}
					slotProps={{
						inputLabel: { shrink: true },
						htmlInput: { max: value.to || undefined },
					}}
					sx={dateSx}
				/>
				<TextField
					type="date"
					label="To"
					size="small"
					value={value.to}
					onChange={(event) => onChange({ ...value, to: event.target.value })}
					slotProps={{
						inputLabel: { shrink: true },
						htmlInput: { min: value.from || undefined },
					}}
					sx={dateSx}
				/>
			</Box>

			<ToggleButtonGroup
				exclusive
				size="small"
				value={value.mediaType}
				onChange={(_, mediaType: MediaTypeFilter | null) => onChange({ ...value, mediaType })}
				aria-label="media type"
			>
				<ToggleButton value="image">Images</ToggleButton>
				<ToggleButton value="video">Videos</ToggleButton>
			</ToggleButtonGroup>

			<Autocomplete
				multiple
				disableCloseOnSelect
				size="small"
				options={members}
				getOptionLabel={(member) => member.username}
				isOptionEqualToValue={(option, selected) => option.id === selected.id}
				value={members.filter((member) => value.authorIds.includes(member.id))}
				onChange={(_, selected) =>
					onChange({ ...value, authorIds: selected.map((member) => member.id) })
				}
				noOptionsText="No users found"
				renderInput={(params) => <TextField {...params} label="Authors" />}
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
				slotProps={{
					paper: {
						sx: {
							backgroundColor: 'grey.900',
							backgroundImage: 'none',
							color: 'common.white',
							'& .MuiAutocomplete-option.Mui-focused': { backgroundColor: 'grey.800' },
							'& .MuiAutocomplete-option[aria-selected="true"]': { backgroundColor: 'grey.800' },
							'& .MuiAutocomplete-option[aria-selected="true"].Mui-focused': {
								backgroundColor: 'grey.700',
							},
						},
					},
				}}
				sx={fieldSx}
			/>
		</Box>
	)
}
