import { useCallback, useEffect, useState } from 'react'

import { getCollections } from '../api/collection'
import { useAuth } from '../providers/useAuth'
import type {
  CollectionRetrieve,
  PaginatedResponse,
} from '../types/collectionResponse'

type CollectionsState = {
  data: PaginatedResponse<CollectionRetrieve> | null
  isLoading: boolean
  error: string | null
  refetch: () => Promise<void>
}

export function useCollections(
  page: number,
  pageSize: number = 4,
): CollectionsState {
  const auth = useAuth()

  const [state, setState] = useState<{
    data: PaginatedResponse<CollectionRetrieve> | null
    isLoading: boolean
    error: string | null
  }>({
    data: null,
    isLoading: true,
    error: null,
  })

  const fetchCollections = useCallback(async () => {
    if (!auth.accessToken) return

    const data = await getCollections({
      page,
      pageSize,
      accessToken: auth.accessToken,
    })

    setState({
      data,
      isLoading: false,
      error: null,
    })
  }, [auth.accessToken, page, pageSize])

  const refetch = useCallback(async () => {
    try {
      setState((previous) => ({
        ...previous,
        isLoading: true,
        error: null,
      }))

      await fetchCollections()
    } catch (error) {
      setState({
        data: null,
        isLoading: false,
        error:
          error instanceof Error
            ? error.message
            : 'An unknown error occurred',
      })
    }
  }, [fetchCollections])

  useEffect(() => {
    let cancelled = false

    async function loadCollections() {
      try {
        if (!auth.accessToken) return

        const data = await getCollections({
          page,
          pageSize,
          accessToken: auth.accessToken,
        })

        if (!cancelled) {
          setState({
            data,
            isLoading: false,
            error: null,
          })
        }
      } catch (error) {
        if (!cancelled) {
          setState({
            data: null,
            isLoading: false,
            error:
              error instanceof Error
                ? error.message
                : 'An unknown error occurred',
          })
        }
      }
    }

    loadCollections()

    return () => {
      cancelled = true
    }
  }, [auth.accessToken, page, pageSize])

  return {
    ...state,
    refetch,
  }
}