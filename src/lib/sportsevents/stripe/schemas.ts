import { z } from 'zod'

/**
 * Checkout automático a partir do pacote catálogo.
 * Split = percentagens guardadas no hub_packages (admin).
 */
export const createCheckoutSessionSchema = z.object({
  hubPackageId: z.string().uuid(),
  customerName: z.string().trim().min(2).max(200),
  customerEmail: z.string().trim().email().max(320),
  customerPhone: z.string().trim().max(40).optional().nullable(),
  /** Nº de jogadores (cobrados no pacote). */
  players: z.number().int().min(1).max(200),
  /** Quartos single — resto usa preço duplo. */
  singleRooms: z.number().int().min(0).max(200).optional().default(0),
  mealPlan: z.enum(['bb', 'hb', 'full']),
  currency: z
    .string()
    .trim()
    .toLowerCase()
    .regex(/^[a-z]{3}$/)
    .optional()
    .default('eur'),
  successUrl: z.string().url().optional(),
  cancelUrl: z.string().url().optional(),
  metadata: z.record(z.string(), z.string()).optional(),
})

export type CreateCheckoutSessionInput = z.infer<
  typeof createCheckoutSessionSchema
>

export const connectAccountSchema = z.object({
  partnerId: z.string().uuid(),
  country: z
    .string()
    .trim()
    .length(2)
    .toUpperCase()
    .optional()
    .default('PT'),
  email: z.string().trim().email().optional(),
  refreshUrl: z.string().url().optional(),
  returnUrl: z.string().url().optional(),
})

export type ConnectAccountInput = z.infer<typeof connectAccountSchema>

export function eurosToCents(amount: number): number {
  return Math.round(amount * 100)
}
