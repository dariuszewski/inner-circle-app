// Matches the reaction menu in MediaGalleryViewer.
export const menuProps = {
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

export const autocompleteSlotProps = {
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
}
