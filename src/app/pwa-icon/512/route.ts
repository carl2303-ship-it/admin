import { icon512 } from '@/lib/pwa/icon-pngs'

export function GET() {
  return new Response(new Uint8Array(icon512), {
    headers: {
      'Content-Type': 'image/png',
      'Cache-Control': 'public, max-age=86400, immutable',
    },
  })
}
