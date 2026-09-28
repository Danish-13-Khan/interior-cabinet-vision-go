import { createContext, useContext, useEffect, type ReactNode } from 'react'

export type ThemeId = 'calm'

type ThemeContextValue = {
  theme: ThemeId
}

const VALUE: ThemeContextValue = { theme: 'calm' }

const ThemeContext = createContext<ThemeContextValue | null>(null)

export function ThemeProvider({ children }: { children: ReactNode }) {
  useEffect(() => {
    document.documentElement.dataset.theme = VALUE.theme
  }, [])

  return <ThemeContext.Provider value={VALUE}>{children}</ThemeContext.Provider>
}

export function useTheme(): ThemeContextValue {
  const ctx = useContext(ThemeContext)
  if (!ctx) throw new Error('useTheme must be used within ThemeProvider')
  return ctx
}
