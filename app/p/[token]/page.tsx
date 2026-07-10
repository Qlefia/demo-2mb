import { notFound } from 'next/navigation'
import type { Metadata } from 'next'
import { ProposalDeckPreview } from '@/features/proposals/ProposalDeckPreview'
import { deckCssVars, resolveDeckThemeFromBlocks } from '@/lib/proposals/deckLayout'
import { resolveShareToken } from '@/lib/proposals/publicResolve'

export const runtime = 'nodejs'

type Props = {
  params: Promise<{ token: string }>
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { token } = await params
  const resolved = await resolveShareToken(token)
  if (!resolved.ok) {
    return {
      title: 'Proposal',
      robots: { index: false, follow: false },
    }
  }
  return {
    title: 'Proposal',
    robots: { index: false, follow: false },
    openGraph: {
      title: 'Proposal',
      description: undefined,
    },
  }
}

export default async function PublicProposalPage({ params }: Props) {
  const { token } = await params
  const resolved = await resolveShareToken(token)
  if (!resolved.ok) {
    notFound()
  }

  const theme = resolveDeckThemeFromBlocks(resolved.blocks)
  const cover = resolved.blocks.find((b) => b.type === 'cover')
  const brandKitConfigured = cover?.type === 'cover' && Boolean(cover.props.deckTheme)

  return (
    <main
      className="min-h-screen"
      style={{ backgroundColor: theme.bg, ...deckCssVars(theme) }}
    >
      <ProposalDeckPreview
        blocks={resolved.blocks}
        language={resolved.proposalLanguage}
        brandKitConfigured={brandKitConfigured}
      />
    </main>
  )
}
