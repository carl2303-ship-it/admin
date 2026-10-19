import { ProductChrome } from '@/components/shell/product-chrome'

export default function EquipaLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <ProductChrome eyebrow="PADEL HUB · Staff" title="Equipa">
      {children}
    </ProductChrome>
  )
}
