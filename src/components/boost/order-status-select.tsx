'use client'

import { useRouter } from 'next/navigation'
import { useTransition } from 'react'
import { updateOrderStatus } from '@/lib/boost/actions'
import { ORDER_STATUSES } from '@/lib/boost/types'
import { fieldClass } from './ui'

export function OrderStatusSelect({
  orderId,
  status,
  disabled,
}: {
  orderId: string
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
          const result = await updateOrderStatus(orderId, next)
          if (!result.ok) window.alert(result.error)
          router.refresh()
        })
      }}
    >
      {ORDER_STATUSES.map((s) => (
        <option key={s} value={s}>
          {s}
        </option>
      ))}
      {!ORDER_STATUSES.includes(status as (typeof ORDER_STATUSES)[number]) && (
        <option value={status}>{status}</option>
      )}
    </select>
  )
}
