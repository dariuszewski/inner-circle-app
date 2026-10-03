
import { useCallback, useEffect, useRef, useState } from 'react'

import { getCollection } from '../api/collection'
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
  const activeRequest = useRef<AbortController | null>(null)

  const loadCollection = useCallback(async () => {
    if (!auth.accessToken || !collectionId) return

    activeRequest.current?.abort()
    const controller = new AbortController()
    activeRequest.current = controller

    try {
      const data = await getCollection({
        collectionId,
        accessToken: auth.accessToken,
        signal: controller.signal,
      })

      if (!controller.signal.aborted) {
        setState({
          data,
          isLoading: false,
          error: null,
        })
      }
    } catch (error) {
      if (!controller.signal.aborted) {
        setState({
          data: null,
          isLoading: false,
          error:
            error instanceof Error
              ? error.message
              : 'An unknown error occurred',
        })
      }
    } finally {
      if (activeRequest.current === controller) {
        activeRequest.current = null
      }
    }
  }, [auth.accessToken, collectionId])

  const refetch = useCallback(async () => {
    setState((previous) => ({
      ...previous,
      isLoading: true,
      error: null,
    }))

    await loadCollection()
  }, [loadCollection])

  useEffect(() => {
    const timer = setTimeout(() => void loadCollection(), 0)

    return () => {
      clearTimeout(timer)
      activeRequest.current?.abort()
    }
  }, [loadCollection])

  return {
    ...state,
    refetch,
  }
}