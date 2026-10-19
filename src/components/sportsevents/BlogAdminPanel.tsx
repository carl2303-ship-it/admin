'use client'

import { FormEvent, useCallback, useEffect, useState } from 'react'
import Link from 'next/link'
import {
  CheckCircle2,
  ExternalLink,
  Newspaper,
  Plus,
  Save,
  Trash2,
} from 'lucide-react'
import { BLOG_CATEGORIES, type BlogCategory } from '@/lib/sportsevents/blog-shared'
import { ImageUploadField } from '@/components/sportsevents/ImageUploadField'
import { ensureBlogHtml } from '@/lib/sportsevents/blog-html'

function BlogContentPreview({ content }: { content: string }) {
  const html = ensureBlogHtml(content)
  return (
    <div
      className="blog-prose text-sm leading-relaxed text-slate-300 max-h-[320px] overflow-y-auto"
      dangerouslySetInnerHTML={{ __html: html }}
    />
  )
}

const inputCls =
  'w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-cyan-500/50'

type AdminPost = {
  id: string
  title: string
  slug: string
  excerpt: string
  content: string
  cover_image: string | null
  category: BlogCategory
  meta_title: string | null
  meta_description: string | null
  published_at: string | null
  author_name: string
  updated_at?: string
}

type FormState = {
  title: string
  slug: string
  excerpt: string
  content: string
  cover_image: string
  category: BlogCategory
  meta_title: string
  meta_description: string
  author_name: string
  published: boolean
}

function emptyForm(): FormState {
  return {
    title: '',
    slug: '',
    excerpt: '',
    content: '',
    cover_image: '',
    category: 'Guides',
    meta_title: '',
    meta_description: '',
    author_name: 'SportsEvents Editorial',
    published: false,
  }
}

function postToForm(p: AdminPost): FormState {
  return {
    title: p.title,
    slug: p.slug,
    excerpt: p.excerpt || '',
    content: p.content || '',
    cover_image: p.cover_image || '',
    category: p.category,
    meta_title: p.meta_title || '',
    meta_description: p.meta_description || '',
    author_name: p.author_name || 'SportsEvents Team',
    published: Boolean(p.published_at),
  }
}

function slugify(input: string): string {
  return input
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 120)
}

export function BlogAdminPanel() {
  const [posts, setPosts] = useState<AdminPost[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [okMsg, setOkMsg] = useState<string | null>(null)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [form, setForm] = useState<FormState>(emptyForm())
  const [saving, setSaving] = useState(false)
  const [aiTopic, setAiTopic] = useState('')
  const [aiDestination, setAiDestination] = useState<
    'Marbella' | 'Algarve' | 'Barcelona'
  >('Algarve')
  const [aiSocial, setAiSocial] = useState(true)
  const [aiBusy, setAiBusy] = useState(false)
  const [metaReady, setMetaReady] = useState<{
    ready_for_facebook: boolean
    ready_for_instagram: boolean
    meta_page_token: boolean
    meta_page_id: boolean
    instagram_business_id: boolean
    has_pages_manage_posts?: boolean
    has_pages_read_engagement?: boolean
    token_type?: string | null
    token_page_name?: string | null
    token_page_id?: string | null
    configured_page_id?: string | null
    page_id_matches_token?: boolean
    scopes?: string[]
  } | null>(null)
  const [socialBusy, setSocialBusy] = useState(false)

  const load = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch('/api/se/blog')
      const data = await res.json()
      if (!res.ok) {
        setError(data.error || 'Erro ao carregar posts')
        setLoading(false)
        return
      }
      setPosts(data.posts || [])
    } catch {
      setError('Erro de rede ao carregar o blog.')
    }
    setLoading(false)
  }, [])

  useEffect(() => {
    void load()
    void (async () => {
      try {
        const res = await fetch('/api/se/content/meta-status')
        if (!res.ok) return
        setMetaReady(await res.json())
      } catch {
        // ignore
      }
    })()
  }, [load])

  function startCreate() {
    setEditingId(null)
    setForm(emptyForm())
    setOkMsg(null)
    setError(null)
  }

  function startEdit(p: AdminPost) {
    setEditingId(p.id)
    setForm(postToForm(p))
    setOkMsg(null)
    setError(null)
  }

  async function onSubmit(e: FormEvent) {
    e.preventDefault()
    setSaving(true)
    setError(null)
    setOkMsg(null)

    const payload = {
      ...form,
      slug: form.slug.trim() || slugify(form.title),
    }

    try {
      const res = await fetch(
        editingId ? `/api/se/blog/${editingId}` : '/api/se/blog',
        {
          method: editingId ? 'PUT' : 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        }
      )
      const data = await res.json()
      if (!res.ok) {
        setError(data.error || 'Erro ao guardar')
        setSaving(false)
        return
      }
      setOkMsg(editingId ? 'Artigo atualizado.' : 'Artigo criado.')
      setEditingId(data.post.id)
      setForm(postToForm(data.post))
      await load()
    } catch {
      setError('Erro de rede ao guardar.')
    }
    setSaving(false)
  }

  async function onDelete(id: string) {
    if (!confirm('Apagar este artigo? Esta ação não se desfaz.')) return
    setError(null)
    const res = await fetch(`/api/se/blog/${id}`, { method: 'DELETE' })
    const data = await res.json()
    if (!res.ok) {
      setError(data.error || 'Erro ao apagar')
      return
    }
    if (editingId === id) startCreate()
    await load()
  }

  async function runAiGenerate() {
    if (!aiTopic.trim()) {
      setError('Indica um topic para a IA.')
      return
    }
    setAiBusy(true)
    setError(null)
    setOkMsg(null)
    try {
      const res = await fetch('/api/se/content/generate-and-publish', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          topic: aiTopic.trim(),
          target_destination: aiDestination,
          auto_publish_social: aiSocial,
        }),
      })
      const data = await res.json()
      if (!res.ok && !data.success) {
        setError(
          data.error ||
            data.errors?.generation ||
            data.errors?.blog ||
            'Falha na geração automática'
        )
        setAiBusy(false)
        return
      }
      const bits = [
        data.blog_post_url ? `Blog: ${data.blog_post_url}` : null,
        data.instagram_published ? 'Instagram OK' : null,
        data.facebook_published ? 'Facebook OK' : null,
      ].filter(Boolean)
      setOkMsg(bits.join(' · ') || 'Artigo gerado.')
      const socialErrs = [
        data.errors?.instagram,
        data.errors?.facebook,
        data.errors?.config,
      ].filter(Boolean)
      if (socialErrs.length) {
        setError(socialErrs.join(' | '))
      }
      await load()
      if (data.slug) {
        const listRes = await fetch('/api/se/blog')
        const listData = await listRes.json()
        const found = (listData.posts || []).find(
          (p: AdminPost) => p.slug === data.slug
        )
        if (found) startEdit(found)
      }
    } catch {
      setError('Erro de rede na geração automática.')
    }
    setAiBusy(false)
  }

  async function republishSocial(
    platforms?: Array<'instagram' | 'facebook'>
  ) {
    if (!form.slug.trim()) {
      setError('Guarda o artigo com slug antes de publicar nas redes.')
      return
    }
    const needIg = !platforms?.length || platforms.includes('instagram')
    const needFb = !platforms?.length || platforms.includes('facebook')
    if (
      metaReady &&
      ((needFb && !metaReady.ready_for_facebook) ||
        (needIg && !metaReady.ready_for_instagram))
    ) {
      setError(
        'Meta incompleto: preenche META_PAGE_ACCESS_TOKEN, META_PAGE_ID e INSTAGRAM_BUSINESS_ACCOUNT_ID no .env.local e reinicia o next dev.'
      )
      return
    }
    setSocialBusy(true)
    setError(null)
    setOkMsg(null)
    try {
      const res = await fetch('/api/se/content/publish-social', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          slug: form.slug.trim(),
          ...(platforms?.length ? { platforms } : {}),
        }),
      })
      const data = await res.json()
      const bits = [
        data.instagram_published ? 'Instagram OK' : null,
        data.facebook_published ? 'Facebook OK' : null,
      ].filter(Boolean)
      if (bits.length) setOkMsg(bits.join(' · '))
      const errs = [
        data.error,
        data.errors?.config,
        data.errors?.instagram,
        data.errors?.facebook,
      ].filter(Boolean)
      if (errs.length) setError(errs.join(' | '))
      if (!bits.length && !errs.length) {
        setError('Nada foi publicado nas redes.')
      }
    } catch {
      setError('Erro de rede ao publicar nas redes.')
    }
    setSocialBusy(false)
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-sm font-black text-white flex items-center gap-2">
            <Newspaper className="w-4 h-4 text-cyan-400" />
            Gestão do Blog (SEO)
          </h2>
          <p className="mt-1 text-[11px] text-slate-500 max-w-xl">
            Artigos em inglês para tráfego orgânico. Conteúdo HTML simples
            (&lt;p&gt;, &lt;h2&gt;, &lt;ul&gt;, &lt;a&gt;). Rascunhos não
            aparecem no site até publicares.
          </p>
        </div>
        <button
          type="button"
          onClick={startCreate}
          className="inline-flex items-center gap-2 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-xs px-4 py-2.5"
        >
          <Plus className="w-3.5 h-3.5" /> Novo artigo
        </button>
      </div>

      {error && (
        <p className="text-xs text-rose-400 bg-rose-500/10 border border-rose-500/20 rounded-xl px-3 py-2">
          {error}
        </p>
      )}
      {okMsg && (
        <p className="text-xs text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 rounded-xl px-3 py-2 inline-flex items-center gap-2">
          <CheckCircle2 className="w-3.5 h-3.5" /> {okMsg}
        </p>
      )}

      <div className="rounded-2xl border border-cyan-500/20 bg-cyan-500/5 p-4 space-y-3">
        <div>
          <h3 className="text-xs font-black uppercase tracking-wider text-cyan-300">
            Gerar com IA + redes sociais
          </h3>
          <p className="text-[11px] text-slate-500 mt-1">
            Cria artigo no blog (OpenAI / Netlify AI Gateway) e, se o checkbox
            estiver activo, publica no Instagram e Facebook via Meta.
          </p>
          {metaReady && (
            <div className="mt-2 space-y-1">
              <p
                className={`text-[11px] ${
                  metaReady.ready_for_facebook && metaReady.ready_for_instagram
                    ? 'text-emerald-400'
                    : 'text-amber-400'
                }`}
              >
                Meta env:{' '}
                {metaReady.meta_page_token ? 'token✓' : 'token✗'} ·{' '}
                {metaReady.meta_page_id ? 'page✓' : 'page✗'} ·{' '}
                {metaReady.instagram_business_id ? 'IG✓' : 'IG✗'}
                {metaReady.token_type ? ` · tipo=${metaReady.token_type}` : ''}
              </p>
              <p
                className={`text-[11px] ${
                  metaReady.has_pages_manage_posts
                    ? 'text-emerald-400'
                    : 'text-rose-400'
                }`}
              >
                FB permissão pages_manage_posts:{' '}
                {metaReady.has_pages_manage_posts
                  ? '✓ no token'
                  : '✗ AUSENTE no token actual'}
              </p>
              {metaReady.token_page_id && (
                <p
                  className={`text-[11px] ${
                    metaReady.page_id_matches_token
                      ? 'text-emerald-400'
                      : 'text-rose-400'
                  }`}
                >
                  Token é da página:{' '}
                  {metaReady.token_page_name || metaReady.token_page_id}
                  {!metaReady.page_id_matches_token
                    ? metaReady.configured_page_id
                      ? ` — mas META_PAGE_ID=${metaReady.configured_page_id} (não corresponde). Actualiza META_PAGE_ID no .env.local para ${metaReady.token_page_id}.`
                      : ` — META_PAGE_ID está vazio no .env.local. Define META_PAGE_ID=${metaReady.token_page_id} e reinicia o next dev.`
                    : ' ✓'}
                </p>
              )}
            </div>
          )}
        </div>
        <div className="grid sm:grid-cols-[1fr_160px_auto] gap-2 items-end">
          <label className="block space-y-1">
            <span className="text-[10px] uppercase tracking-wider text-slate-500 font-bold">
              Topic
            </span>
            <input
              className={inputCls}
              value={aiTopic}
              onChange={(e) => setAiTopic(e.target.value)}
              placeholder="e.g. Best time for padel camps in Marbella"
            />
          </label>
          <label className="block space-y-1">
            <span className="text-[10px] uppercase tracking-wider text-slate-500 font-bold">
              Hub
            </span>
            <select
              className={inputCls}
              value={aiDestination}
              onChange={(e) =>
                setAiDestination(
                  e.target.value as 'Marbella' | 'Algarve' | 'Barcelona'
                )
              }
            >
              <option value="Algarve">Algarve</option>
              <option value="Marbella">Marbella</option>
              <option value="Barcelona">Barcelona</option>
            </select>
          </label>
          <button
            type="button"
            disabled={aiBusy}
            onClick={() => void runAiGenerate()}
            className="rounded-xl bg-cyan-500 hover:bg-cyan-400 disabled:opacity-50 text-slate-950 font-bold text-xs px-4 py-2.5"
          >
            {aiBusy ? 'A gerar…' : 'Gerar & publicar'}
          </button>
        </div>
        <label className="inline-flex items-center gap-2 text-xs text-slate-200 font-semibold">
          <input
            type="checkbox"
            checked={aiSocial}
            onChange={(e) => setAiSocial(e.target.checked)}
            className="rounded border-slate-600 accent-cyan-400"
          />
          Publicar também no Instagram + Facebook (obrigatório marcar)
        </label>
      </div>

      <div className="grid lg:grid-cols-[280px_minmax(0,1fr)] gap-6">
        <aside className="rounded-2xl border border-slate-800 bg-slate-900/60 p-3 max-h-[70vh] overflow-y-auto space-y-1">
          {loading && (
            <p className="text-[11px] text-slate-500 px-2 py-3">A carregar…</p>
          )}
          {!loading && posts.length === 0 && (
            <p className="text-[11px] text-slate-500 px-2 py-3">
              Ainda sem artigos. Cria o primeiro.
            </p>
          )}
          {posts.map((p) => (
            <div
              key={p.id}
              className={`rounded-xl border px-3 py-2.5 ${
                editingId === p.id
                  ? 'border-cyan-500/40 bg-cyan-500/10'
                  : 'border-transparent hover:bg-slate-800/50'
              }`}
            >
              <button
                type="button"
                onClick={() => startEdit(p)}
                className="w-full text-left"
              >
                <div className="text-xs font-semibold text-white line-clamp-2">
                  {p.title}
                </div>
                <div className="mt-1 flex flex-wrap gap-2 text-[10px] text-slate-500">
                  <span>{p.category}</span>
                  <span
                    className={
                      p.published_at ? 'text-emerald-400' : 'text-amber-400'
                    }
                  >
                    {p.published_at ? 'Publicado' : 'Rascunho'}
                  </span>
                </div>
              </button>
              <div className="mt-2 flex gap-2">
                {p.published_at && (
                  <Link
                    href={`/blog/${p.slug}`}
                    target="_blank"
                    className="inline-flex items-center gap-1 text-[10px] text-cyan-400 hover:underline"
                  >
                    Ver <ExternalLink className="w-3 h-3" />
                  </Link>
                )}
                <button
                  type="button"
                  onClick={() => onDelete(p.id)}
                  className="inline-flex items-center gap-1 text-[10px] text-rose-400 hover:underline"
                >
                  <Trash2 className="w-3 h-3" /> Apagar
                </button>
              </div>
            </div>
          ))}
        </aside>

        <form
          onSubmit={onSubmit}
          className="rounded-2xl border border-slate-800 bg-slate-900 p-5 space-y-4"
        >
          <div className="grid sm:grid-cols-2 gap-3">
            <label className="block space-y-1 sm:col-span-2">
              <span className="text-[10px] uppercase tracking-wider text-slate-500 font-bold">
                Título *
              </span>
              <input
                className={inputCls}
                value={form.title}
                onChange={(e) => {
                  const title = e.target.value
                  setForm((f) => ({
                    ...f,
                    title,
                    slug:
                      !editingId && (!f.slug || f.slug === slugify(f.title))
                        ? slugify(title)
                        : f.slug,
                  }))
                }}
                required
              />
            </label>
            <label className="block space-y-1">
              <span className="text-[10px] uppercase tracking-wider text-slate-500 font-bold">
                Slug (URL)
              </span>
              <input
                className={inputCls}
                value={form.slug}
                onChange={(e) =>
                  setForm((f) => ({ ...f, slug: slugify(e.target.value) }))
                }
                placeholder="padel-camps-in-spain"
              />
            </label>
            <label className="block space-y-1">
              <span className="text-[10px] uppercase tracking-wider text-slate-500 font-bold">
                Categoria
              </span>
              <select
                className={inputCls}
                value={form.category}
                onChange={(e) =>
                  setForm((f) => ({
                    ...f,
                    category: e.target.value as BlogCategory,
                  }))
                }
              >
                {BLOG_CATEGORIES.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </label>
            <label className="block space-y-1">
              <span className="text-[10px] uppercase tracking-wider text-slate-500 font-bold">
                Autor
              </span>
              <input
                className={inputCls}
                value={form.author_name}
                onChange={(e) =>
                  setForm((f) => ({ ...f, author_name: e.target.value }))
                }
              />
            </label>
            <div className="sm:col-span-2">
              <ImageUploadField
                label="Imagem de capa"
                value={form.cover_image}
                onChange={(url) => {
                  setForm((f) => ({ ...f, cover_image: url }))
                  if (url) setOkMsg('Imagem de capa carregada.')
                }}
                kind="blog"
                slug={form.slug || 'draft'}
                allowUrlFallback
              />
            </div>
            <label className="block space-y-1 sm:col-span-2">
              <span className="text-[10px] uppercase tracking-wider text-slate-500 font-bold">
                Excerpt (card / listagem)
              </span>
              <textarea
                className={`${inputCls} min-h-[64px]`}
                value={form.excerpt}
                onChange={(e) =>
                  setForm((f) => ({ ...f, excerpt: e.target.value }))
                }
              />
            </label>
            <label className="block space-y-1">
              <span className="text-[10px] uppercase tracking-wider text-slate-500 font-bold">
                Meta title (SEO)
              </span>
              <input
                className={inputCls}
                value={form.meta_title}
                onChange={(e) =>
                  setForm((f) => ({ ...f, meta_title: e.target.value }))
                }
              />
            </label>
            <label className="block space-y-1">
              <span className="text-[10px] uppercase tracking-wider text-slate-500 font-bold">
                Meta description (SEO)
              </span>
              <input
                className={inputCls}
                value={form.meta_description}
                onChange={(e) =>
                  setForm((f) => ({ ...f, meta_description: e.target.value }))
                }
              />
            </label>
            <label className="block space-y-1 sm:col-span-2">
              <span className="text-[10px] uppercase tracking-wider text-slate-500 font-bold">
                Conteúdo do artigo
              </span>
              <p className="text-[10px] text-slate-500 leading-relaxed">
                Podes colar texto normal (parágrafos separados por linha em
                branco). Títulos como &quot;1. Spring Stage…&quot; ou linhas com{' '}
                <code className="text-cyan-400">##</code> viram headings. Também
                podes usar HTML (&lt;p&gt;, &lt;h2&gt;, &lt;ul&gt;). Ao guardar,
                o layout é formatado automaticamente.
              </p>
              <textarea
                className={`${inputCls} min-h-[280px] font-mono text-[11px] leading-relaxed`}
                value={form.content}
                onChange={(e) =>
                  setForm((f) => ({ ...f, content: e.target.value }))
                }
                placeholder={
                  'Intro paragraph…\n\n1. First section title\nDetails here…\n\n## Another heading\nMore text…'
                }
              />
            </label>
            {form.content.trim() && (
              <div className="sm:col-span-2 rounded-xl border border-slate-800 bg-slate-950/80 p-4">
                <span className="text-[10px] uppercase tracking-wider text-slate-500 font-bold block mb-3">
                  Pré-visualização do layout
                </span>
                <BlogContentPreview content={form.content} />
              </div>
            )}
          </div>

          <label className="inline-flex items-center gap-2 text-xs text-slate-300">
            <input
              type="checkbox"
              checked={form.published}
              onChange={(e) =>
                setForm((f) => ({ ...f, published: e.target.checked }))
              }
              className="rounded border-slate-600"
            />
            Publicado no site (/blog)
          </label>

          <div className="flex flex-wrap gap-2">
            <button
              type="submit"
              disabled={saving}
              className="inline-flex items-center gap-2 rounded-xl bg-amber-400 hover:bg-amber-300 disabled:opacity-50 text-slate-950 font-bold text-xs px-4 py-2.5"
            >
              <Save className="w-3.5 h-3.5" />
              {saving
                ? 'A guardar…'
                : editingId
                  ? 'Guardar alterações'
                  : 'Criar artigo'}
            </button>
            {editingId && form.slug && (
              <>
                <button
                  type="button"
                  disabled={
                    socialBusy ||
                    Boolean(
                      metaReady &&
                        (!metaReady.ready_for_facebook ||
                          !metaReady.ready_for_instagram)
                    )
                  }
                  title={
                    metaReady &&
                    (!metaReady.ready_for_facebook ||
                      !metaReady.ready_for_instagram)
                      ? 'Configura META_* no .env.local primeiro'
                      : undefined
                  }
                  onClick={() => void republishSocial()}
                  className="inline-flex items-center gap-2 rounded-xl border border-cyan-500/40 bg-cyan-500/10 hover:bg-cyan-500/20 disabled:opacity-50 text-cyan-300 font-bold text-xs px-4 py-2.5"
                >
                  {socialBusy
                    ? 'A publicar redes…'
                    : 'Republicar Instagram + Facebook'}
                </button>
                <button
                  type="button"
                  disabled={
                    socialBusy ||
                    Boolean(metaReady && !metaReady.ready_for_facebook)
                  }
                  onClick={() => void republishSocial(['facebook'])}
                  className="inline-flex items-center gap-2 rounded-xl border border-blue-500/40 bg-blue-500/10 hover:bg-blue-500/20 disabled:opacity-50 text-blue-300 font-bold text-xs px-4 py-2.5"
                >
                  Só Facebook
                </button>
              </>
            )}
          </div>
        </form>
      </div>
    </div>
  )
}
