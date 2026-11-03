import { redirect } from 'next/navigation'

/** HUB-27: blog Boost migrado para Blog SportsEvents. */
export default function BoostBlogRedirect() {
  redirect('/conteudo/blog-se')
}
