import { describe, expect, it } from 'vitest'
import { localSignInEnabled, postLoginPath, validLocalCredentials } from './localSignIn'

describe('localSignIn', () => {
  it('is enabled for the dev server, desktop app or explicit flag', () => {
    expect(localSignInEnabled({ dev: true, desktop: false })).toBe(true)
    expect(localSignInEnabled({ dev: false, desktop: true })).toBe(true)
    expect(localSignInEnabled({ dev: false, desktop: false, flag: 'true' })).toBe(true)
    expect(localSignInEnabled({ dev: false, desktop: false })).toBe(false)
  })

  it('accepts a valid email and a password of at least 8 characters', () => {
    expect(validLocalCredentials(' me@showroom.com ', 'local-demo-pass')).toBe(true)
    expect(validLocalCredentials('me@showroom.com', 'short')).toBe(false)
    expect(validLocalCredentials('not-an-email', 'local-demo-pass')).toBe(false)
    expect(validLocalCredentials('', '')).toBe(false)
  })

  it('only returns to in-app paths after login', () => {
    expect(postLoginPath('/app')).toBe('/app')
    expect(postLoginPath('/app/projects')).toBe('/app/projects')
    expect(postLoginPath('/register')).toBe('/app')
    expect(postLoginPath(undefined)).toBe('/app')
  })
})
