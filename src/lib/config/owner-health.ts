/**
 * Saúde “dono” para Configuração: OK / problema, sem nomes de env nem secrets.
 */

import { managementApiConfigured } from './status'

function present(value: string | undefined | null): boolean {
  return Boolean(value && String(value).trim())
}

export type OwnerHealthItem = {
  id: 'loja' | 'padel1' | 'sportsevents'
  label: string
  href: '/configuracao/boost' | '/configuracao/padel1' | '/configuracao/sportsevents'
  ok: boolean
  /** Frase curta para o dono — sem nomes técnicos. */
  message: string
}

function lojaOk(): boolean {
  const edgeAuth =
    present(process.env.BOOST_EDGE_AUTH_EMAIL) &&
    present(process.env.BOOST_EDGE_AUTH_PASSWORD)
  const edgeUser = present(process.env.BOOST_EDGE_USER_ID)
  const data =
    present(process.env.BOOST_SUPABASE_URL) ||
    present(process.env.NEXT_PUBLIC_SUPABASE_URL)
  const anon =
    present(process.env.BOOST_SUPABASE_ANON_KEY) ||
    present(process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY)
  return Boolean(data && anon && (edgeAuth || edgeUser || managementApiConfigured()))
}

function padel1Ok(): boolean {
  return (
    present(process.env.PADEL1_SUPABASE_URL) &&
    present(process.env.PADEL1_SUPABASE_ANON_KEY) &&
    present(process.env.PADEL1_SUPABASE_SERVICE_ROLE_KEY)
  )
}

function sportseventsOk(): boolean {
  return (
    present(process.env.NEXT_PUBLIC_SUPABASE_URL) &&
    present(process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) &&
    present(process.env.SUPABASE_SERVICE_ROLE_KEY)
  )
}

export function getOwnerHealthItems(): OwnerHealthItem[] {
  const loja = lojaOk()
  const p1 = padel1Ok()
  const se = sportseventsOk()

  return [
    {
      id: 'loja',
      label: 'Loja',
      href: '/configuracao/boost',
      ok: loja,
      message: loja
        ? 'Pagamentos da loja prontos'
        : 'Há um problema nos pagamentos da loja — actualiza Stripe nesta secção',
    },
    {
      id: 'padel1',
      label: 'Padel1',
      href: '/configuracao/padel1',
      ok: p1,
      message: p1
        ? 'Padel1 ligado'
        : 'Padel1 sem ligação — actualiza Stripe HQ nesta secção se precisares',
    },
    {
      id: 'sportsevents',
      label: 'SportsEvents',
      href: '/configuracao/sportsevents',
      ok: se,
      message: se
        ? 'SportsEvents ligado'
        : 'SportsEvents sem ligação — verifica as chaves Stripe desta secção',
    },
  ]
}
