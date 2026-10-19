import { ProductChrome } from '@/components/shell/product-chrome'

export default function ConfiguracaoLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <ProductChrome eyebrow="PADEL HUB · Central" title="Configuração">
      {children}
    </ProductChrome>
  )
}
