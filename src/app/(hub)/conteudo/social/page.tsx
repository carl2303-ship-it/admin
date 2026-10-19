import { redirect } from 'next/navigation'
import { requireHubAccess } from '@/lib/auth/hub-auth'
import { SocialAdminPanel } from '@/components/sportsevents/SocialAdminPanel'

export default async function ConteudoSocialPage() {
  const auth = await requireHubAccess('content')
  if (!auth.user) redirect('/login')
  if (auth.error && !auth.isBootstrap) {
    return (
      <div className="rounded-2xl border border-amber-500/30 bg-amber-500/10 p-6 text-amber-100">
        {auth.error}
      </div>
    )
  }
  return <SocialAdminPanel />
}
