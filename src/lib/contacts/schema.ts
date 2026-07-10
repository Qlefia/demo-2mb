import { z } from 'zod'

const optionalUrl = z
  .string()
  .url()
  .max(500)
  .optional()
  .or(z.literal('').transform(() => undefined))

const optionalEmail = z
  .string()
  .email()
  .max(254)
  .optional()
  .or(z.literal('').transform(() => undefined))

const optionalString = (max: number) =>
  z
    .string()
    .max(max)
    .optional()
    .or(z.literal('').transform(() => undefined))

export const createContactSchema = z
  .object({
    fullName: z.string().min(1).max(200),
    role: optionalString(120),
    email: optionalEmail,
    phone: optionalString(40),
    linkedinUrl: optionalUrl,
    languages: z.array(z.string().min(2).max(8)).max(10).optional(),
    optedOut: z.boolean().optional(),
  })
  .strict()

export const updateContactSchema = createContactSchema.partial()

export type ContactCreateInput = z.infer<typeof createContactSchema>
export type ContactUpdateInput = z.infer<typeof updateContactSchema>

export interface ContactDTO {
  id: string
  accountId: string
  fullName: string
  role: string | null
  email: string | null
  phone: string | null
  linkedinUrl: string | null
  languages: string[] | null
  optedOutAt: string | null
  sourceProvider: string | null
  createdAt: string
  updatedAt: string
}
