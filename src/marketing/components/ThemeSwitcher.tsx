import { useTheme, type ThemeId } from '../lib/theme'

type Props = {
  size?: 'sm' | 'lg'
  showSubs?: boolean
  className?: string
}

export function ThemeSwitcher({ size = 'sm', showSubs = false, className = '' }: Props) {
  const { theme, setTheme } = useTheme()

  const select = (t: ThemeId) => {
    if (t !== theme) setTheme(t)
  }

  return (
    <div
      className={`theme-switcher ${size === 'lg' ? 'theme-switcher-lg' : ''} ${className}`.trim()}
      data-theme={theme}
      role="group"
      aria-label="Interface theme"
    >
      <span className="theme-switcher-thumb" aria-hidden="true" />
      <button
        type="button"
        className={theme === 'calm' ? 'is-active' : undefined}
        aria-pressed={theme === 'calm'}
        onClick={() => select('calm')}
      >
        {showSubs ? (
          <>
            <span className="ts-label">Calm</span>
            <span className="ts-sub">Spacious · guided</span>
          </>
        ) : (
          'Calm'
        )}
      </button>
      <button
        type="button"
        className={theme === 'compact' ? 'is-active' : undefined}
        aria-pressed={theme === 'compact'}
        onClick={() => select('compact')}
      >
        {showSubs ? (
          <>
            <span className="ts-label">Compact</span>
            <span className="ts-sub">Dense · ops-grade</span>
          </>
        ) : (
          'Compact'
        )}
      </button>
    </div>
  )
}
