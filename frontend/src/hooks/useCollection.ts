
import { useCallback, useEffect, useState } from 'react'

import { useAuth } from '../providers/useAuth'
import type { CollectionDetailedRetrieve } from '../types/collectionResponse'

type CollectionState = {
  data: CollectionDetailedRetrieve | null
  isLoading: boolean
  error: string | null
  refetch: () => Promise<void>
}

export function useCollection(
  collectionId?: string,
): CollectionState {
  const auth = useAuth()

  const [state, setState] = useState<{
    data: CollectionDetailedRetrieve | null
    isLoading: boolean
    error: string | null
  }>({
    data: null,
    isLoading: true,
    error: null,
  })

  const fetchCollection = useCallback(async () => {
    if (!auth.accessToken || !collectionId) return

    const response = await fetch(
      `/api/collections/${collectionId}`,
      {
        headers: {
          Authorization: `Bearer ${auth.accessToken}`,
        },
      },
    )

    if (!response.ok) {
      throw new Error(`HTTP error! Status: ${response.status}`)
    }

    const data =
      (await response.json()) as CollectionDetailedRetrieve

    setState({
      data,
      isLoading: false,
      error: null,
    })
  }, [auth.accessToken, collectionId])

  const refetch = useCallback(async () => {
    try {
      setState((previous) => ({
        ...previous,
        isLoading: true,
        error: null,
      }))

      await fetchCollection()
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
  }, [fetchCollection])

  useEffect(() => {
    let cancelled = false

    async function loadCollection() {
      try {
        if (!auth.accessToken || !collectionId) return

        const response = await fetch(
          `/api/collections/${collectionId}`,
          {
            headers: {
              Authorization: `Bearer ${auth.accessToken}`,
            },
          },
        )

        if (!response.ok) {
          throw new Error(`HTTP error! Status: ${response.status}`)
        }

        const data =
          (await response.json()) as CollectionDetailedRetrieve

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

    loadCollection()

    return () => {
      cancelled = true
    }
  }, [auth.accessToken, collectionId])

  return {
    ...state,
    refetch,
  }
}