import { Padel1ModuleNav } from '@/components/padel1/module-nav'
import { ProductChrome } from '@/components/shell/product-chrome'

export default function Padel1ModuleLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <ProductChrome
      eyebrow="Padel One HQ"
      title="Padel One HQ"
      nav={<Padel1ModuleNav />}
    >
      {children}
    </ProductChrome>
  )
}
