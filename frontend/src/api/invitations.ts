type InvitationResponse = {
	invitation_token: string
}

async function getError(response: Response, fallback: string): Promise<Error> {
	try {
		const body = await response.json()
		if (typeof body?.detail === 'string') {
			return new Error(body.detail)
		}
	} catch {
		// Fall through when the response is not JSON.
	}

	return new Error(fallback)
}

export async function createInvitation(
	collectionId: number | string,
	accessToken: string,
): Promise<string> {
	const response = await fetch(
		`/api/collections/create-invitation/${collectionId}`,
		{
			method: 'POST',
			headers: { Authorization: `Bearer ${accessToken}` },
		},
	)

	if (!response.ok) {
		throw await getError(response, 'Unable to create an invitation.')
	}

	const data = (await response.json()) as InvitationResponse
	return data.invitation_token
}

export async function acceptInvitation(
	token: string,
	accessToken: string,
): Promise<void> {
	const response = await fetch(
		`/api/collections/accept-invitation/${encodeURIComponent(token)}`,
		{
			method: 'PUT',
			headers: { Authorization: `Bearer ${accessToken}` },
		},
	)

	if (!response.ok) {
		throw await getError(response, 'Unable to accept this invitation.')
	}
}