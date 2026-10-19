import { SportsEventsModuleNav } from '@/components/sportsevents/module-nav'
import { SportsEventsLegacyFallback } from '@/components/sportsevents/legacy-fallback'
import { ProductChrome } from '@/components/shell/product-chrome'

export default function SportsEventsModuleLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <ProductChrome
      eyebrow="SportsEvents ERP"
      title="SportsEvents"
      nav={<SportsEventsModuleNav />}
    >
      {children}
      <div className="mt-6">
        <SportsEventsLegacyFallback />
      </div>
    </ProductChrome>
  )
}
