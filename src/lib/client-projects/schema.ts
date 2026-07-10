import { z } from 'zod'
import {
  CLIENT_PROJECT_STATUSES,
  LOST_REASONS,
  type ClientProjectStatus,
} from '@/lib/db/schema/enums'

export type { ClientProjectStatus }

export const createClientProjectSchema = z
  .object({
    title: z.string().min(1).max(300),
    description: z.string().max(5000).nullable().optional(),
    estimatedValue: z.number().nonnegative().nullable().optional(),
    currency: z.string().min(3).max(3).default('EUR'),
  })
  .strict()

export const updateClientProjectSchema = z
  .object({
    title: z.string().min(1).max(300).optional(),
    description: z.string().max(5000).nullable().optional(),
    status: z.enum(CLIENT_PROJECT_STATUSES).optional(),
    estimatedValue: z.number().nonnegative().nullable().optional(),
    currency: z.string().min(3).max(3).optional(),
    lostReason: z.enum(LOST_REASONS).nullable().optional(),
  })
  .strict()
  .refine((v) => Object.keys(v).length > 0, { message: 'no_fields' })

export const acceptOfferSchema = z
  .object({
    offerId: z.string().uuid(),
  })
  .strict()

export interface ClientProjectOfferSummary {
  id: string
  title: string
  status: 'draft' | 'published'
  updatedAt: string
}

export interface ClientProjectDTO {
  id: string
  prospectId: string
  workspaceId: string
  title: string
  description: string | null
  status: ClientProjectStatus
  currency: string
  estimatedValue: string | null
  acceptedOfferId: string | null
  dealId: string | null
  wonAt: string | null
  lostAt: string | null
  lostReason: string | null
  createdAt: string
  updatedAt: string
  offers: ClientProjectOfferSummary[]
}

function iso(v: Date | string) {
  return v instanceof Date ? v.toISOString() : new Date(v).toISOString()
}

export function rowToClientProjectDto(
  row: {
    id: string
    prospectId: string
    workspaceId: string
    title: string
    description: string | null
    status: ClientProjectStatus
    currency: string
    estimatedValue: string | null
    acceptedOfferId: string | null
    dealId: string | null
    wonAt: Date | string | null
    lostAt: Date | string | null
    lostReason: string | null
    createdAt: Date | string
    updatedAt: Date | string
  },
  offers: ClientProjectOfferSummary[] = [],
): ClientProjectDTO {
  return {
    id: row.id,
    prospectId: row.prospectId,
    workspaceId: row.workspaceId,
    title: row.title,
    description: row.description,
    status: row.status,
    currency: row.currency,
    estimatedValue: row.estimatedValue != null ? String(row.estimatedValue) : null,
    acceptedOfferId: row.acceptedOfferId,
    dealId: row.dealId,
    wonAt: row.wonAt != null ? iso(row.wonAt) : null,
    lostAt: row.lostAt != null ? iso(row.lostAt) : null,
    lostReason: row.lostReason,
    createdAt: iso(row.createdAt),
    updatedAt: iso(row.updatedAt),
    offers,
  }
}
