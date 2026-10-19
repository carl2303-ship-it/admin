'use client'

import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type FormEvent,
} from 'react'
import {
  ImagePlus,
  Loader2,
  Megaphone,
  Trash2,
  Upload,
} from 'lucide-react'
import { ImageUploadField } from '@/components/sportsevents/ImageUploadField'
import {
  SOCIAL_HUBS,
  type SocialHub,
} from '@/lib/sportsevents/content-automation/social-hubs'

type SocialAsset = {
  id: string
  hub: SocialHub
  title: string
  image_url: string
  created_at: string
}

type SocialPost = {
  id: string
  slogan: string
  caption: string
  hub: SocialHub
  image_url: string
  instagram_published: boolean
  facebook_published: boolean
  errors: Record<string, string> | null
  created_at: string
}

const inputCls =
  'w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-cyan-500/50'

export function SocialAdminPanel() {
  const [hubFilter, setHubFilter] = useState<SocialHub | 'all'>('all')
  const [assets, setAssets] = useState<SocialAsset[]>([])
  const [posts, setPosts] = useState<SocialPost[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [okMsg, setOkMsg] = useState<string | null>(null)

  const [libHub, setLibHub] = useState<SocialHub>('Algarve')
  const [libTitlePrefix, setLibTitlePrefix] = useState('')
  const [libBusy, setLibBusy] = useState(false)
  const [libProgress, setLibProgress] = useState<string | null>(null)
  const multiInputRef = useRef<HTMLInputElement>(null)

  const [slogan, setSlogan] = useState('')
  const [extra, setExtra] = useState('')
  const [postHub, setPostHub] = useState<SocialHub>('Algarve')
  const [postImage, setPostImage] = useState('')
  const [selectedAssetId, setSelectedAssetId] = useState<string | null>(null)
  const [pubIg, setPubIg] = useState(true)
  const [pubFb, setPubFb] = useState(true)
  const [pubBusy, setPubBusy] = useState(false)

  const loadAssets = useCallback(async () => {
    const q =
      hubFilter === 'all' ? '' : `?hub=${encodeURIComponent(hubFilter)}`
    const res = await fetch(`/api/se/social/assets${q}`)
    const data = await res.json()
    if (!res.ok) throw new Error(data.error || 'Erro ao carregar biblioteca')
    setAssets(data.assets || [])
  }, [hubFilter])

  const loadPosts = useCallback(async () => {
    const res = await fetch('/api/se/social/posts')
    const data = await res.json()
    if (!res.ok) throw new Error(data.error || 'Erro ao carregar histórico')
    setPosts(data.posts || [])
  }, [])

  const load = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      await Promise.all([loadAssets(), loadPosts()])
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Erro ao carregar')
    }
    setLoading(false)
  }, [loadAssets, loadPosts])

  useEffect(() => {
    void load()
  }, [load])

  async function uploadFilesToLibrary(files: FileList | File[]) {
    const list = Array.from(files).filter((f) => f.type.startsWith('image/'))
    if (!list.length) {
      setError('Selecciona uma ou mais imagens (JPG, PNG, WebP, GIF).')
      return
    }

    setLibBusy(true)
    setError(null)
    setOkMsg(null)
    let ok = 0
    const failures: string[] = []
    const prefix = libTitlePrefix.trim()

    for (let i = 0; i < list.length; i++) {
      const file = list[i]
      setLibProgress(`A carregar ${i + 1}/${list.length}: ${file.name}`)
      try {
        const body = new FormData()
        body.append('file', file)
        body.append('kind', 'social')
        body.append('slug', libHub.toLowerCase())
        const upRes = await fetch('/api/se/media/upload', {
          method: 'POST',
          body,
        })
        const upData = await upRes.json()
        if (!upRes.ok || !upData.url) {
          failures.push(`${file.name}: ${upData.error || 'upload falhou'}`)
          continue
        }

        const title =
          prefix ||
          file.name.replace(/\.[^.]+$/, '').replace(/[-_]+/g, ' ').trim()

        const saveRes = await fetch('/api/se/social/assets', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            hub: libHub,
            title,
            image_url: upData.url,
            storage_path: upData.path || undefined,
          }),
        })
        const saveData = await saveRes.json()
        if (!saveRes.ok) {
          failures.push(`${file.name}: ${saveData.error || 'guardar falhou'}`)
          continue
        }
        ok += 1
      } catch {
        failures.push(`${file.name}: erro de rede`)
      }
    }

    setLibProgress(null)
    setLibBusy(false)
    if (multiInputRef.current) multiInputRef.current.value = ''

    if (ok > 0) {
      setOkMsg(
        `${ok} foto${ok === 1 ? '' : 's'} adicionada${ok === 1 ? '' : 's'} a ${libHub}.`
      )
      await loadAssets()
    }
    if (failures.length) {
      setError(failures.slice(0, 5).join(' · ') + (failures.length > 5 ? '…' : ''))
    }
  }

  async function removeAsset(id: string) {
    if (!confirm('Remover esta foto da biblioteca?')) return
    setError(null)
    const res = await fetch(`/api/se/social/assets/${id}`, {
      method: 'DELETE',
    })
    const data = await res.json()
    if (!res.ok) {
      setError(data.error || 'Erro ao apagar')
      return
    }
    if (selectedAssetId === id) {
      setSelectedAssetId(null)
      setPostImage('')
    }
    await loadAssets()
  }

  function pickAsset(a: SocialAsset) {
    setSelectedAssetId(a.id)
    setPostImage(a.image_url)
    setPostHub(a.hub)
  }

  async function publishSocial(e: FormEvent) {
    e.preventDefault()
    if (!slogan.trim()) {
      setError('Escreve um slogan / texto curto.')
      return
    }
    if (!postImage.trim()) {
      setError('Escolhe uma imagem da biblioteca ou faz upload.')
      return
    }
    if (!pubIg && !pubFb) {
      setError('Selecciona Instagram e/ou Facebook.')
      return
    }
    setPubBusy(true)
    setError(null)
    setOkMsg(null)
    const platforms: Array<'instagram' | 'facebook'> = []
    if (pubIg) platforms.push('instagram')
    if (pubFb) platforms.push('facebook')
    try {
      const res = await fetch('/api/se/social/posts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          slogan: slogan.trim(),
          extra: extra.trim() || undefined,
          hub: postHub,
          image_url: postImage.trim(),
          asset_id: selectedAssetId || undefined,
          platforms,
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
        data.errors?.instagram,
        data.errors?.facebook,
      ].filter(Boolean)
      if (errs.length) setError(errs.join(' | '))
      if (!bits.length && !errs.length) {
        setError('Nada foi publicado.')
      }
      if (bits.length) {
        setSlogan('')
        setExtra('')
      }
      await loadPosts()
    } catch {
      setError('Erro de rede ao publicar.')
    }
    setPubBusy(false)
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-sm font-black text-white flex items-center gap-2">
          <Megaphone className="w-4 h-4 text-cyan-400" />
          Posts redes (sem blog)
        </h2>
        <p className="mt-1 text-[11px] text-slate-500 max-w-2xl">
          Slogans e fotos para Instagram + Facebook. Não cria artigo no blog.
          Organiza a biblioteca por destino (campos Algarve, Marbella,
          Barcelona).
        </p>
      </div>

      {error && (
        <p className="text-xs text-rose-300 bg-rose-500/10 border border-rose-500/20 rounded-xl px-3 py-2">
          {error}
        </p>
      )}
      {okMsg && (
        <p className="text-xs text-emerald-300 bg-emerald-500/10 border border-emerald-500/20 rounded-xl px-3 py-2">
          {okMsg}
        </p>
      )}

      <div className="grid lg:grid-cols-2 gap-6">
        {/* Biblioteca */}
        <section className="rounded-2xl border border-slate-800 bg-slate-900/60 p-4 space-y-4">
          <h3 className="text-xs font-black uppercase tracking-wider text-cyan-300">
            Biblioteca de fotos
          </h3>
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-2">
              <label className="block space-y-1">
                <span className="text-[10px] uppercase tracking-wider text-slate-500 font-bold">
                  Destino
                </span>
                <select
                  className={inputCls}
                  value={libHub}
                  onChange={(e) => setLibHub(e.target.value as SocialHub)}
                  disabled={libBusy}
                >
                  {SOCIAL_HUBS.map((h) => (
                    <option key={h} value={h}>
                      {h}
                    </option>
                  ))}
                </select>
              </label>
              <label className="block space-y-1">
                <span className="text-[10px] uppercase tracking-wider text-slate-500 font-bold">
                  Prefixo título (opc.)
                </span>
                <input
                  className={inputCls}
                  value={libTitlePrefix}
                  onChange={(e) => setLibTitlePrefix(e.target.value)}
                  placeholder="ex. Court Algarve"
                  disabled={libBusy}
                />
              </label>
            </div>
            <label
              className={`inline-flex cursor-pointer items-center gap-2 rounded-xl border border-cyan-500/30 bg-cyan-500/10 px-4 py-2.5 text-xs font-bold text-cyan-300 hover:border-cyan-400/50 ${
                libBusy ? 'opacity-60 pointer-events-none' : ''
              }`}
            >
              {libBusy ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <Upload className="w-3.5 h-3.5" />
              )}
              {libBusy
                ? libProgress || 'A carregar…'
                : 'Carregar várias fotos'}
              <input
                ref={multiInputRef}
                type="file"
                accept="image/jpeg,image/png,image/webp,image/gif"
                multiple
                className="hidden"
                disabled={libBusy}
                onChange={(e) => {
                  const files = e.target.files
                  if (files?.length) void uploadFilesToLibrary(files)
                }}
              />
            </label>
            <p className="text-[10px] text-slate-500">
              Podes seleccionar várias imagens de uma vez. Cada uma fica na
              biblioteca do destino escolhido (máx. 10 MB por ficheiro).
            </p>
            {libProgress && (
              <p className="text-[11px] text-cyan-300/80">{libProgress}</p>
            )}
          </div>

          <div className="flex flex-wrap gap-1.5 pt-2 border-t border-slate-800">
            <button
              type="button"
              onClick={() => setHubFilter('all')}
              className={`rounded-lg px-2.5 py-1 text-[10px] font-bold ${
                hubFilter === 'all'
                  ? 'bg-cyan-500/20 text-cyan-300'
                  : 'text-slate-500 hover:text-slate-300'
              }`}
            >
              Todos
            </button>
            {SOCIAL_HUBS.map((h) => (
              <button
                key={h}
                type="button"
                onClick={() => setHubFilter(h)}
                className={`rounded-lg px-2.5 py-1 text-[10px] font-bold ${
                  hubFilter === h
                    ? 'bg-cyan-500/20 text-cyan-300'
                    : 'text-slate-500 hover:text-slate-300'
                }`}
              >
                {h}
              </button>
            ))}
          </div>

          {loading ? (
            <p className="text-[11px] text-slate-500">A carregar…</p>
          ) : assets.length === 0 ? (
            <p className="text-[11px] text-slate-500">
              Ainda sem fotos. Carrega campos Algarve / Marbella / Barcelona.
            </p>
          ) : (
            <div className="grid grid-cols-3 sm:grid-cols-4 gap-2 max-h-72 overflow-y-auto">
              {assets.map((a) => (
                <div
                  key={a.id}
                  className={`relative group rounded-xl overflow-hidden border ${
                    selectedAssetId === a.id
                      ? 'border-cyan-400 ring-1 ring-cyan-400/40'
                      : 'border-slate-700'
                  }`}
                >
                  <button
                    type="button"
                    onClick={() => pickAsset(a)}
                    className="block w-full aspect-square"
                    title={a.title || a.hub}
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={a.image_url}
                      alt={a.title || a.hub}
                      className="h-full w-full object-cover"
                    />
                  </button>
                  <span className="absolute bottom-0 inset-x-0 bg-black/60 text-[9px] text-white px-1 py-0.5 truncate">
                    {a.hub}
                  </span>
                  <button
                    type="button"
                    onClick={() => void removeAsset(a.id)}
                    className="absolute top-1 right-1 rounded-md bg-black/60 p-1 text-rose-300 opacity-0 group-hover:opacity-100"
                    title="Remover"
                  >
                    <Trash2 className="w-3 h-3" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* Publicar */}
        <section className="rounded-2xl border border-cyan-500/20 bg-cyan-500/5 p-4 space-y-4">
          <h3 className="text-xs font-black uppercase tracking-wider text-cyan-300">
            Criar e publicar
          </h3>
          <form onSubmit={(e) => void publishSocial(e)} className="space-y-3">
            <label className="block space-y-1">
              <span className="text-[10px] uppercase tracking-wider text-slate-500 font-bold">
                Slogan / texto
              </span>
              <textarea
                className={`${inputCls} min-h-[88px] resize-y`}
                value={slogan}
                onChange={(e) => setSlogan(e.target.value)}
                placeholder="Mornings of Evolution. Afternoons of Competition. Nights of Connection."
                required
              />
            </label>
            <label className="block space-y-1">
              <span className="text-[10px] uppercase tracking-wider text-slate-500 font-bold">
                Extra (opc.)
              </span>
              <textarea
                className={`${inputCls} min-h-[56px] resize-y`}
                value={extra}
                onChange={(e) => setExtra(e.target.value)}
                placeholder="Linha de apoio curta…"
              />
            </label>
            <label className="block space-y-1">
              <span className="text-[10px] uppercase tracking-wider text-slate-500 font-bold">
                Destino
              </span>
              <select
                className={inputCls}
                value={postHub}
                onChange={(e) => setPostHub(e.target.value as SocialHub)}
              >
                {SOCIAL_HUBS.map((h) => (
                  <option key={h} value={h}>
                    {h}
                  </option>
                ))}
              </select>
            </label>

            <div className="space-y-2">
              <p className="text-[10px] uppercase tracking-wider text-slate-500 font-bold">
                Imagem do post
              </p>
              {postImage ? (
                <div className="flex items-center gap-3">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={postImage}
                    alt=""
                    className="h-20 w-20 rounded-xl object-cover border border-slate-700"
                  />
                  <button
                    type="button"
                    onClick={() => {
                      setPostImage('')
                      setSelectedAssetId(null)
                    }}
                    className="text-[11px] text-slate-400 hover:text-white"
                  >
                    Limpar selecção
                  </button>
                </div>
              ) : (
                <p className="text-[11px] text-slate-500 flex items-center gap-1.5">
                  <ImagePlus className="w-3.5 h-3.5" />
                  Clica numa foto da biblioteca ou faz upload abaixo.
                </p>
              )}
              <ImageUploadField
                label="Upload directo (sem guardar na biblioteca)"
                value={selectedAssetId ? '' : postImage}
                onChange={(url) => {
                  setSelectedAssetId(null)
                  setPostImage(url)
                }}
                kind="social"
                slug={postHub.toLowerCase()}
                previewAspect="square"
              />
            </div>

            <div className="flex flex-wrap gap-4 text-xs text-slate-300">
              <label className="inline-flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={pubIg}
                  onChange={(e) => setPubIg(e.target.checked)}
                  className="rounded border-slate-600"
                />
                Instagram
              </label>
              <label className="inline-flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={pubFb}
                  onChange={(e) => setPubFb(e.target.checked)}
                  className="rounded border-slate-600"
                />
                Facebook
              </label>
            </div>

            <button
              type="submit"
              disabled={pubBusy}
              className="inline-flex items-center gap-2 rounded-xl bg-cyan-400 hover:bg-cyan-300 disabled:opacity-50 text-slate-950 font-bold text-xs px-4 py-2.5"
            >
              {pubBusy ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <Megaphone className="w-3.5 h-3.5" />
              )}
              {pubBusy ? 'A publicar…' : 'Publicar nas redes'}
            </button>
          </form>
        </section>
      </div>

      {/* Histórico */}
      <section className="rounded-2xl border border-slate-800 bg-slate-900/40 p-4 space-y-3">
        <h3 className="text-xs font-black uppercase tracking-wider text-slate-400">
          Histórico recente
        </h3>
        {posts.length === 0 ? (
          <p className="text-[11px] text-slate-500">Ainda sem posts só-redes.</p>
        ) : (
          <ul className="space-y-2">
            {posts.map((p) => (
              <li
                key={p.id}
                className="flex gap-3 items-start rounded-xl border border-slate-800 bg-slate-950/50 p-2.5"
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={p.image_url}
                  alt=""
                  className="h-14 w-14 rounded-lg object-cover shrink-0"
                />
                <div className="min-w-0 flex-1">
                  <p className="text-xs text-white font-semibold line-clamp-2">
                    {p.slogan}
                  </p>
                  <p className="text-[10px] text-slate-500 mt-0.5">
                    {p.hub} ·{' '}
                    {new Date(p.created_at).toLocaleString('pt-PT')} ·{' '}
                    {p.instagram_published ? 'IG✓' : 'IG✗'}{' '}
                    {p.facebook_published ? 'FB✓' : 'FB✗'}
                  </p>
                  {p.errors && (
                    <p className="text-[10px] text-rose-400 mt-0.5">
                      {Object.values(p.errors).join(' | ')}
                    </p>
                  )}
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  )
}
