import { useEffect, useState } from 'react'

import { useAuth } from '../providers/useAuth'
import type { CollectionRetrieve, PaginatedResponse } from '../types/collectionResponse'

type CollectionsState = {
  data: PaginatedResponse<CollectionRetrieve> | null
  isLoading: boolean
  error: string | null
}

export function useCollections(): CollectionsState {
  const auth = useAuth()
  const [state, setState] = useState<CollectionsState>({
    data: null,
    isLoading: true,
    error: null,
  })

  useEffect(() => {
    if (!auth.accessToken) return

    let cancelled = false

    async function fetchCollections() {
      try {
        const response = await fetch('/api/collections', {
          headers: { Authorization: `Bearer ${auth.accessToken}` },
        })

        if (!response.ok) {
          throw new Error(`HTTP error! Status: ${response.status}`)
        }

        const data = await response.json() as PaginatedResponse<CollectionRetrieve>

        if (!cancelled) {
          setState({ data, isLoading: false, error: null })
        }
      } catch (error) {
        if (!cancelled) {
          setState({
            data: null,
            isLoading: false,
            error: error instanceof Error ? error.message : 'An unknown error occurred',
          })
        }
      }
    }

    fetchCollections()

    return () => {
      cancelled = true
    }
  }, [auth.accessToken])

  return state
}
