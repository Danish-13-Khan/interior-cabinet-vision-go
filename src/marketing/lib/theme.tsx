import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react'

export type ThemeId = 'calm' | 'compact'

export const THEME_KEY = 'cabinetStudioTheme'

type ThemeContextValue = {
  theme: ThemeId
  setTheme: (t: ThemeId) => void
  toggleTheme: () => void
}

const ThemeContext = createContext<ThemeContextValue | null>(null)

function readStoredTheme(): ThemeId {
  try {
    const v = localStorage.getItem(THEME_KEY)
    if (v === 'calm' || v === 'compact') return v
  } catch {
    /* ignore */
  }
  return 'calm'
}

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setThemeState] = useState<ThemeId>(() =>
    typeof window !== 'undefined' ? readStoredTheme() : 'calm',
  )

  const setTheme = useCallback((t: ThemeId) => {
    setThemeState(t)
    try {
      localStorage.setItem(THEME_KEY, t)
    } catch {
      /* ignore */
    }
  }, [])

  const toggleTheme = useCallback(() => {
    setTheme(theme === 'calm' ? 'compact' : 'calm')
  }, [theme, setTheme])

  useEffect(() => {
    document.documentElement.dataset.theme = theme
  }, [theme])

  const value = useMemo(
    () => ({ theme, setTheme, toggleTheme }),
    [theme, setTheme, toggleTheme],
  )

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>
}

export function useTheme(): ThemeContextValue {
  const ctx = useContext(ThemeContext)
  if (!ctx) throw new Error('useTheme must be used within ThemeProvider')
  return ctx
}
