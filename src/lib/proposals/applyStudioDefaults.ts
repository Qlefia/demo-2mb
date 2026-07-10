import type { ProposalBlock } from '@/lib/proposals/blockSchema'
import type { StudioProposalDefaults } from '@/lib/proposals/studioProposalDefaults'

function isPlaceholderCopy(value: string): boolean {
  const t = value.trim()
  return t === '' || t === ' '
}

function pickStudioCopy(studio: string | null | undefined, existing: string): string {
  const s = studio?.trim() ?? ''
  if (s === '') return existing
  if (isPlaceholderCopy(existing)) return s
  return existing
}

function pickStudioTerms(studio: string | null | undefined, existing: string): string {
  const s = studio?.trim() ?? ''
  if (s === '') return existing
  if (isPlaceholderCopy(existing)) return s
  return existing
}

/** Inject workspace brand + boilerplate into draft blocks (non-destructive for user edits). */
export function applyStudioDefaultsToBlocks(
  blocks: ProposalBlock[],
  defaults: StudioProposalDefaults,
): ProposalBlock[] {
  return blocks.map((block) => {
    if (block.type === 'cover') {
      return {
        ...block,
        props: {
          ...block.props,
          headline: pickStudioCopy(defaults.coverHeadline, block.props.headline),
          subtitle: pickStudioCopy(defaults.coverSubtitle, block.props.subtitle),
          studioLogoUrl: defaults.studioLogoUrl ?? block.props.studioLogoUrl ?? null,
          deckTheme: defaults.deckTheme ?? block.props.deckTheme ?? undefined,
        },
      }
    }

    if (block.type === 'about_2mb') {
      return {
        ...block,
        props: {
          ...block.props,
          title: pickStudioCopy(defaults.aboutTitle, block.props.title),
          body: pickStudioCopy(defaults.aboutBody, block.props.body),
        },
      }
    }

    if (block.type === 'terms') {
      return {
        ...block,
        props: {
          ...block.props,
          body: pickStudioTerms(defaults.termsBody, block.props.body),
        },
      }
    }

    return block
  })
}
