import { redirect } from 'next/navigation'

/** Stripe Boost consolidado em Configuração. */
export default function BoostStripeRedirect() {
  redirect('/configuracao/boost')
}
