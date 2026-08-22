import { useCallback, useMemo, useState, type ReactNode } from 'react'
import {
  AuthContext,
  type PendingUser,
  type SessionUser,
  type StoredUser,
} from './auth.context'

const USERS_KEY = 'crm_users'
const SESSION_KEY = 'crm_session'
const PENDING_KEY = 'crm_pending_verification'
const OTP_KEY = 'crm_otp_code'

const DEMO_USER: StoredUser = {
  name: 'Alex Torres',
  email: 'demo@bigdata.io',
  password: 'demo123',
}

function readUsers(): StoredUser[] {
  try {
    const raw = localStorage.getItem(USERS_KEY)
    if (!raw) return []
    const parsed = JSON.parse(raw)
    return Array.isArray(parsed) ? parsed : []
  } catch {
    return []
  }
}

function writeUsers(users: StoredUser[]) {
  localStorage.setItem(USERS_KEY, JSON.stringify(users))
}

const LEGACY_DEMO_EMAILS = ['demo@verdecrm.com', 'demo@datascope.io']

function ensureDemoUser() {
  const users = readUsers()
    .filter(
      (u) =>
        !LEGACY_DEMO_EMAILS.includes(u.email.toLowerCase()) &&
        u.email.toLowerCase() !== DEMO_USER.email.toLowerCase(),
    )
  users.unshift(DEMO_USER)
  writeUsers(users)
}

function readSession(): SessionUser | null {
  try {
    const raw = localStorage.getItem(SESSION_KEY)
    return raw ? (JSON.parse(raw) as SessionUser) : null
  } catch {
    return null
  }
}

function readPending(): PendingUser | null {
  try {
    const raw = localStorage.getItem(PENDING_KEY)
    return raw ? (JSON.parse(raw) as PendingUser) : null
  } catch {
    return null
  }
}

function readOtp(): string | null {
  try {
    const raw = localStorage.getItem(OTP_KEY)
    return raw ? (JSON.parse(raw) as string) : null
  } catch {
    return null
  }
}

function generateOtp(): string {
  return Math.floor(100000 + Math.random() * 900000).toString()
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<SessionUser | null>(() => {
    ensureDemoUser()
    return readSession()
  })
  const [pending, setPending] = useState<PendingUser | null>(() => readPending())
  const [otp, setOtp] = useState<string | null>(() => readOtp())

  const issueOtp = useCallback((target: PendingUser) => {
    const code = generateOtp()
    localStorage.setItem(PENDING_KEY, JSON.stringify(target))
    localStorage.setItem(OTP_KEY, JSON.stringify(code))
    setPending(target)
    setOtp(code)
  }, [])

  const startLogin = useCallback(
    (email: string, password: string) => {
      const normalized = email.trim().toLowerCase()
      const found = readUsers().find((u) => u.email.toLowerCase() === normalized)
      if (!found || found.password !== password) {
        throw new Error('Correo o contraseña incorrectos.')
      }
      issueOtp({ name: found.name, email: found.email })
    },
    [issueOtp],
  )

  const startRegister = useCallback(
    (name: string, email: string, password: string) => {
      const normalized = email.trim().toLowerCase()
      const users = readUsers()
      if (users.some((u) => u.email.toLowerCase() === normalized)) {
        throw new Error('Ya existe una cuenta con este correo.')
      }
      const newUser: StoredUser = {
        name: name.trim(),
        email: normalized,
        password,
      }
      writeUsers([...users, newUser])
      issueOtp({ name: newUser.name, email: newUser.email })
    },
    [issueOtp],
  )

  const verifyOtp = useCallback(
    (code: string) => {
      if (!pending || !otp) {
        throw new Error('No hay una verificación activa. Inicia sesión de nuevo.')
      }
      if (code !== otp) {
        throw new Error('El código es incorrecto. Verifica e inténtalo de nuevo.')
      }
      const session: SessionUser = { name: pending.name, email: pending.email }
      localStorage.setItem(SESSION_KEY, JSON.stringify(session))
      localStorage.removeItem(PENDING_KEY)
      localStorage.removeItem(OTP_KEY)
      setPending(null)
      setOtp(null)
      setUser(session)
    },
    [pending, otp],
  )

  const resendOtp = useCallback(() => {
    if (pending) issueOtp(pending)
  }, [pending, issueOtp])

  const cancelVerification = useCallback(() => {
    localStorage.removeItem(PENDING_KEY)
    localStorage.removeItem(OTP_KEY)
    setPending(null)
    setOtp(null)
  }, [])

  const logout = useCallback(() => {
    localStorage.removeItem(SESSION_KEY)
    setUser(null)
  }, [])

  const value = useMemo(
    () => ({
      user,
      pending,
      otp,
      startLogin,
      startRegister,
      verifyOtp,
      resendOtp,
      cancelVerification,
      logout,
    }),
    [
      user,
      pending,
      otp,
      startLogin,
      startRegister,
      verifyOtp,
      resendOtp,
      cancelVerification,
      logout,
    ],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}
