import Link from 'next/link'
import { Container } from '@/components/atoms/Container'
import { TwoMbWordmark } from '@/components/brand/TwoMbWordmark'
import { loadResidentialProjects } from '@/features/demo/projects/loadResidentialProjects'
import { ProjectsCatalog } from '@/features/demo/projects/components/ProjectsCatalog'
import { projectsCopy } from '@/features/demo/projects/copy.en'
import { DASHBOARD_HEADER_BAR_CLASS, PAGE_FRAME_CLASS } from '@/lib/layout/pageFrame'
import { cn } from '@/lib/cn'

export const metadata = {
  title: 'New developments — 2mb',
}

export const dynamic = 'force-dynamic'

function ProjectsChrome({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col bg-background text-foreground">
      <header className={cn('shrink-0 border-b border-border', PAGE_FRAME_CLASS)}>
        <div className={DASHBOARD_HEADER_BAR_CLASS}>
          <Link href="/demo/projects" className="block h-5 w-28 shrink-0 text-foreground">
            <TwoMbWordmark className="h-full w-full" title="2mb.studio" />
          </Link>
        </div>
      </header>
      <main className="flex-1">{children}</main>
    </div>
  )
}

export default async function DemoProjectsPage() {
  const projects = await loadResidentialProjects()
  const cities = [...new Set(projects.map((p) => p.city))].sort()
  const propertyTypes = [...new Set(projects.map((p) => p.propertyType))].sort()
  const statuses = [...new Set(projects.map((p) => p.status))].sort()

  return (
    <ProjectsChrome>
      <Container className="py-8 md:py-10">
        <div className="mb-6 max-w-3xl">
          <h1 className="text-2xl font-semibold leading-tight tracking-tight md:text-3xl">
            {projectsCopy.pageTitle}
          </h1>
          <p className="mt-2 text-sm leading-relaxed text-muted-foreground md:text-base">
            {projectsCopy.pageSubtitle}
          </p>
        </div>
        <ProjectsCatalog
          projects={projects}
          cities={cities}
          propertyTypes={propertyTypes}
          statuses={statuses}
        />
      </Container>
    </ProjectsChrome>
  )
}
