import { SportsEventsModuleNav } from '@/components/sportsevents/module-nav'
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
    </ProductChrome>
  )
}
