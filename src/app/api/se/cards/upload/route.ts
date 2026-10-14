import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createServiceClient } from '@/lib/supabase/admin'
import { requireSeStaff } from '@/lib/sportsevents/auth'
import { normalizeSlug } from '@/lib/sportsevents/cards'

export const runtime = 'nodejs'

const BUCKET = 'card-assets'
const MAX_BYTES = 10 * 1024 * 1024

const PHOTO_MIME = new Set([
  'image/jpeg',
  'image/png',
  'image/webp',
  'image/gif',
])
const PDF_MIME = new Set(['application/pdf'])

function safeFileName(name: string): string {
  return name
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-zA-Z0-9._-]+/g, '-')
    .replace(/-+/g, '-')
    .toLowerCase()
    .slice(0, 80)
}

export async function POST(request: Request) {
  const auth = await requireSeStaff()
  if (auth.error) {
    return NextResponse.json({ error: auth.error }, { status: auth.status })
  }

  const form = await request.formData()
  const file = form.get('file')
  const kind = String(form.get('kind') || '')
  const slugRaw = String(form.get('slug') || 'draft')

  if (!(file instanceof File)) {
    return NextResponse.json({ error: 'Ficheiro em falta.' }, { status: 400 })
  }
  if (file.size <= 0) {
    return NextResponse.json({ error: 'Ficheiro vazio.' }, { status: 400 })
  }
  if (file.size > MAX_BYTES) {
    return NextResponse.json(
      { error: 'Ficheiro demasiado grande (máx. 10 MB).' },
      { status: 400 }
    )
  }

  const mime = file.type || 'application/octet-stream'
  if (kind === 'photo' && !PHOTO_MIME.has(mime)) {
    return NextResponse.json(
      { error: 'Foto: usa JPG, PNG, WebP ou GIF.' },
      { status: 400 }
    )
  }
  if (kind === 'brochure' && !PDF_MIME.has(mime)) {
    return NextResponse.json(
      { error: 'Brochura: só são aceites ficheiros PDF.' },
      { status: 400 }
    )
  }
  if (kind !== 'photo' && kind !== 'brochure') {
    return NextResponse.json({ error: 'Tipo de upload inválido.' }, { status: 400 })
  }

  const folder = normalizeSlug(slugRaw) || 'draft'
  const stamp = Date.now()
  const base = safeFileName(file.name) || (kind === 'photo' ? 'foto.jpg' : 'brochura.pdf')
  const path = `${folder}/${kind}-${stamp}-${base}`

  const buffer = Buffer.from(await file.arrayBuffer())
  const service = createServiceClient()
  const client = service || (await createClient())

  const { error: uploadError } = await client.storage
    .from(BUCKET)
    .upload(path, buffer, {
      contentType: mime,
      upsert: true,
      cacheControl: '3600',
    })

  if (uploadError) {
    return NextResponse.json({ error: uploadError.message }, { status: 500 })
  }

  const { data } = client.storage.from(BUCKET).getPublicUrl(path)
  return NextResponse.json({
    url: data.publicUrl,
    path,
    kind,
    fileName: file.name,
  })
}
