import {
  type ReactNode,
  useEffect,
  useState,
} from 'react'

import { getCurrentUser, logout, refreshAccessToken } from '../api/auth'
import type { UserResponsePrivate } from '../types/userResponse'
import { AuthContext } from './auth-context'

export function AuthProvider({ children }: {children: ReactNode}) {
  const [user, setUser] = useState<UserResponsePrivate | null>(null);
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true); // session restore in progress

  useEffect(() => {
    async function restoreSession() {
      const refreshToken = localStorage.getItem("refresh_token")

      if (!refreshToken) {
        setIsLoading(false);
        return;
      }

      try {
        const tokens = await refreshAccessToken(refreshToken);
        localStorage.setItem("refresh_token", tokens.refresh_token);

        const currentUser = await getCurrentUser(tokens.access_token);

        setAccessToken(tokens.access_token);
        setUser(currentUser);
      } catch {
        localStorage.removeItem("refresh_token");
        setAccessToken(null);
        setUser(null)
      } finally {
        setIsLoading(false);
      }
    }
    restoreSession();
  }, [])

  function updateAccessToken(token: string) {
    setAccessToken(token);
  }

  function loginUser(user: UserResponsePrivate, accessToken: string) {
    // this just sets up the internal state
    setUser(user);
    setAccessToken(accessToken);
    setIsLoading(false);
  }

  async function logoutUser() {
    const refreshToken = localStorage.getItem("refresh_token");

    try {
      if (refreshToken) {
        await logout(refreshToken);
      }
    } finally {
      localStorage.removeItem("refresh_token");
      setUser(null);
      setAccessToken(null);
      setIsLoading(false);
    }
  }

  return (
    <AuthContext.Provider value={{
      user,
      accessToken,
      isLoading,
      loginUser,
      logoutUser,
      updateAccessToken,
    }}>
      {children}
    </AuthContext.Provider>
  );
}