import { ConteudoModuleNav } from '@/components/conteudo/module-nav'
import { ProductChrome } from '@/components/shell/product-chrome'

export default function ConteudoLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <ProductChrome
      eyebrow="Conteúdo & Social"
      title="Conteúdo & Social"
      nav={<ConteudoModuleNav />}
    >
      {children}
    </ProductChrome>
  )
}
