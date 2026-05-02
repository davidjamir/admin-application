'use client'

import { AUTH_SESSION_MAX_AGE_SECONDS } from "@/lib/auth/constants"

const SESSION_KEY = "bm-admin-session"
/** Same wall-clock window as JWT + `7forge_session` cookie (`AUTH_SESSION_MAX_AGE_SECONDS`). */
const SESSION_EXPIRY_MS = AUTH_SESSION_MAX_AGE_SECONDS * 1000

export const saveSession = (password: string) => {
  if (typeof window === "undefined") return
  const data = {
    password,
    expiresAt: Date.now() + SESSION_EXPIRY_MS,
  }
  localStorage.setItem(SESSION_KEY, JSON.stringify(data))
}

export const loadSession = (): string | null => {
  if (typeof window === "undefined") return null
  const saved = localStorage.getItem(SESSION_KEY)
  if (!saved) return null
  try {
    const data = JSON.parse(saved)
    if (Date.now() > data.expiresAt) {
      localStorage.removeItem(SESSION_KEY)
      return null
    }
    return data.password
  } catch {
    return null
  }
}

export const isSessionExpired = (): boolean => {
  if (typeof window === "undefined") return true
  const saved = localStorage.getItem(SESSION_KEY)
  if (!saved) return true
  try {
    const data = JSON.parse(saved)
    return Date.now() > data.expiresAt
  } catch {
    return true
  }
}

export const clearSession = () => {
  if (typeof window === "undefined") return
  localStorage.removeItem(SESSION_KEY)
}
