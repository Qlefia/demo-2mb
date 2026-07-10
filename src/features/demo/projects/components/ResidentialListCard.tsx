'use client'

import Image from 'next/image'
import Link from 'next/link'
import { ChevronRight } from 'lucide-react'
import { cn } from '@/lib/cn'
import { studioRadiusNested, studioSortableListCard } from '@/features/studio-settings/studioBlockChrome'
import type { ResidentialProject } from '../types'
import { projectsCopy } from '../copy.en'
import { projectChipMuted } from '../projectUi'

type ResidentialListCardProps = {
  project: ResidentialProject
}

export function ResidentialListCard({ project }: ResidentialListCardProps) {
  const href = `/demo/projects/${project.slug}`
  const shownAmenities = project.amenityTags.slice(0, 4)
  const moreAmenities = Math.max(0, project.amenityTags.length - shownAmenities.length)

  return (
    <Link href={href} className={cn(studioSortableListCard, 'group flex gap-4 p-4 transition-colors hover:bg-hover/40')}>
      <div
        className={cn(
          'relative hidden h-28 w-40 shrink-0 overflow-hidden bg-muted/30 sm:block',
          studioRadiusNested,
        )}
      >
        <Image
          src={project.heroImage}
          alt=""
          fill
          unoptimized
          sizes="160px"
          className="object-cover"
        />
      </div>

      <div className="min-w-0 flex-1">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="text-xs font-medium uppercase leading-4 tracking-wide text-muted-foreground">
              {project.propertyTypeLabel} · {project.locationLabel}
            </p>
            <h2 className="mt-1 text-base font-semibold leading-5 tracking-tight">{project.title}</h2>
            {project.subtitle ? (
              <p className="mt-0.5 text-sm leading-5 text-muted-foreground">{project.subtitle}</p>
            ) : null}
          </div>
          <div className="flex shrink-0 items-center gap-2">
            <span className="text-sm font-medium leading-5">{project.priceLabel}</span>
            <ChevronRight className="size-4 text-muted group-hover:text-foreground" aria-hidden />
          </div>
        </div>

        <p className="mt-2 line-clamp-2 text-sm leading-5 text-muted-foreground">{project.description}</p>

        <div className="mt-3">
          <p className="text-xs font-medium uppercase leading-4 tracking-wide text-muted-foreground">
            {projectsCopy.amenitiesLabel}
          </p>
          <div className="mt-1.5 flex flex-wrap items-center gap-1.5">
            {shownAmenities.map((tag) => (
              <span key={tag} className={projectChipMuted}>
                {tag}
              </span>
            ))}
            {moreAmenities > 0 ? (
              <span className="inline-flex h-6 items-center px-1 text-xs leading-none text-muted-foreground">
                +{moreAmenities} more
              </span>
            ) : null}
          </div>
        </div>
      </div>
    </Link>
  )
}
