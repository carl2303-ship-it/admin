export {
  ErrorBanner,
  StatusPill,
  Panel,
  TableShell,
  Th,
  Td,
  fieldClass,
  btnPrimary,
  btnGhost,
  btnDanger,
} from '@/components/boost/ui'

export function ConfigBanner({ message }: { message: string }) {
  return (
    <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
      <p className="font-semibold">Padel1 Supabase não configurado</p>
      <p className="mt-1 text-xs">{message}</p>
      <p className="mt-2 text-xs">
        Define{' '}
        <code className="rounded bg-amber-100 px-1">PADEL1_SUPABASE_URL</code> e{' '}
        <code className="rounded bg-amber-100 px-1">
          PADEL1_SUPABASE_SERVICE_ROLE_KEY
        </code>{' '}
        no Netlify do admin. Anon key necessária para Edge (checkout/owner).
      </p>
    </div>
  )
}
