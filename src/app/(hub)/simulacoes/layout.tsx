import { ProductChrome } from '@/components/shell/product-chrome'
import { SimulacoesNav } from '@/components/hq/simulacoes-nav'

export default function SimulacoesLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <ProductChrome
      eyebrow="HQ transversal"
      title="Simulações"
      nav={<SimulacoesNav />}
    >
      {children}
    </ProductChrome>
  )
}
