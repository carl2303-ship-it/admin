import { redirect } from 'next/navigation'

/** ROI / simulador de torneios vive só em SportsEvents (sem duplicado Padel1). */
export default function Padel1RentabilidadeRedirect() {
  redirect('/produtos/sportsevents/rentabilidade')
}
