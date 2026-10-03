
import type {
  CollectionDetailedRetrieve,
  CollectionRetrieve,
  PaginatedResponse,
} from '../types/collectionResponse'

type CreateCollectionRequest = {
  name: string
  description?: string | null
  accessToken?: string | null
}

type GetCollectionRequest = {
  collectionId: string
  accessToken: string
  signal?: AbortSignal | null
}

type GetCollectionsRequest = {
  page: number
  pageSize: number
  accessToken: string
  signal?: AbortSignal | null
}


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

async function createCollection({ name, description, accessToken }: CreateCollectionRequest) {
  const response = await fetch('/api/collections', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${accessToken}`,
    },
    body: JSON.stringify({
      name,
      description,
    }),
  })

  if (!response.ok) {
    throw await parseError(response, `HTTP error! Status: ${response.status}`)
  }

  return await response.json()
}

async function getCollection({ collectionId, accessToken, signal }: GetCollectionRequest): Promise<CollectionDetailedRetrieve> {
  const response = await fetch(`/api/collections/${collectionId}`, {
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
    signal,
  })

  if (!response.ok) {
    throw new Error(`HTTP error! Status: ${response.status}`)
  }

  return (await response.json()) as CollectionDetailedRetrieve
}

async function getCollections({ page, pageSize, accessToken, signal }: GetCollectionsRequest): Promise<PaginatedResponse<CollectionRetrieve>> {
  const response = await fetch(
    `/api/collections?page=${page}&per_page=${pageSize}`,
    {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
      signal,
    },
  )

  if (!response.ok) {
    throw new Error(`HTTP error! Status: ${response.status}`)
  }

  return (await response.json()) as PaginatedResponse<CollectionRetrieve>
}

export { createCollection, getCollection, getCollections }