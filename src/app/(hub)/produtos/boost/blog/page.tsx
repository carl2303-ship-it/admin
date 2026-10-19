import { redirect } from 'next/navigation'

/** Blog Boost vive em Conteúdo & Social. */
export default async function BoostBlogRedirect({
  searchParams,
}: {
  searchParams: Promise<{ edit?: string }>
}) {
  const sp = await searchParams
  const q = sp.edit ? `?edit=${encodeURIComponent(sp.edit)}` : ''
  redirect(`/conteudo/blog-boost${q}`)
}
