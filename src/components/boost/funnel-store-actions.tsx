'use client'

import { useRouter } from 'next/navigation'
import { useTransition } from 'react'
import {
  importLegacyPadelIqFunnel,
  publishEbookFunnelToStore,
} from '@/lib/boost/actions'
import { btnGhost, btnPrimary } from './ui'

export function ImportLegacyPadelIqButton() {
  const router = useRouter()
  const [pending, start] = useTransition()

  return (
    <button
      type="button"
      disabled={pending}
      className={btnPrimary}
      onClick={() => {
        start(async () => {
          const result = await importLegacyPadelIqFunnel()
          if (!result.ok) {
            window.alert(result.error)
            return
          }
          window.alert(result.message || 'Importado')
          if (result.id) {
            router.push(`/produtos/boost/funis/${result.id}`)
          } else {
            router.refresh()
          }
        })
      }}
    >
      {pending ? 'A importar…' : 'Importar legado PADEL IQ PRO'}
    </button>
  )
}

export function PublishFunnelToStoreButton({
  funnelId,
}: {
  funnelId: string
}) {
  const router = useRouter()
  const [pending, start] = useTransition()

  return (
    <button
      type="button"
      disabled={pending}
      className={btnGhost}
      onClick={() => {
        start(async () => {
          const result = await publishEbookFunnelToStore(funnelId)
          if (!result.ok) {
            window.alert(result.error)
            return
          }
          window.alert(result.message || 'Publicado na loja')
          router.refresh()
        })
      }}
    >
      {pending ? '…' : 'Publicar na loja'}
    </button>
  )
}
