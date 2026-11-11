import { useEffect, useState } from 'react'

import { getAllUsers } from '../api/user'
import { useAuth } from '../providers/useAuth'
import type { UserResponsePublic } from '../types/userResponse'

type UsersState = {
  users: UserResponsePublic[]
  isLoading: boolean
}

// Loads lazily: nothing is fetched until `enabled` is true, and only once.
export function useUsers(enabled: boolean): UsersState {
  const auth = useAuth()
  const [users, setUsers] = useState<UserResponsePublic[] | null>(null)

  useEffect(() => {
    if (!enabled || users !== null || !auth.accessToken) return

    const controller = new AbortController()
    getAllUsers(auth.accessToken, controller.signal)
      .then(setUsers)
      .catch(() => {
        if (!controller.signal.aborted) setUsers([])
      })

    return () => controller.abort()
  }, [enabled, users, auth.accessToken])

  return { users: users ?? [], isLoading: enabled && users === null }
}
