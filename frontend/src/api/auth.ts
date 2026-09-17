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
