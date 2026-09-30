'use client'

import { useRouter } from 'next/navigation'
import { useState, useTransition } from 'react'
import { saveBlogPost } from '@/lib/boost/actions'
import type { BoostBlogPost } from '@/lib/boost/types'
import { ImageUploadField } from './image-upload'
import { QuillEditor } from './quill-editor'
import { btnGhost, btnPrimary, fieldClass } from './ui'

export function BlogForm({ post }: { post?: BoostBlogPost | null }) {
  const router = useRouter()
  const [pending, start] = useTransition()
  const [error, setError] = useState<string | null>(null)

  return (
    <form
      className="space-y-3 rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm"
      action={(fd) => {
        start(async () => {
          setError(null)
          const result = await saveBlogPost(fd)
          if (!result.ok) {
            setError(result.error)
            return
          }
          router.push('/produtos/boost/blog')
          router.refresh()
        })
      }}
    >
      <h3 className="font-[family-name:var(--font-display)] text-lg font-bold">
        {post ? 'Editar post' : 'Novo post'}
      </h3>
      {post?.id && <input type="hidden" name="id" value={post.id} />}
      <div className="grid gap-3 md:grid-cols-2">
        <label className="block space-y-1">
          <span className="text-xs font-bold uppercase text-zinc-500">
            Título
          </span>
          <input
            name="title"
            required
            defaultValue={post?.title || ''}
            className={fieldClass}
          />
        </label>
        <label className="block space-y-1">
          <span className="text-xs font-bold uppercase text-zinc-500">
            Autor
          </span>
          <input
            name="author"
            defaultValue={post?.author || 'BOOST PADEL'}
            className={fieldClass}
          />
        </label>
        <label className="block space-y-1">
          <span className="text-xs font-bold uppercase text-zinc-500">
            Categoria
          </span>
          <input
            name="category"
            defaultValue={post?.category || 'geral'}
            className={fieldClass}
          />
        </label>
        <div>
          <ImageUploadField
            name="image_url"
            label="Imagem"
            defaultValue={post?.image_url || ''}
            folder="blog"
          />
        </div>
        <label className="block space-y-1 md:col-span-2">
          <span className="text-xs font-bold uppercase text-zinc-500">
            Excerpt
          </span>
          <textarea
            name="excerpt"
            rows={2}
            defaultValue={post?.excerpt || ''}
            className={fieldClass}
          />
        </label>
      </div>
      <div className="space-y-1">
        <span className="text-xs font-bold uppercase text-zinc-500">
          Conteúdo (Quill)
        </span>
        <QuillEditor
          name="content"
          defaultValue={post?.content || ''}
          placeholder="Escreva o conteúdo do post…"
          minHeight={220}
        />
      </div>
      <div className="flex flex-wrap gap-4 text-sm">
        <label className="inline-flex items-center gap-2">
          <input
            type="checkbox"
            name="published"
            defaultChecked={post?.published ?? false}
          />
          Publicado
        </label>
        <label className="inline-flex items-center gap-2">
          <input
            type="checkbox"
            name="featured"
            defaultChecked={post?.featured ?? false}
          />
          Destaque
        </label>
      </div>
      {error && <p className="text-sm text-red-600">{error}</p>}
      <div className="flex gap-2">
        <button type="submit" disabled={pending} className={btnPrimary}>
          {pending ? '…' : 'Guardar'}
        </button>
        <button
          type="button"
          className={btnGhost}
          onClick={() => router.push('/produtos/boost/blog')}
        >
          Limpar / cancelar
        </button>
      </div>
    </form>
  )
}
