import { ProductChrome } from '@/components/shell/product-chrome'
import { MetricasNav } from '@/components/hq/metricas-nav'

export default function MetricasLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <ProductChrome
      eyebrow="HQ transversal"
      title="Métricas"
      nav={<MetricasNav />}
    >
      {children}
    </ProductChrome>
  )
}
