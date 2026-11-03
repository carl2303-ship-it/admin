import { redirect } from 'next/navigation'

/** Setup técnico do hub já não vive em Configuração — equipa em /equipa. */
export default function ConfigHubRedirect() {
  redirect('/equipa')
}
