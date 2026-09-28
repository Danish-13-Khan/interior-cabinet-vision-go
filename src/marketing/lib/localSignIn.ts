export const LOCAL_PASSWORD_MIN = 8

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

export function validLocalCredentials(email: string, password: string): boolean {
  return EMAIL_PATTERN.test(email.trim()) && password.length >= LOCAL_PASSWORD_MIN
}

/** Only in-app paths are honoured as a post-login destination. */
export function postLoginPath(from: unknown): string {
  return typeof from === 'string' && from.startsWith('/app') ? from : '/app'
}
