import { NextResponse } from 'next/server'

/** Legacy path — canónico em /brand/apple-touch-icon.png */
export function GET(request: Request) {
  const url = new URL('/brand/apple-touch-icon.png?v=20261105', request.url)
  return NextResponse.redirect(url, 308)
}
