import { Suspense } from 'react'
import { notFound } from 'next/navigation'
import { ConfiguratorView } from '@/features/demo/configurator/ConfiguratorView'
import { getManifestForProject } from '@/features/demo/configurator/manifest'

type PageProps = {
  params: Promise<{ slug: string }>
}

export async function generateMetadata({ params }: PageProps) {
  const { slug } = await params
  const manifest = getManifestForProject(slug)
  if (!manifest) return { title: 'Configurator' }
  return { title: `Configure — ${manifest.project.title}` }
}

export default async function ConfigurePage({ params }: PageProps) {
  const { slug } = await params
  const manifest = getManifestForProject(slug)
  if (!manifest) notFound()

  return (
    <Suspense fallback={null}>
      <ConfiguratorView manifest={manifest} />
    </Suspense>
  )
}
