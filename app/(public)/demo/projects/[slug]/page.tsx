import Image from 'next/image'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { ArrowLeft, Footprints } from 'lucide-react'
import { Button } from '@/components/atoms/Button'
import { Container } from '@/components/atoms/Container'
import { TwoMbWordmark } from '@/components/brand/TwoMbWordmark'
import { getResidentialProjectBySlug } from '@/features/demo/projects/loadResidentialProjects'
import { projectsCopy } from '@/features/demo/projects/copy.en'
import { projectChipMuted, projectChipPrimary, projectChipSurface } from '@/features/demo/projects/projectUi'
import { DASHBOARD_HEADER_BAR_CLASS, PAGE_FRAME_CLASS } from '@/lib/layout/pageFrame'
import { cn } from '@/lib/cn'

export const dynamic = 'force-dynamic'

type PageProps = {
  params: Promise<{ slug: string }>
}

export async function generateMetadata({ params }: PageProps) {
  const { slug } = await params
  const project = await getResidentialProjectBySlug(slug)
  if (!project) return { title: 'Project not found' }
  return { title: `${project.title} — 2mb` }
}

export default async function DemoProjectDetailPage({ params }: PageProps) {
  const { slug } = await params
  const project = await getResidentialProjectBySlug(slug)
  if (!project) notFound()

  return (
    <div className="flex min-h-screen flex-col bg-background text-foreground">
      <header className={cn('shrink-0 border-b border-border', PAGE_FRAME_CLASS)}>
        <div className={DASHBOARD_HEADER_BAR_CLASS}>
          <Link href="/demo/projects" className="block h-5 w-28 shrink-0 text-foreground">
            <TwoMbWordmark className="h-full w-full" title="2mb.studio" />
          </Link>
        </div>
      </header>

      <Container className="flex-1 py-8">
        <div className="mx-auto max-w-5xl">
        <Link
          href="/demo/projects"
          className="mb-6 inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="size-4" aria-hidden />
          {projectsCopy.backToProjects}
        </Link>

        <div className="relative mb-6 aspect-[21/9] overflow-hidden rounded-xl border border-border bg-muted/30">
          <Image
            src={project.heroImage}
            alt=""
            fill
            unoptimized
            priority
            sizes="(max-width: 1024px) 100vw, 1024px"
            className="object-cover"
          />
          <div className="absolute left-4 top-4 flex flex-wrap items-center gap-1.5">
            {project.featureTags.map((tag) => (
              <span
                key={tag.id}
                className={tag.variant === 'primary' ? projectChipPrimary : projectChipSurface}
              >
                {tag.label}
              </span>
            ))}
          </div>
        </div>

        <div className="grid gap-8 lg:grid-cols-[1fr_280px]">
          <div className="space-y-5">
            <div>
              <p className="text-sm text-muted-foreground">{project.locationLabel}</p>
              <div className="mt-1 flex flex-wrap items-baseline justify-between gap-3">
                <h1 className="text-3xl font-semibold tracking-tight">{project.title}</h1>
                <p className="text-lg font-medium">{project.priceLabel}</p>
              </div>
              {project.subtitle ? (
                <p className="mt-1 text-muted-foreground">{project.subtitle}</p>
              ) : null}
            </div>

            {project.metroStation ? (
              <p className="flex items-center gap-2 text-sm text-muted-foreground">
                <span className="font-medium text-foreground">{project.metroStation}</span>
                {project.walkMinutes ? (
                  <>
                    <Footprints className="size-4" aria-hidden />
                    <span>
                      {project.walkMinutes} {projectsCopy.walkToMetro}
                    </span>
                  </>
                ) : null}
              </p>
            ) : null}

            <p className="max-w-2xl text-sm leading-relaxed text-muted-foreground">{project.description}</p>

            <div>
              <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                {projectsCopy.amenitiesLabel}
              </p>
              <div className="mt-2 flex flex-wrap items-center gap-1.5">
                {project.amenityTags.map((tag) => (
                  <span key={tag} className={projectChipMuted}>
                    {tag}
                  </span>
                ))}
              </div>
            </div>
          </div>

          <aside className="space-y-4 lg:sticky lg:top-20 lg:self-start">
            <div className="rounded-xl border border-border p-4">
              <div className="flex flex-wrap items-center gap-1.5">
                <span className={projectChipMuted}>{project.statusLabel}</span>
                <span className={projectChipMuted}>{project.propertyTypeLabel}</span>
              </div>
              {project.hasConfigurator ? (
                <Link href={`/demo/projects/${project.slug}/configure`} className="mt-4 block">
                  <Button type="button" variant="primary" size="lg" className="w-full">
                    {projectsCopy.configureUnit}
                  </Button>
                </Link>
              ) : null}
            </div>
          </aside>
        </div>
        </div>
      </Container>
    </div>
  )
}
