import { BoostModuleNav } from '@/components/boost/module-nav'
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
    </ProductChrome>
  )
}
