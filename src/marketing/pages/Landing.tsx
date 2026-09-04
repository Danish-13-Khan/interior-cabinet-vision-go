import { MarketingShell } from '../components/MarketingShell'
import { useTheme } from '../lib/theme'
import { CalmLanding } from '../themes/calm/CalmLanding'
import { CompactLanding } from '../themes/compact/CompactLanding'

export function Landing() {
  const { theme } = useTheme()
  return (
    <MarketingShell>
      {theme === 'compact' ? <CompactLanding /> : <CalmLanding />}
    </MarketingShell>
  )
}
