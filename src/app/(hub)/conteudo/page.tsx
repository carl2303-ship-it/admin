import Link from 'next/link'
import { requireHubAccess } from '@/lib/auth/hub-auth'
import { redirect } from 'next/navigation'
import { Newspaper, Megaphone, Mail, BookOpen } from 'lucide-react'

const LINKS = [
  {
    href: '/conteudo/blog-se',
    title: 'Blog SportsEvents',
    desc: 'CRUD posts SEO + AI gerar/publicar + republicar IG/FB',
    icon: Newspaper,
  },
  {
    href: '/conteudo/social',
    title: 'Redes & Meta',
    desc: 'Biblioteca de assets, publicar IG/FB, histórico Meta',
    icon: Megaphone,
  },
  {
    href: '/conteudo/blog-boost',
    title: 'Blog Boost',
    desc: 'Posts da loja Boost Padel',
    icon: BookOpen,
  },
  {
    href: '/conteudo/newsletter',
    title: 'Newsletter Boost',
    desc: 'Subscribers e export',
    icon: Mail,
  },
]

export default async function ConteudoPage() {
  const auth = await requireHubAccess('content')
  if (!auth.user) redirect('/login')
  if (auth.error && !auth.isBootstrap) {
    return (
      <div className="rounded-2xl border border-amber-500/30 bg-amber-500/10 p-6 text-amber-100">
        {auth.error}
      </div>
    )
  }

  return (
    <div className="space-y-6 animate-fade-up">
      <p className="max-w-2xl text-sm text-slate-400">
        Blog, redes sociais e assets Meta — agrupados aqui (antes espalhados em
        SportsEvents e Boost). Mesmos painéis do admin legado.
      </p>
      <div className="grid gap-3 sm:grid-cols-2">
        {LINKS.map((item) => {
          const Icon = item.icon
          return (
            <Link
              key={item.href}
              href={item.href}
              className="group flex gap-4 border border-slate-800 bg-slate-950/80 p-5 transition hover:border-cyan-500/40 hover:bg-slate-900"
            >
              <Icon className="h-5 w-5 shrink-0 text-cyan-400 group-hover:text-amber-400" />
              <div>
                <p className="font-semibold text-white">{item.title}</p>
                <p className="mt-1 text-xs text-slate-500">{item.desc}</p>
              </div>
            </Link>
          )
        })}
      </div>
    </div>
  )
}
