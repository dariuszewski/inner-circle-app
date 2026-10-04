import type { UserResponsePrivate } from '../types/userResponse'

type LoginInput = {
    username: string;
    password: string;
};

type TokenResponse = {
    access_token: string;
    refresh_token: string;
    token_type: string;
};

type RegisterInput = {
    username: string;
    password: string;
    password2: string;
    email?: string;
};

type RegisterResponse = {
    detail: string;
    verification_link: string | null;
};

export async function getCurrentUser(accessToken: string): Promise<UserResponsePrivate> {
    const response = await fetch("/api/users/me", {
        headers: {
            Authorization: `Bearer ${accessToken}`
        }
    });

    if (!response.ok) {
        throw new Error("Could not fetch current user");
    }

    return response.json()
}

export async function login({ username, password }: LoginInput): Promise<TokenResponse> {

    const body = new URLSearchParams({ username, password });

    const response = await fetch('/api/users/token', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/x-www-form-urlencoded'
        },
        body,
    });

    if (!response.ok) {
        throw new Error('Login failed');
    }
    
    return response.json();
}

export async function refreshAccessToken(refreshToken: string): Promise<TokenResponse> {
    const response = await fetch('/api/users/refresh', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({ refresh_token: refreshToken })
    });

    if (!response.ok) {
        throw new Error('Failed to refresh access token');
    }

    return response.json();
}


export async function logout(refreshToken: string): Promise<void> {
    const response = await fetch('/api/users/logout', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({ refresh_token: refreshToken })
    });

    if (!response.ok) {
        throw new Error('Failed to logout');
    }
}

export async function register({ username, password, password2, email }: RegisterInput): Promise<RegisterResponse> {
    const response = await fetch('/api/users/register', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({ username, password, password2, email })
    });

    if (!response.ok) {
        throw new Error('Registration failed');
    }

    return response.json();
}

async function getErrorMessage(response: Response, fallback: string): Promise<string> {
    try {
        const body = await response.json();
        if (typeof body?.detail === 'string') {
            return body.detail;
        }
    } catch {
        // body was not JSON, use the fallback
    }
    return fallback;
}

export async function requestPasswordReset(email: string): Promise<RegisterResponse> {
    const response = await fetch('/api/users/reset-password', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({ email })
    });

    if (!response.ok) {
        throw new Error(await getErrorMessage(response, 'Could not request a password reset'));
    }

    return response.json();
}

export async function confirmPasswordReset(
    { token, password, password2 }: { token: string; password: string; password2: string },
): Promise<void> {
    const response = await fetch('/api/users/reset-password/confirm', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({ token, password, password2 })
    });

    if (!response.ok) {
        throw new Error(await getErrorMessage(response, 'Could not reset the password'));
    }
}