import { createContext } from 'react'

import type { UserResponsePrivate } from '../types/userResponse'

export type AuthContextType = {
  user: UserResponsePrivate | null;
  accessToken: string | null;
  isLoading: boolean;
  loginUser: (user: UserResponsePrivate, accessToken: string) => void;
  logoutUser: () => void;
  updateAccessToken: (token: string) => void;
  updateUser: (user: UserResponsePrivate) => void;
}

export const AuthContext = createContext<AuthContextType | undefined>(undefined)
