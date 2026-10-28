import { apple } from '@/lib/pwa/icon-pngs'

export function GET() {
  return new Response(new Uint8Array(apple), {
    headers: {
      'Content-Type': 'image/png',
      'Cache-Control': 'public, max-age=86400, immutable',
    },
  })
}
