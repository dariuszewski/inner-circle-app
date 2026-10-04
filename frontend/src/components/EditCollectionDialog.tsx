import Alert from '@mui/material/Alert'
import Button from '@mui/material/Button'
import Dialog from '@mui/material/Dialog'
import DialogActions from '@mui/material/DialogActions'
import DialogContent from '@mui/material/DialogContent'
import DialogTitle from '@mui/material/DialogTitle'
import TextField from '@mui/material/TextField'
import { type SubmitEventHandler, useState } from 'react'

import { updateCollection } from '../api/collection'
import { useAuth } from '../providers/useAuth'

type EditCollectionDialogProps = {
	open: boolean
	collectionId: number | string
	initialName: string
	initialDescription: string | null
	onClose: () => void
	onSaved: () => void | Promise<void>
}

export default function EditCollectionDialog({
	open,
	collectionId,
	initialName,
	initialDescription,
	onClose,
	onSaved,
}: EditCollectionDialogProps) {
	const auth = useAuth()
	const [name, setName] = useState(initialName)
	const [description, setDescription] = useState(initialDescription ?? '')
	const [saving, setSaving] = useState(false)
	const [error, setError] = useState<string | null>(null)

	const handleSubmit: SubmitEventHandler<HTMLDivElement> = async (event) => {
		event.preventDefault()
		if (!auth.accessToken) {
			setError('Please sign in again.')
			return
		}

		try {
			setSaving(true)
			setError(null)
			await updateCollection({
				collectionId,
				name: name.trim(),
				description: description.trim() || null,
				accessToken: auth.accessToken,
			})
			await onSaved()
			onClose()
		} catch (cause) {
			setError(cause instanceof Error ? cause.message : 'Failed to update collection.')
		} finally {
			setSaving(false)
		}
	}

	return (
		<Dialog
			open={open}
			onClose={() => !saving && onClose()}
			fullWidth
			maxWidth="xs"
			component="form"
			onSubmit={handleSubmit}
		>
			<DialogTitle>Edit collection</DialogTitle>
			<DialogContent sx={{ display: 'grid', gap: 2, pt: '8px !important' }}>
				{error && <Alert severity="error">{error}</Alert>}
				<TextField
					label="Name"
					value={name}
					onChange={(event) => setName(event.target.value)}
					required
					autoFocus
					slotProps={{ htmlInput: { maxLength: 100 } }}
				/>
				<TextField
					label="Description"
					value={description}
					onChange={(event) => setDescription(event.target.value)}
					multiline
					minRows={3}
					slotProps={{ htmlInput: { maxLength: 500 } }}
				/>
			</DialogContent>
			<DialogActions>
				<Button onClick={onClose} disabled={saving}>Cancel</Button>
				<Button type="submit" variant="contained" disabled={saving || !name.trim()}>
					{saving ? 'Saving...' : 'Save'}
				</Button>
			</DialogActions>
		</Dialog>
	)
}
