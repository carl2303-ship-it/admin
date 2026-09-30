'use client'

import { useRouter } from 'next/navigation'
import { useTransition } from 'react'
import { updateStageStatus } from '@/lib/boost/actions'
import { STAGE_STATUSES } from '@/lib/boost/types'
import { fieldClass } from './ui'

export function StageStatusSelect({
  stageId,
  status,
  disabled,
}: {
  stageId: string
  status: string
  disabled?: boolean
}) {
  const router = useRouter()
  const [pending, start] = useTransition()

  return (
    <select
      className={fieldClass + ' max-w-[10rem]'}
      defaultValue={status}
      disabled={disabled || pending}
      onChange={(e) => {
        const next = e.target.value
        start(async () => {
          const result = await updateStageStatus(stageId, next)
          if (!result.ok) window.alert(result.error)
          router.refresh()
        })
      }}
    >
      {STAGE_STATUSES.map((s) => (
        <option key={s} value={s}>
          {s === 'pending'
            ? 'Pendente'
            : s === 'confirmed'
              ? 'Confirmado'
              : 'Cancelado'}
        </option>
      ))}
      {!STAGE_STATUSES.includes(status as (typeof STAGE_STATUSES)[number]) && (
        <option value={status}>{status}</option>
      )}
    </select>
  )
}
