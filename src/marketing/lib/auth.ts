import type { ThemeId } from './theme'

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
}

export function clearSession(): void {
  localStorage.removeItem(SESSION_KEY)
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
