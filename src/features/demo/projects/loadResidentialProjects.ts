import 'server-only'

import { eq, sql } from 'drizzle-orm'
import { db } from '@/lib/db/client'
import { workspaceStudioSettings } from '@/lib/db/schema'
import {
  getConfiguratorWorkId,
  isDemoCatalogWorkId,
  mapWorkToResidentialProject,
} from './projectEnrichment'
import { STATIC_RESIDENTIAL_PROJECTS } from './demoProjectsStatic'
import type { ResidentialProject } from './types'

const DEMO_WORKSPACE_ID = '00000000-0000-4000-8000-000000000001'

type RawWork = {
  id?: string
  title?: string
  subheader?: string
  categoryLabel?: string
  taskBody?: string
  bannerDataUrl?: string | null
  bannerPortraitDataUrl?: string | null
  publicationStatus?: string
}

export async function loadResidentialProjects(): Promise<ResidentialProject[]> {
  try {
    const rows = await db
      .select({
        sales: workspaceStudioSettings.sales,
      })
      .from(workspaceStudioSettings)
      .where(eq(workspaceStudioSettings.workspaceId, DEMO_WORKSPACE_ID))
      .limit(1)

    const sales = rows[0]?.sales
    if (!sales || typeof sales !== 'object' || !('works' in sales)) {
      return STATIC_RESIDENTIAL_PROJECTS
    }

    const works = (sales as { works?: RawWork[] }).works ?? []

    const projects = works
      .filter((w) => typeof w.id === 'string' && isDemoCatalogWorkId(w.id))
      .map((w) =>
        mapWorkToResidentialProject({
          id: w.id!,
          title: w.title ?? '',
          subheader: w.subheader ?? '',
          categoryLabel: w.categoryLabel ?? '',
          taskBody: w.taskBody ?? '',
          banner: w.bannerDataUrl ?? null,
          bannerPortrait: w.bannerPortraitDataUrl ?? null,
          publicationStatus: w.publicationStatus ?? 'published',
        }),
      )
      .filter((p): p is ResidentialProject => p !== null)

    if (projects.length === 0) return STATIC_RESIDENTIAL_PROJECTS

    return projects.sort((a, b) => {
      if (a.hasConfigurator !== b.hasConfigurator) return a.hasConfigurator ? -1 : 1
      if (a.featured !== b.featured) return a.featured ? -1 : 1
      return a.title.localeCompare(b.title)
    })
  } catch {
    return STATIC_RESIDENTIAL_PROJECTS
  }
}

export async function getResidentialProjectBySlug(
  slug: string,
): Promise<ResidentialProject | null> {
  const projects = await loadResidentialProjects()
  return projects.find((p) => p.slug === slug) ?? null
}

export async function getConfiguratorProject(): Promise<ResidentialProject | null> {
  const projects = await loadResidentialProjects()
  return projects.find((p) => p.id === getConfiguratorWorkId()) ?? null
}

/** Distinct filter option values derived from loaded projects. */
export async function loadProjectFilterOptions() {
  const projects = await loadResidentialProjects()
  const cities = [...new Set(projects.map((p) => p.city))].sort()
  const propertyTypes = [...new Set(projects.map((p) => p.propertyType))].sort()
  const statuses = [...new Set(projects.map((p) => p.status))].sort()
  return { cities, propertyTypes, statuses }
}

export async function countCatalogWorksInDb(): Promise<number> {
  const [row] = await db
    .select({
      count: sql<number>`count(*)::int`,
    })
    .from(workspaceStudioSettings)
    .where(eq(workspaceStudioSettings.workspaceId, DEMO_WORKSPACE_ID))

  return row?.count ?? 0
}
