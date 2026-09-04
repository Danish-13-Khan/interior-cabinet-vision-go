import { ThemeSwitcher } from './ThemeSwitcher'
import { useTheme } from '../lib/theme'

export function ThemeSwitchPanel() {
  const { theme } = useTheme()
  const desc =
    theme === 'calm'
      ? 'Spacious hero, guided canvas — great for demos and first-time sellers.'
      : 'Jobs table + sidebar filters — built for high-volume showroom days.'

  return (
    <div className="theme-switch-panel">
      <div className="ts-heading">Layout preference</div>
      <ThemeSwitcher size="lg" showSubs />
      <p className="ts-desc">{desc}</p>
    </div>
  )
}
