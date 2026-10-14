import { getStripe } from '@/lib/sportsevents/stripe-client'
import { createServiceClient } from '@/lib/supabase/admin'

export type SplitRole = 'hotel' | 'transfer' | 'other'

export type PendingTransfer = {
  role: SplitRole
  partnerId: string
  stripeAccountId: string
  amountCents: number
}

type TransferOutcome = {
  role: SplitRole
  partnerId: string
  stripeAccountId: string
  amountCents: number
  status: 'succeeded' | 'failed' | 'skipped'
  transferId?: string
  error?: string
}

/**
 * Separate Charges & Transfers:
 * charge stays on the platform; after success we transfer hotel / transfer shares
 * using `source_transaction` so funds are pulled from that charge.
 * Stripe fees remain on the platform balance (padel_service share).
 */
export async function executeSplitTransfers(opts: {
  packageBookingId: string
  paymentIntentId: string
  transferGroup: string
  currency: string
  transfers: PendingTransfer[]
}): Promise<TransferOutcome[]> {
  const stripe = await getStripe()
  if (!stripe) throw new Error('Stripe não configurado')

  const service = createServiceClient()
  if (!service) throw new Error('SUPABASE_SERVICE_ROLE_KEY em falta')

  const pi = await stripe.paymentIntents.retrieve(opts.paymentIntentId, {
    expand: ['latest_charge'],
  })

  const chargeId =
    typeof pi.latest_charge === 'string'
      ? pi.latest_charge
      : pi.latest_charge?.id

  if (!chargeId) {
    throw new Error('Charge não encontrado no PaymentIntent')
  }

  const outcomes: TransferOutcome[] = []

  for (const item of opts.transfers) {
    if (item.amountCents <= 0) {
      outcomes.push({
        ...item,
        status: 'skipped',
        error: 'amount_cents <= 0',
      })
      continue
    }

    try {
      const account = await stripe.accounts.retrieve(item.stripeAccountId)
      if (account.requirements?.disabled_reason || account.charges_enabled === false) {
        const msg = `Conta ${item.stripeAccountId} restrita/desativada (${account.requirements?.disabled_reason || 'charges_disabled'})`
        console.error('[stripe-split]', msg)
        outcomes.push({ ...item, status: 'failed', error: msg })
        await service.from('payment_transfer_logs').insert({
          package_booking_id: opts.packageBookingId,
          partner_id: item.partnerId,
          stripe_account_id: item.stripeAccountId,
          role: item.role,
          amount_cents: item.amountCents,
          status: 'failed',
          error_message: msg,
        })
        continue
      }

      const transfer = await stripe.transfers.create({
        amount: item.amountCents,
        currency: opts.currency.toLowerCase(),
        destination: item.stripeAccountId,
        source_transaction: chargeId,
        transfer_group: opts.transferGroup,
        metadata: {
          package_booking_id: opts.packageBookingId,
          partner_id: item.partnerId,
          role: item.role,
        },
      })

      outcomes.push({
        ...item,
        status: 'succeeded',
        transferId: transfer.id,
      })

      await service.from('payment_transfer_logs').insert({
        package_booking_id: opts.packageBookingId,
        partner_id: item.partnerId,
        stripe_account_id: item.stripeAccountId,
        role: item.role,
        amount_cents: item.amountCents,
        stripe_transfer_id: transfer.id,
        status: 'succeeded',
      })
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err)
      console.error('[stripe-split] transfer failed', {
        booking: opts.packageBookingId,
        role: item.role,
        account: item.stripeAccountId,
        message,
      })
      outcomes.push({ ...item, status: 'failed', error: message })
      await service.from('payment_transfer_logs').insert({
        package_booking_id: opts.packageBookingId,
        partner_id: item.partnerId,
        stripe_account_id: item.stripeAccountId,
        role: item.role,
        amount_cents: item.amountCents,
        status: 'failed',
        error_message: message,
      })
    }
  }

  return outcomes
}

export function summarizeTransferStatus(
  outcomes: TransferOutcome[]
): 'paid' | 'partial_transfer' {
  const actionable = outcomes.filter((o) => o.status !== 'skipped')
  if (actionable.length === 0) return 'paid'
  const allOk = actionable.every((o) => o.status === 'succeeded')
  return allOk ? 'paid' : 'partial_transfer'
}

export type PackageBookingSplitRow = {
  id: string
  hotel_partner_id: string | null
  transfer_partner_id: string | null
  hotel_amount_cents: number
  transfer_amount_cents: number
  currency: string
  stripe_transfer_group: string | null
  status: string
}
