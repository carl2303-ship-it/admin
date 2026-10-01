'use client'

import { useRouter } from 'next/navigation'
import { useTransition } from 'react'
import { btnPrimary, fieldClass, Panel } from '@/components/boost/ui'
import {
  createConfigIntent,
  type ConfigActionResult,
} from '@/lib/config/actions'

const OPTIONS: Record<
  'padel1' | 'sportsevents' | 'hub',
  { value: string; label: string }[]
> = {
  padel1: [
    { value: 'PADEL1_SUPABASE_URL', label: 'PADEL1_SUPABASE_URL' },
    { value: 'PADEL1_SUPABASE_ANON_KEY', label: 'PADEL1_SUPABASE_ANON_KEY' },
    {
      value: 'PADEL1_SUPABASE_SERVICE_ROLE_KEY',
      label: 'PADEL1_SUPABASE_SERVICE_ROLE_KEY',
    },
    { value: 'NEXT_PUBLIC_PADEL1_HQ_URL', label: 'NEXT_PUBLIC_PADEL1_HQ_URL' },
    {
      value: 'PADEL1_STRIPE_SECRET_KEY',
      label: 'PADEL1_STRIPE_SECRET_KEY (plataforma)',
    },
    {
      value: 'PADEL1_STRIPE_WEBHOOK_SECRET',
      label: 'PADEL1_STRIPE_WEBHOOK_SECRET',
    },
  ],
  sportsevents: [
    { value: 'NEXT_PUBLIC_SUPABASE_URL', label: 'NEXT_PUBLIC_SUPABASE_URL' },
    {
      value: 'NEXT_PUBLIC_SUPABASE_ANON_KEY',
      label: 'NEXT_PUBLIC_SUPABASE_ANON_KEY',
    },
    {
      value: 'SUPABASE_SERVICE_ROLE_KEY',
      label: 'SUPABASE_SERVICE_ROLE_KEY',
    },
    {
      value: 'NEXT_PUBLIC_SPORTSEVENTS_ADMIN_URL',
      label: 'NEXT_PUBLIC_SPORTSEVENTS_ADMIN_URL',
    },
    {
      value: 'SE_STRIPE_SECRET_KEY',
      label: 'SE_STRIPE_SECRET_KEY (site / Connect)',
    },
    { value: 'SE_STRIPE_WEBHOOK_SECRET', label: 'SE_STRIPE_WEBHOOK_SECRET' },
    { value: 'META_ACCESS_TOKEN', label: 'META_ACCESS_TOKEN' },
    { value: 'OPENAI_API_KEY', label: 'OPENAI_API_KEY / AI gateway' },
  ],
  hub: [
    { value: 'NEXT_PUBLIC_SITE_URL', label: 'NEXT_PUBLIC_SITE_URL' },
    { value: 'SUPABASE_ACCESS_TOKEN', label: 'SUPABASE_ACCESS_TOKEN (PAT)' },
    { value: 'NETLIFY_AUTH_TOKEN', label: 'NETLIFY_AUTH_TOKEN' },
    { value: 'NETLIFY_ACCOUNT_ID', label: 'NETLIFY_ACCOUNT_ID' },
    { value: 'NETLIFY_SITE_ID', label: 'NETLIFY_SITE_ID' },
    { value: 'BRIDGE_LINK_TTL_SECONDS', label: 'BRIDGE_LINK_TTL_SECONDS' },
  ],
}

export function ConfigIntentForm({
  product,
  title,
  description,
}: {
  product: 'padel1' | 'sportsevents' | 'hub'
  title: string
  description: string
}) {
  const router = useRouter()
  const [pending, start] = useTransition()
  const options = OPTIONS[product]

  return (
    <Panel className="p-5">
      <h3 className="font-[family-name:var(--font-display)] text-lg font-bold">
        {title}
      </h3>
      <p className="mt-2 text-sm text-zinc-600">{description}</p>
      <p className="mt-2 text-xs text-amber-800">
        O hub <strong>não</strong> guarda o valor do secret — só o nome + nota
        para checklist ops.
      </p>

      <form
        className="mt-4 space-y-3"
        onSubmit={(e) => {
          e.preventDefault()
          const fd = new FormData(e.currentTarget)
          start(async () => {
            const result: ConfigActionResult = await createConfigIntent(fd)
            if (!result.ok) {
              window.alert(result.error)
            } else {
              window.alert(result.message)
              e.currentTarget.reset()
            }
            router.refresh()
          })
        }}
      >
        <input type="hidden" name="product" value={product} />
        <div>
          <label className="mb-1 block text-xs font-bold uppercase text-zinc-500">
            Integração / secret
          </label>
          <select name="secret_name" required className={fieldClass} defaultValue="">
            <option value="" disabled>
              Escolher…
            </option>
            {options.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="mb-1 block text-xs font-bold uppercase text-zinc-500">
            Nota / o que fazer
          </label>
          <input
            name="note"
            type="text"
            required
            placeholder="ex. actualizar no Netlify admin após rotação"
            className={fieldClass}
          />
        </div>
        <button type="submit" disabled={pending} className={btnPrimary}>
          {pending ? 'A guardar…' : 'Registar intent'}
        </button>
      </form>
    </Panel>
  )
}
