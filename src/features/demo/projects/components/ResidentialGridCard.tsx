'use client'

import Link from 'next/link'
import { Footprints } from 'lucide-react'
import type { ResidentialProject } from '../types'
import { projectChipMuted, projectChipPrimary, projectChipSurface } from '../projectUi'
import { ProjectCardGallery } from './ProjectCardGallery'

type ResidentialGridCardProps = {
  project: ResidentialProject
}

export function ResidentialGridCard({ project }: ResidentialGridCardProps) {
  const visibleTags = project.featureTags.slice(0, 3)
  const overflowCount = Math.max(0, project.featureTags.length - visibleTags.length)
  const href = `/demo/projects/${project.slug}`

  return (
    <article className="group flex flex-col overflow-hidden rounded-xl border border-border bg-background transition-shadow hover:shadow-md">
      <div className="relative">
        <ProjectCardGallery images={project.galleryImages} title={project.title} href={href} />
        <div className="pointer-events-none absolute inset-x-0 top-0 flex flex-wrap items-center gap-1.5 p-3">
          {visibleTags.map((tag) => (
            <span
              key={tag.id}
              className={tag.variant === 'primary' ? projectChipPrimary : projectChipSurface}
            >
              {tag.label}
            </span>
          ))}
          {overflowCount > 0 ? (
            <span className={projectChipSurface}>+{overflowCount}</span>
          ) : null}
        </div>
      </div>

      <Link href={href} className="flex flex-1 flex-col gap-2 p-4 outline-none focus-visible:ring-2 focus-visible:ring-ring">
        <div className="flex items-start justify-between gap-2">
          <h2 className="min-w-0 flex-1 text-sm font-semibold leading-5 tracking-tight">
            {project.title}
          </h2>
          <p className="shrink-0 text-sm font-medium leading-5 text-foreground">{project.priceLabel}</p>
        </div>

        {project.metroStation ? (
          <p className="flex min-h-4 items-center gap-1.5 text-xs leading-4 text-muted-foreground">
            <span className="truncate">{project.metroStation}</span>
            {project.walkMinutes ? (
              <>
                <Footprints className="size-3.5 shrink-0" aria-hidden />
                <span className="shrink-0">{project.walkMinutes} min</span>
              </>
            ) : null}
          </p>
        ) : (
          <p className="min-h-4 text-xs leading-4 text-muted-foreground">{project.locationLabel}</p>
        )}

        <div className="mt-auto flex flex-wrap items-center gap-1.5 pt-1">
          <span className={projectChipMuted}>{project.statusLabel}</span>
          <span className={projectChipMuted}>{project.propertyTypeLabel}</span>
        </div>
      </Link>
    </article>
  )
}
