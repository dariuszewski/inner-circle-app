import { useEffect, useState } from 'react'

import { useAuth } from '../providers/useAuth'

const imageCache = new Map<string, string>()

export function useProtectedMedia(url?: string | null) {
  const auth = useAuth()
  const cachedImage = url ? imageCache.get(url) ?? null : null
  const [imageUrl, setImageUrl] = useState<string | null>(cachedImage)

  useEffect(() => {
    if (!url || !auth.accessToken) {
      return
    }

    const cached = imageCache.get(url)

    if (cached) {
      return
    }

    const imageUrl = url
    const controller = new AbortController()

    async function fetchImage() {
      try {
        const response = await fetch(imageUrl, {
          headers: {
            Authorization: `Bearer ${auth.accessToken}`,
          },
          signal: controller.signal,
        })

        if (!response.ok) {
          throw new Error(`Failed to load image: ${response.status}`)
        }

        const blob = await response.blob()
        const objectUrl = URL.createObjectURL(blob)

        imageCache.set(imageUrl, objectUrl)
        setImageUrl(objectUrl)
      } catch (error) {
        if (error instanceof DOMException && error.name === 'AbortError') {
          return
        }

        setImageUrl(null)
      }
    }

    fetchImage()

    return () => {
      controller.abort()
    }
  }, [url, auth.accessToken])

  return cachedImage ?? imageUrl
}