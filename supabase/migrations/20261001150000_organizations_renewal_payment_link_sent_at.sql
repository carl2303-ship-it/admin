/*
  # SaaS Tour — tracking de link de renovação

  Coluna usada pelo hub (cron diário + botão manual "Enviar link de pagamento")
  para não reenviar o mesmo email de renovação na mesma janela de período.

  Projecto: Supabase **Boost Padel** (não SportsEvents).
*/

ALTER TABLE public.organizations
  ADD COLUMN IF NOT EXISTS renewal_payment_link_sent_at timestamptz;

COMMENT ON COLUMN public.organizations.renewal_payment_link_sent_at IS
  'Timestamp do último envio de payment link de renovação SaaS (hub cron/manual)';
