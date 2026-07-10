import { boolean, index, integer, pgTable, text, uniqueIndex } from 'drizzle-orm/pg-core'
import { pkUuid, timestamps } from './_columns'

export const serviceTags = pgTable(
  'service_tags',
  {
    id: pkUuid(),
    slug: text('slug').notNull(),
    labelDe: text('label_de').notNull(),
    labelEn: text('label_en').notNull(),
    sortOrder: integer('sort_order').notNull().default(0),
    isActive: boolean('is_active').notNull().default(true),
    ...timestamps(),
  },
  (t) => [
    uniqueIndex('service_tags_slug_unique').on(t.slug),
    index('service_tags_sort_idx').on(t.isActive, t.sortOrder),
  ],
)
