export type VerificationRequestResponse = {
    detail: string;
    verification_link: string | null;
};

async function parseError(response: Response, fallback: string): Promise<Error> {
    try {
        const body = await response.json();
        if (typeof body?.detail === 'string') {
            return new Error(body.detail);
        }
    } catch {
        // response body was not JSON, fall through to the generic message
    }
    return new Error(fallback);
}

export async function requestAccountDeletion(accessToken: string): Promise<VerificationRequestResponse> {
    const response = await fetch('/api/users/account-deletion', {
        method: 'POST',
        headers: {
            Authorization: `Bearer ${accessToken}`,
        },
    });

    if (!response.ok) {
        throw await parseError(response, 'Failed to request account deletion');
    }

    return response.json();
}
