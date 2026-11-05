import { NextResponse } from 'next/server'

/** Legacy path — canónico em /brand/icon-192.png */
export function GET(request: Request) {
  const url = new URL('/brand/icon-192.png?v=20261105', request.url)
  return NextResponse.redirect(url, 308)
}
