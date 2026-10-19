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
    <div className="rounded-xl border border-amber-500/30 bg-amber-500/10 px-4 py-3 text-sm text-amber-100">
      <p className="font-semibold text-amber-300">Padel1 Supabase não configurado</p>
      <p className="mt-1 text-xs text-amber-100/80">{message}</p>
      <p className="mt-2 text-xs text-amber-100/70">
        Define{' '}
        <code className="rounded bg-black/40 px-1 text-cyan-300">
          PADEL1_SUPABASE_URL
        </code>{' '}
        e{' '}
        <code className="rounded bg-black/40 px-1 text-cyan-300">
          PADEL1_SUPABASE_SERVICE_ROLE_KEY
        </code>{' '}
        no Netlify do admin. Anon key necessária para Edge (checkout/owner).
      </p>
    </div>
  )
}
