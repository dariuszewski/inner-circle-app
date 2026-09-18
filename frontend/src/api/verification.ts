type VerificationResponse = {
    detail: string;
};

export async function verifyVerificationToken(token: string): Promise<VerificationResponse> {
    const response = await fetch(`/api/users/verify/${encodeURIComponent(token)}`);

    if (!response.ok) {
        let message = 'Verification failed';
        try {
            const body = await response.json();
            if (typeof body?.detail === 'string') {
                message = body.detail;
            }
        } catch {
            // keep the generic message if the body isn't JSON
        }
        throw new Error(message);
    }

    return response.json();
}
