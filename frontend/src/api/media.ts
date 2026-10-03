import type {
  MediaRetrieveDetailed,
  ReactionType,
} from '../types/collectionResponse'

type MediaRequestOptions = Omit<RequestInit, 'headers'> & {
  headers?: Record<string, string>
}

async function mediaRequest(
  url: string,
  accessToken: string,
  options: MediaRequestOptions = {},
) {
  const response = await fetch(url, {
    ...options,
    headers: {
      Authorization: `Bearer ${accessToken}`,
      ...options.headers,
    },
  })

  if (!response.ok) {
    const error = await response.json().catch(() => null)
    throw new Error(error?.detail ?? `HTTP error! Status: ${response.status}`)
  }

  return response
}

export async function getMediaDetails({
  mediaId,
  accessToken,
  signal,
}: {
  mediaId: number
  accessToken: string
  signal?: AbortSignal
}) {
  const response = await mediaRequest(`/api/media/${mediaId}`, accessToken, {
    signal,
  })
  return (await response.json()) as MediaRetrieveDetailed
}

export async function createMediaComment({
  mediaId,
  content,
  accessToken,
}: {
  mediaId: number
  content: string
  accessToken: string
}) {
  await mediaRequest(`/api/media/comment/${mediaId}`, accessToken, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ content }),
  })
}

export async function deleteMediaComment({
  commentId,
  accessToken,
}: {
  commentId: number
  accessToken: string
}) {
  await mediaRequest(`/api/media/comment/${commentId}`, accessToken, {
    method: 'DELETE',
  })
}

export async function createMediaReaction({
  mediaId,
  type,
  accessToken,
}: {
  mediaId: number
  type: ReactionType
  accessToken: string
}) {
  await mediaRequest(`/api/media/react/${mediaId}`, accessToken, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ type }),
  })
}

export async function deleteMediaReaction({
  mediaId,
  accessToken,
}: {
  mediaId: number
  accessToken: string
}) {
  await mediaRequest(`/api/media/react/${mediaId}`, accessToken, {
    method: 'DELETE',
  })
}

export async function uploadMedia({
  collectionId,
  files,
  accessToken,
}: {
  collectionId: string | number
  files: File[]
  accessToken: string
}) {
  const formData = new FormData()

  for (const file of files) {
    formData.append('files', file)
  }

  const response = await fetch(
    `/api/media?collection_id=${collectionId}`,
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
      body: formData,
    },
  )

  if (!response.ok) {
    const error = await response.json().catch(() => null)

    throw new Error(
      error?.detail ?? `HTTP error! Status: ${response.status}`,
    )
  }
  return response.json()
}

export async function deleteMedia({
  mediaId,
  accessToken,
}: {
  mediaId: number
  accessToken: string
}) {
  const response = await fetch(`/api/media/${mediaId}`, {
    method: 'DELETE',
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  })

  if (!response.ok) {
    const error = await response.json().catch(() => null)
    throw new Error(error?.detail ?? `HTTP error! Status: ${response.status}`)
  }
}