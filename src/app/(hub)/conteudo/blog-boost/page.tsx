import { redirect } from 'next/navigation'

/** HUB-27: blog Boost migrado para Blog SportsEvents (`public.posts`). */
export default function ConteudoBlogBoostRedirect() {
  redirect('/conteudo/blog-se')
}
