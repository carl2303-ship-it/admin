import { BoostModuleNav } from '@/components/boost/module-nav'
import { BoostLegacyFallback } from '@/components/boost/legacy-fallback'
import { ProductChrome } from '@/components/shell/product-chrome'

export default function BoostModuleLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <ProductChrome
      eyebrow="Boost Store"
      title="Boost Store"
      nav={<BoostModuleNav />}
    >
      {children}
      <div className="mt-6">
        <BoostLegacyFallback />
      </div>
    </ProductChrome>
  )
}
