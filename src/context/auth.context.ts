import { createContext } from 'react'

export interface SessionUser {
  name: string
  email: string
}

export interface StoredUser extends SessionUser {
  password: string
}

export interface PendingUser {
  name: string
  email: string
}

export interface AuthContextValue {
  user: SessionUser | null
  pending: PendingUser | null
  otp: string | null
  startLogin: (email: string, password: string) => void
  startRegister: (name: string, email: string, password: string) => void
  verifyOtp: (code: string) => void
  resendOtp: () => void
  cancelVerification: () => void
  logout: () => void
}

export const AuthContext = createContext<AuthContextValue | null>(null)
