import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createServiceClient } from '@/lib/supabase/admin'
import { requireSeStaff } from '@/lib/sportsevents/auth'

export const runtime = 'nodejs'

const BUCKET = 'media-assets'
const MAX_BYTES = 10 * 1024 * 1024
const PHOTO_MIME = new Set([
  'image/jpeg',
  'image/png',
  'image/webp',
  'image/gif',
])

const FOLDERS = new Set(['events', 'blog', 'cards', 'general', 'social'])

function safeFileName(name: string): string {
  return name
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-zA-Z0-9._-]+/g, '-')
    .replace(/-+/g, '-')
    .toLowerCase()
    .slice(0, 80)
}

function safeFolder(raw: string): string {
  const s = raw
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9/_-]+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-+|-+$/g, '')
  return s || 'draft'
}

export async function POST(request: Request) {
  const auth = await requireSeStaff()
  if (auth.error) {
    return NextResponse.json({ error: auth.error }, { status: auth.status })
  }

  const form = await request.formData()
  const file = form.get('file')
  const kindRaw = String(form.get('kind') || 'general').toLowerCase()
  const kind = FOLDERS.has(kindRaw) ? kindRaw : 'general'
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
  if (!PHOTO_MIME.has(mime)) {
    return NextResponse.json(
      { error: 'Usa JPG, PNG, WebP ou GIF.' },
      { status: 400 }
    )
  }

  const stamp = Date.now()
  const base = safeFileName(file.name) || 'image.jpg'
  const path = `${kind}/${safeFolder(slugRaw)}/${stamp}-${base}`
  const buffer = Buffer.from(await file.arrayBuffer())

  const service = createServiceClient()
  const client = service || (await createClient())

  let bucket = BUCKET
  let uploadError = (
    await client.storage.from(bucket).upload(path, buffer, {
      contentType: mime,
      upsert: true,
      cacheControl: '31536000',
    })
  ).error

  // Fallback se media-assets ainda não existir (ex. só blog-assets provisionado)
  if (
    uploadError &&
    /bucket|not found|does not exist/i.test(uploadError.message)
  ) {
    bucket = 'blog-assets'
    uploadError = (
      await client.storage.from(bucket).upload(path, buffer, {
        contentType: mime,
        upsert: true,
        cacheControl: '31536000',
      })
    ).error
  }

  if (uploadError) {
    return NextResponse.json(
      {
        error:
          uploadError.message +
          (uploadError.message.toLowerCase().includes('bucket')
            ? ' Corre a migration media-assets (ou blog-assets) no Supabase.'
            : ''),
      },
      { status: 500 }
    )
  }

  const { data } = client.storage.from(bucket).getPublicUrl(path)
  return NextResponse.json({
    url: data.publicUrl,
    path,
    fileName: file.name,
    bucket,
  })
}
