import type { PaginatedResponse } from "../types/collectionResponse";
import type { UserResponsePrivate, UserResponsePublic } from "../types/userResponse";

// Backend maximum for per_page.
const USERS_PER_PAGE = 50;

export type VerificationRequestResponse = {
    detail: string;
};

export type UserUpdateRequestBody = {
    username: string;
    profile_image?: File;
};

async function parseError(response: Response, fallback: string): Promise<Error> {
    try {
        const body = await response.json();
        if (typeof body?.detail === 'string') {
            return new Error(body.detail);
        }
        // FastAPI validation errors (422) return detail as a list
        if (typeof body?.detail?.[0]?.msg === 'string') {
            return new Error(body.detail[0].msg);
        }
    } catch {
        // response body was not JSON, fall through to the generic message
    }
    return new Error(fallback);
}

export async function getAllUsers(accessToken: string, signal?: AbortSignal): Promise<UserResponsePublic[]> {
    const users: UserResponsePublic[] = [];
    let page = 1;
    let totalPages = 1;

    while (page <= totalPages) {
        const response = await fetch(`/api/users?page=${page}&per_page=${USERS_PER_PAGE}`, {
            headers: {
                Authorization: `Bearer ${accessToken}`,
            },
            signal,
        });

        if (!response.ok) {
            throw await parseError(response, 'Failed to fetch users');
        }

        const body = (await response.json()) as PaginatedResponse<UserResponsePublic>;
        users.push(...body.items);
        totalPages = body.total_pages;
        page += 1;
    }

    return users;
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

export async function updateUserRequest(accessToken: string, bodyData: UserUpdateRequestBody): Promise<UserResponsePrivate> {
    // validation
    if (bodyData.username.trim().length < 3) {
        throw new Error("Username is too short.");
    }
    if (bodyData.username.trim().length > 30) {
        throw new Error("Username is too long.");
    }
    const formData = new FormData();
    formData.append('username', bodyData.username);
    if (bodyData.profile_image) {
        formData.append('profile_image', bodyData.profile_image);
    }
    
    const response = await fetch('/api/users/update', {
        method: 'PATCH',
        headers: {
            Authorization: `Bearer ${accessToken}`,
        },
        body: formData
    });

    if (!response.ok) {
        throw await parseError(response, 'Failed to fetch user data');
    }

    return response.json();
}