import {
  integer,
  pgTable,
  text,
  uniqueIndex,
} from 'drizzle-orm/pg-core'
import { pkUuid, timestamps } from './_columns'

/** Phase 6 library rows for dossier Section 8 (vector match). */
export const comparableCases = pgTable(
  'comparable_cases',
  {
    id: pkUuid(),
    slug: text('slug').notNull(),
    name: text('name').notNull(),
    scaleUnits: integer('scale_units'),
    projectType: text('project_type'),
    facadeStyle: text('facade_style'),
    region: text('region'),
    year: integer('year'),
    summary: text('summary').notNull(),
    pdfUrl: text('pdf_url'),
    ...timestamps(),
  },
  (t) => [uniqueIndex('comparable_cases_slug_unique').on(t.slug)],
)