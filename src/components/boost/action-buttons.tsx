'use client'

import { useRouter } from 'next/navigation'
import { useTransition } from 'react'
import { btnDanger, btnGhost, btnPrimary } from './ui'
import type { ActionResult } from '@/lib/boost/actions'

type Props = {
  label: string
  confirm?: string
  variant?: 'primary' | 'ghost' | 'danger'
  action: () => Promise<ActionResult>
  onDone?: (result: ActionResult) => void
}

export function ActionButton({
  label,
  confirm,
  variant = 'ghost',
  action,
  onDone,
}: Props) {
  const router = useRouter()
  const [pending, start] = useTransition()
  const cls =
    variant === 'primary' ? btnPrimary : variant === 'danger' ? btnDanger : btnGhost

  return (
    <button
      type="button"
      disabled={pending}
      className={cls}
      onClick={() => {
        if (confirm && !window.confirm(confirm)) return
        start(async () => {
          const result = await action()
          if (!result.ok) {
            window.alert(result.error)
          } else if (result.message) {
            window.alert(result.message)
          }
          onDone?.(result)
          router.refresh()
        })
      }}
    >
      {pending ? '…' : label}
    </button>
  )
}
