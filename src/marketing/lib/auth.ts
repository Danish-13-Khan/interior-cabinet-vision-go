import type { ThemeId } from './theme'
import {
  clearLocalAccount,
  ensureLocalAccountForSession,
} from '../../domain/saas'

export const SESSION_KEY = 'cabinetStudioSession'

export type Session = {
  email: string
  company?: string
  theme: ThemeId
  at: string
}

export function getSession(): Session | null {
  try {
    const raw = localStorage.getItem(SESSION_KEY)
    if (!raw) return null
    return JSON.parse(raw) as Session
  } catch {
    return null
  }
}

export function isLoggedIn(): boolean {
  return getSession() !== null
}

export function setSession(session: Session): void {
  localStorage.setItem(SESSION_KEY, JSON.stringify(session))
  // A0: keep SaaS account snapshot aligned with marketing identity (same auth stack).
  ensureLocalAccountForSession({
    email: session.email,
    company: session.company,
  })
}

export function clearSession(): void {
  localStorage.removeItem(SESSION_KEY)
  clearLocalAccount()
}

export function createSession(partial: {
  email: string
  company?: string
  theme: ThemeId
}): Session {
  const session: Session = {
    email: partial.email,
    company: partial.company,
    theme: partial.theme,
    at: new Date().toISOString(),
  }
  setSession(session)
  return session
}
