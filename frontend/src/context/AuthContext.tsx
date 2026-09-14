import { createContext, useContext, useMemo, useState, type ReactNode } from 'react'
import type { AuthResponse } from '../types'

interface AuthContextValue {
  auth: AuthResponse | null
  signIn: (auth: AuthResponse) => void
  signOut: () => void
}

const STORAGE_KEY = 'issue-tracker-auth'
const AuthContext = createContext<AuthContextValue | null>(null)

function readStoredAuth(): AuthResponse | null {
  const raw = localStorage.getItem(STORAGE_KEY)
  if (!raw) return null
  try {
    return JSON.parse(raw) as AuthResponse
  } catch {
    localStorage.removeItem(STORAGE_KEY)
    return null
  }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [auth, setAuth] = useState<AuthResponse | null>(() => readStoredAuth())

  const value = useMemo<AuthContextValue>(() => ({
    auth,
    signIn: (nextAuth) => {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(nextAuth))
      setAuth(nextAuth)
    },
    signOut: () => {
      localStorage.removeItem(STORAGE_KEY)
      setAuth(null)
    },
  }), [auth])

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) throw new Error('useAuth must be used inside AuthProvider')
  return context
}
