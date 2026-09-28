export const LOCAL_PASSWORD_MIN = 8

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

export type LocalSignInEnv = { dev: boolean; desktop: boolean; flag?: string }

/** Local sign-in has no server: allowed in the dev server, the desktop app, or with VITE_LOCAL_AUTH=true. */
export function localSignInEnabled(env: LocalSignInEnv): boolean {
  return env.dev || env.desktop || env.flag === 'true'
}

export function validLocalCredentials(email: string, password: string): boolean {
  return EMAIL_PATTERN.test(email.trim()) && password.length >= LOCAL_PASSWORD_MIN
}

/** Only in-app paths are honoured as a post-login destination. */
export function postLoginPath(from: unknown): string {
  return typeof from === 'string' && from.startsWith('/app') ? from : '/app'
}
