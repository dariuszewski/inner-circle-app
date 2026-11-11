
import type { CollectionFilters } from '../types/collectionFilters'
import type {
  CollectionDetailedRetrieve,
  CollectionRetrieve,
  PaginatedResponse,
} from '../types/collectionResponse'
import type { MediaFilters } from '../types/mediaFilters'

// Backend maximum for per_page.
const MEDIA_PER_PAGE = 50

type CreateCollectionRequest = {
  name: string
  description?: string | null
  accessToken?: string | null
}

type GetCollectionRequest = {
  collectionId: string
  accessToken: string
  filters?: MediaFilters
  signal?: AbortSignal | null
}

type GetCollectionsRequest = {
  page: number
  pageSize: number
  accessToken: string
  filters?: CollectionFilters
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
  if (name.length > 50) {
    throw new Error('Name must be at most 50 characters long.')
  }
  if (description && description.length > 300) {
    throw new Error('Description must be at most 300 characters long.')
  }

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

async function getCollection({ collectionId, accessToken, filters, signal }: GetCollectionRequest): Promise<CollectionDetailedRetrieve> {
  const params = new URLSearchParams({ per_page: String(MEDIA_PER_PAGE) })
  if (filters) {
    params.set('sort_by', `${filters.order === 'desc' ? '-' : ''}${filters.sort}`)
    // Local day boundaries, sent as UTC instants.
    if (filters.from) {
      params.set('uploaded_at_from', new Date(`${filters.from}T00:00:00`).toISOString())
    }
    if (filters.to) {
      params.set('uploaded_at_to', new Date(`${filters.to}T23:59:59.999`).toISOString())
    }
    filters.authorIds.forEach((id) => params.append('authors', String(id)))
    if (filters.mediaType) params.set('media_type', filters.mediaType)
  }

  const response = await fetch(`/api/collections/${collectionId}?${params}`, {
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

async function getCollections({ page, pageSize, accessToken, filters, signal }: GetCollectionsRequest): Promise<PaginatedResponse<CollectionRetrieve>> {
  const params = new URLSearchParams({ page: String(page), per_page: String(pageSize) })
  if (filters) {
    params.set('sort_by', `${filters.order === 'desc' ? '-' : ''}${filters.sort}`)
    // Local day boundaries, sent as UTC instants.
    if (filters.from) {
      params.set('created_at_from', new Date(`${filters.from}T00:00:00`).toISOString())
    }
    if (filters.to) {
      params.set('created_at_to', new Date(`${filters.to}T23:59:59.999`).toISOString())
    }
    if (filters.search.trim()) params.set('text_query', filters.search.trim())
    filters.memberIds.forEach((id) => params.append('collection_members', String(id)))
  }

  const response = await fetch(
    `/api/collections?${params}`,
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

async function updateCollection({
  collectionId,
  name,
  description,
  coverImageId,
  accessToken,
}: {
  collectionId: number | string
  name?: string
  description?: string | null
  coverImageId?: number
  accessToken: string
}): Promise<CollectionRetrieve> {
  if (name && name.length > 50) {
    throw new Error('Name must be at most 50 characters long.')
  }
  if (description && description.length > 300) {
    throw new Error('Description must be at most 300 characters long.')
  }

  const response = await fetch(`/api/collections/${collectionId}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${accessToken}`,
    },
    body: JSON.stringify({ name, description, cover_image_id: coverImageId }),
  })

  if (!response.ok) {
    throw await parseError(response, `HTTP error! Status: ${response.status}`)
  }

  return (await response.json()) as CollectionRetrieve
}

export { createCollection, getCollection, getCollections, updateCollection }