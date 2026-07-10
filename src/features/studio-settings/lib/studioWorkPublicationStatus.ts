import type { BadgeProps } from '@/components/atoms/Badge/Badge'
import type { StudioWorkPublicationStatus } from '@/stores/studioProfileTypes'

export { STUDIO_WORK_PUBLICATION_STATUSES } from '@/stores/studioProfileTypes'
export type { StudioWorkPublicationStatus } from '@/stores/studioProfileTypes'

export function coerceStudioWorkPublicationStatus(value: unknown): StudioWorkPublicationStatus {
  if (
    value === 'draft' ||
    value === 'in_review' ||
    value === 'published' ||
    value === 'unpublished'
  ) {
    return value
  }
  return 'draft'
}

type BadgeVariant = NonNullable<BadgeProps['variant']>

export function studioWorkPublicationBadgeVariant(
  status: StudioWorkPublicationStatus,
): BadgeVariant {
  switch (status) {
    case 'published':
      return 'success'
    case 'in_review':
      return 'warning'
    case 'unpublished':
      return 'default'
    case 'draft':
    default:
      return 'info'
  }
}

/** Status dot on the pinned work editor bar (Webflow-style). */
export function studioWorkPublicationDotClass(status: StudioWorkPublicationStatus): string {
  switch (status) {
    case 'published':
      return 'bg-success'
    case 'in_review':
      return 'bg-warning'
    case 'unpublished':
      return 'bg-muted-foreground/50'
    case 'draft':
    default:
      return 'bg-primary/80'
  }
}

export function studioWorkPublicationStatusI18nKey(
  status: StudioWorkPublicationStatus,
): `studioSettings.works.publicationStatus.${StudioWorkPublicationStatus}` {
  return `studioSettings.works.publicationStatus.${status}`
}
