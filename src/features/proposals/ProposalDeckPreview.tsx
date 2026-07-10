'use client'

import { useCallback, useEffect, useId, useMemo, useRef, useState, Fragment } from 'react'
import type { CSSProperties } from 'react'
import { useTranslation } from 'react-i18next'
import { Check } from 'lucide-react'
import { cn } from '@/lib/cn'
import type { ProposalBlock, CoverFieldId } from '@/lib/proposals/blockSchema'
import { visualGridCellFlexGrow } from '@/lib/proposals/blockSchema'
import { resolveVideoPlayback } from '@/lib/proposals/videoEmbed'
import {
  deckCssVars,
  letterheadSectionCssVars,
  resolveDeckThemeFromBlocks,
  resolveStudioLogoFromBlocks,
  type DeckLanguage,
  type ProposalDeckTheme,
  pricingTableLabels,
} from '@/lib/proposals/deckLayout'
import {
  injectProposalDeckFonts,
  proposalDeckFontCssVars,
  type ProposalDeckFonts,
} from '@/features/proposals/lib/proposalDeckFonts'

function deckRootStyle(theme: ProposalDeckTheme, fonts?: ProposalDeckFonts | null): CSSProperties {
  return {
    backgroundColor: theme.bg,
    color: theme.fg,
    fontFamily: fonts ? 'var(--deck-font-body)' : undefined,
    ...deckCssVars(theme),
    ...(fonts ? proposalDeckFontCssVars(fonts) : {}),
  } as CSSProperties
}

/** Full-bleed white sheet: cancels `.proposal-deck` horizontal padding (`px-4` / `sm:px-5`). */
const LETTERHEAD_SHEET_BLEED =
  '-mx-4 w-[calc(100%+2rem)] max-w-none rounded-none border-0 sm:-mx-5 sm:w-[calc(100%+2.5rem)]'

/** One gutter for bullets / empty rail — keeps headings & body text on same vertical axis. */
const LH_RAIL = 'w-4 shrink-0'
const LH_GAP = 'gap-3'

function DeckSectionShell({
  surface,
  children,
  theme,
}: {
  surface: 'deck' | 'letterhead'
  children: React.ReactNode
  theme: ProposalDeckTheme
}) {
  if (surface === 'deck') return <>{children}</>
  return (
    <div
      className={LETTERHEAD_SHEET_BLEED}
      style={{
        ...letterheadSectionCssVars(theme),
        backgroundColor: 'var(--deck-bg)',
        color: 'var(--deck-fg)',
      }}
    >
      {children}
    </div>
  )
}

function isLetterheadSurfaceBlock(block: ProposalBlock): boolean {
  if (
    block.type === 'project_scope' ||
    block.type === 'pricing' ||
    block.type === 'timeline' ||
    block.type === 'terms'
  ) {
    return block.props.sectionSurface === 'letterhead'
  }
  return false
}

/** One continuous white “sheet” — edge-to-edge in preview; dividers with symmetric rhythm. */
function LetterheadContinuitySheet({
  blocks,
  language,
  theme,
}: {
  blocks: ProposalBlock[]
  language: DeckLanguage
  theme: ProposalDeckTheme
}) {
  return (
    <div
      className={LETTERHEAD_SHEET_BLEED}
      style={{
        ...letterheadSectionCssVars(theme),
        backgroundColor: 'var(--deck-bg)',
        color: 'var(--deck-fg)',
      }}
    >
      {blocks.map((block, idx) => (
        <div
          key={block.id}
          className={cn(
            'px-4 sm:px-5',
            idx === 0 && 'pt-5',
            idx === blocks.length - 1 && 'pb-5',
            idx > 0 && 'mt-8 border-t border-[color:var(--deck-line)] pt-8',
          )}
        >
          <LetterheadBlockInner block={block} language={language} />
        </div>
      ))}
    </div>
  )
}

function LetterheadBlockInner({
  block,
  language,
}: {
  block: ProposalBlock
  language: DeckLanguage
}) {
  switch (block.type) {
    case 'project_scope':
      return <ProjectScope {...block.props} letterheadAlign />
    case 'pricing':
      return <Pricing props={block.props} language={language} letterheadAlign />
    case 'timeline':
      return <Timeline {...block.props} letterheadAlign />
    case 'terms':
      return <Terms {...block.props} letterheadAlign />
    default:
      return null
  }
}

function HeroOrPlaceholder({
  imageUrl,
  label,
}: {
  imageUrl: string | null | undefined
  label: string
}) {
  if (imageUrl) {
    return (
      <img
        src={imageUrl}
        alt=""
        className="mb-8 aspect-[21/9] w-full rounded-sm border border-white/10 object-cover"
      />
    )
  }
  return (
    <div
      className="relative mb-8 aspect-[21/9] w-full overflow-hidden rounded-sm border border-white/10"
      style={{
        backgroundColor: 'var(--deck-surface)',
        backgroundImage: `linear-gradient(to right, color-mix(in srgb, var(--deck-line) 33%, transparent) 1px, transparent 1px),
          linear-gradient(to bottom, color-mix(in srgb, var(--deck-line) 33%, transparent) 1px, transparent 1px)`,
        backgroundSize: '32px 32px',
      }}
      aria-hidden
    >
      <span className="absolute inset-0 flex items-center justify-center text-[10px] uppercase tracking-[0.25em] text-[color:var(--deck-muted)]">
        {label}
      </span>
    </div>
  )
}

function CoverFieldPiece({
  fieldId,
  props,
  heroTagLine,
}: {
  fieldId: CoverFieldId
  props: Extract<ProposalBlock, { type: 'cover' }>['props']
  heroTagLine?: string | null
}) {
  switch (fieldId) {
    case 'heroImageUrl':
      return <HeroOrPlaceholder imageUrl={props.heroImageUrl ?? null} label="Visualization" />
    case 'clientLogoUrl':
      return props.clientLogoUrl ? (
        <img
          src={props.clientLogoUrl}
          alt=""
          className="mb-6 max-h-14 w-auto object-contain object-left"
        />
      ) : null
    case 'dateLabel':
      return props.dateLabel ? (
        <p className="text-xs font-medium uppercase tracking-[0.2em] text-[color:var(--deck-accent)]">
          {props.dateLabel}
        </p>
      ) : null
    case 'headline':
      return (
        <div className="space-y-4">
          <div className="h-px w-16 bg-[color:var(--deck-accent)]" aria-hidden />
          <h1 className="text-3xl font-semibold uppercase leading-tight tracking-[0.14em] text-[color:var(--deck-fg)]">
            {props.headline}
          </h1>
          {heroTagLine?.trim() ? (
            <p className="text-[11px] font-medium uppercase tracking-[0.22em] text-[color:var(--deck-muted)]">
              {heroTagLine}
            </p>
          ) : null}
        </div>
      )
    case 'subtitle':
      return (
        <p className="text-base leading-relaxed text-[color:var(--deck-muted)]">{props.subtitle}</p>
      )
    case 'clientCompany':
      return props.clientCompany ? (
        <p className="text-sm font-medium text-[color:var(--deck-fg)]">{props.clientCompany}</p>
      ) : null
    case 'contactName':
      return props.contactName ? (
        <p className="text-sm text-[color:var(--deck-muted)]">{props.contactName}</p>
      ) : null
    case 'contactRole':
      return props.contactRole ? (
        <p className="text-sm text-[color:var(--deck-muted)]">{props.contactRole}</p>
      ) : null
    case 'contactEmail':
      return props.contactEmail ? (
        <p className="text-sm text-[color:var(--deck-muted)]">{props.contactEmail}</p>
      ) : null
    default:
      return null
  }
}

function CoverLetterheadBand({
  props,
}: {
  props: Extract<ProposalBlock, { type: 'cover' }>['props']
}) {
  const { t } = useTranslation()
  const hasBands = props.senderBlock?.trim() || props.recipientBlock?.trim()
  const hasDocLines =
    props.documentKindLine?.trim() ||
    props.issuedLine?.trim() ||
    props.validLine?.trim()
  if (!hasBands && !hasDocLines) return null

  const light = props.letterheadSurface === 'light'

  return (
    <div
      className={cn(
        'mb-10 grid gap-8 border-b border-[color:var(--deck-line)] pb-10',
        light && 'rounded-sm px-5 py-6',
      )}
      style={
        light
          ? {
              backgroundColor: 'var(--deck-letterhead-bg)',
              color: 'var(--deck-letterhead-fg)',
            }
          : undefined
      }
    >
      {hasBands ? (
        <div className="grid gap-8 md:grid-cols-2">
          <div className="min-w-0 space-y-1 whitespace-pre-wrap text-[11px] leading-relaxed text-[color:var(--deck-muted)]">
            {props.senderBlock?.trim() ? props.senderBlock : null}
          </div>
          <div className="min-w-0">
            <p className="mb-2 text-[10px] font-semibold uppercase tracking-[0.28em] text-[color:var(--deck-accent)]">
              {t('proposals.cover.preparedFor')}
            </p>
            <div
              className={cn(
                'whitespace-pre-wrap text-[11px] leading-relaxed',
                light
                  ? 'text-[color:var(--deck-letterhead-fg)]'
                  : 'text-[color:var(--deck-fg)]',
              )}
            >
              {props.recipientBlock?.trim() ? props.recipientBlock : null}
            </div>
          </div>
        </div>
      ) : null}
      {hasDocLines ? (
        <div className="flex flex-wrap gap-x-10 gap-y-2 border-t border-[color:var(--deck-line)] pt-6 text-[11px]">
          {props.documentKindLine?.trim() ? (
            <span className="font-medium uppercase tracking-[0.2em] text-[color:var(--deck-accent)]">
              {props.documentKindLine}
            </span>
          ) : null}
          {props.issuedLine?.trim() ? (
            <span className="text-[color:var(--deck-muted)]">{props.issuedLine}</span>
          ) : null}
          {props.validLine?.trim() ? (
            <span className="text-[color:var(--deck-muted)]">{props.validLine}</span>
          ) : null}
        </div>
      ) : null}
    </div>
  )
}

function Cover({
  props,
  heroTagLine,
}: {
  props: Extract<ProposalBlock, { type: 'cover' }>['props']
  heroTagLine?: string | null
}) {
  const order = props.fieldOrder
  return (
    <section className="border-b border-[color:var(--deck-line)] pb-12">
      <CoverLetterheadBand props={props} />
      {order.map((fieldId, idx) => (
        <div key={fieldId} className={idx === 0 ? '' : 'mt-4'}>
          <CoverFieldPiece fieldId={fieldId} props={props} heroTagLine={heroTagLine} />
        </div>
      ))}
    </section>
  )
}

function ServiceTagsPreview({
  props,
}: {
  props: Extract<ProposalBlock, { type: 'service_tags' }>['props']
}) {
  return (
    <section className="space-y-5">
      <h2 className="text-base font-semibold uppercase tracking-[0.18em] text-[color:var(--deck-fg)]">
        {props.title}
      </h2>
      <div className="flex flex-wrap gap-2">
        {props.entries.map((e, idx) => (
          <span
            key={`${e.sourceId ?? 'custom'}-${idx}`}
            className="rounded-md px-3 py-1.5 text-[11px] font-medium uppercase tracking-[0.12em] text-[color:var(--deck-accent)]"
            style={{ backgroundColor: 'var(--deck-tag-chip-bg)' }}
          >
            {e.label}
          </span>
        ))}
      </div>
    </section>
  )
}

function About(props: Extract<ProposalBlock, { type: 'about_2mb' }>['props']) {
  const order = props.fieldOrder
  return (
    <section className="space-y-6">
      {order.map((fid) =>
        fid === 'title' ? (
          <h2
            key={fid}
            className="text-base font-semibold uppercase tracking-[0.18em] text-[color:var(--deck-fg)]"
          >
            {props.title}
          </h2>
        ) : fid === 'body' ? (
          <p key={fid} className="text-sm leading-relaxed text-[color:var(--deck-muted)]">
            {props.body}
          </p>
        ) : (
          <div
            key={fid}
            className="grid gap-px overflow-hidden rounded-sm border border-white/10 bg-[color:var(--deck-line)] sm:grid-cols-2 lg:grid-cols-3"
          >
            {props.kpis.map((k, idx) => (
              <div
                key={`${idx}-${k.label.slice(0, 24)}`}
                className="bg-[color:var(--deck-surface)] p-5"
              >
                <p className="text-2xl font-semibold tabular-nums text-[color:var(--deck-accent)]">
                  {k.value}
                </p>
                <p className="mt-2 text-[10px] font-medium uppercase tracking-wider text-[color:var(--deck-muted)]">
                  {k.label}
                </p>
              </div>
            ))}
          </div>
        ),
      )}
    </section>
  )
}

function WhyUs(props: Extract<ProposalBlock, { type: 'why_us' }>['props']) {
  const order = props.fieldOrder
  return (
    <section className="space-y-6">
      {order.map((fid) =>
        fid === 'title' ? (
          <h2
            key={fid}
            className="text-base font-semibold uppercase tracking-[0.18em] text-[color:var(--deck-fg)]"
          >
            {props.title}
          </h2>
        ) : (
          <ul key={fid} className="space-y-3 text-sm leading-relaxed text-[color:var(--deck-muted)]">
            {props.bullets.map((b, idx) => (
              <li key={`${idx}-${b.slice(0, 24)}`} className="flex gap-3">
                <span
                  className="mt-2 h-1 w-1 shrink-0 rounded-full bg-[color:var(--deck-accent)]"
                  aria-hidden
                />
                <span>{b}</span>
              </li>
            ))}
          </ul>
        ),
      )}
    </section>
  )
}

function Testimonials(props: Extract<ProposalBlock, { type: 'testimonials' }>['props']) {
  return (
    <section className="space-y-8">
      <h2 className="text-base font-semibold uppercase tracking-[0.18em] text-[color:var(--deck-fg)]">
        {props.title}
      </h2>
      <div className="space-y-6">
        {props.items.map((t, idx) => (
          <blockquote
            key={`${idx}-${t.name}-${t.quote.slice(0, 32)}`}
            className="rounded-sm border border-white/10 bg-[color:var(--deck-surface)] p-5"
          >
            <p className="text-sm italic leading-relaxed text-[color:var(--deck-fg)]">
              &ldquo;{t.quote}&rdquo;
            </p>
            <footer className="mt-4 text-xs text-[color:var(--deck-muted)]">
              {t.name} · {t.role} · {t.company}
            </footer>
          </blockquote>
        ))}
      </div>
    </section>
  )
}

function CaseVisual({
  imageUrl,
}: {
  imageUrl: string | null | undefined
}) {
  if (imageUrl) {
    return (
      <img
        src={imageUrl}
        alt=""
        className="mb-4 aspect-video w-full rounded-sm border border-[color:var(--deck-line)] object-cover"
      />
    )
  }
  return (
    <div
      className="relative mb-4 aspect-video w-full overflow-hidden rounded-sm border border-[color:var(--deck-line)]"
      style={{
        backgroundColor: 'var(--deck-panel-plum)',
        backgroundImage: `linear-gradient(to right, color-mix(in srgb, var(--deck-line) 27%, transparent) 1px, transparent 1px),
          linear-gradient(to bottom, color-mix(in srgb, var(--deck-line) 27%, transparent) 1px, transparent 1px)`,
        backgroundSize: '24px 24px',
      }}
      aria-hidden
    >
      <span className="absolute inset-0 flex items-center justify-center text-[10px] uppercase tracking-[0.2em] text-[color:var(--deck-muted)]">
        RENDER
      </span>
    </div>
  )
}

function ComparableCases(props: Extract<ProposalBlock, { type: 'comparable_cases' }>['props']) {
  const threePlus = props.cases.length >= 3
  return (
    <section className="space-y-6">
      <h2 className="text-base font-semibold uppercase tracking-[0.18em] text-[color:var(--deck-fg)]">
        {props.title}
      </h2>
      <div
        className={cn(
          'grid gap-4 md:grid-cols-2',
          threePlus && 'lg:grid-cols-3',
        )}
      >
        {props.cases.map((c, idx) => (
          <div
            key={`${c.name}-${idx}`}
            className="rounded-sm border border-[color:var(--deck-line)] p-5"
            style={{
              backgroundColor: 'var(--deck-case-card-bg)',
            }}
          >
            <CaseVisual imageUrl={c.imageUrl} />
            <p className="font-medium text-[color:var(--deck-fg)]">{c.name}</p>
            <p className="mt-2 text-sm leading-relaxed text-[color:var(--deck-muted)]">{c.line}</p>
          </div>
        ))}
      </div>
    </section>
  )
}

function ProjectScope(
  props: Extract<ProposalBlock, { type: 'project_scope' }>['props'] & {
    letterheadAlign?: boolean
  },
) {
  const order = props.fieldOrder
  const lh = props.letterheadAlign

  const titleRow = (title: string) => (
    <h2 className="text-base font-semibold uppercase tracking-[0.18em] text-[color:var(--deck-fg)]">{title}</h2>
  )

  return (
    <section className="space-y-6">
      {order.map((fid) =>
        fid === 'title' ? (
          <div key={fid}>{titleRow(props.title)}</div>
        ) : fid === 'imageUrl' ? (
          props.imageUrl ? (
            <img
              key={fid}
              src={props.imageUrl}
              alt=""
              className="aspect-video w-full rounded-sm border border-[color:var(--deck-line)] object-cover"
            />
          ) : null
        ) : lh ? (
          <ul
            key={fid}
            className="m-0 list-none space-y-3 p-0 ps-0 text-sm leading-relaxed text-[color:var(--deck-muted)]"
          >
            {props.bullets.map((b, idx) => (
              <li key={`${idx}-${b.slice(0, 20)}`} className={cn('flex', LH_GAP)}>
                <span
                  className={cn(LH_RAIL, 'flex justify-center pt-2')}
                  aria-hidden
                >
                  <span className="h-1 w-1 rounded-full bg-[color:var(--deck-accent)]" />
                </span>
                <span className="min-w-0 flex-1">{b}</span>
              </li>
            ))}
          </ul>
        ) : (
          <ul
            key={fid}
            className="m-0 list-none space-y-3 p-0 ps-0 text-sm leading-relaxed text-[color:var(--deck-muted)]"
          >
            {props.bullets.map((b, idx) => (
              <li key={`${idx}-${b.slice(0, 20)}`} className="flex gap-3">
                <span
                  className="mt-2 h-1 w-1 shrink-0 rounded-full bg-[color:var(--deck-accent)]"
                  aria-hidden
                />
                <span>{b}</span>
              </li>
            ))}
          </ul>
        ),
      )}
    </section>
  )
}

function Pricing({
  props,
  language,
}: {
  props: Extract<ProposalBlock, { type: 'pricing' }>['props']
  language: DeckLanguage
  letterheadAlign?: boolean
}) {
  const labels = pricingTableLabels(language)

  const titleRow = (
    <h2 className="text-base font-semibold uppercase tracking-[0.18em] text-[color:var(--deck-fg)]">{props.title}</h2>
  )

  const tableBlock = (
    <div className="overflow-hidden rounded-sm border border-[color:var(--deck-line)]">
      <table className="w-full border-collapse text-sm">
        <thead>
          <tr className="bg-[color:var(--deck-surface)] text-left">
            <th className="border-b border-[color:var(--deck-line)] px-3 py-3 text-left text-[10px] font-semibold uppercase tracking-wider text-[color:var(--deck-accent)]">
              {labels.package}
            </th>
            <th className="border-b border-[color:var(--deck-line)] px-3 py-3 text-[10px] font-semibold uppercase tracking-wider text-[color:var(--deck-accent)]">
              {labels.deliverables}
            </th>
            <th className="border-b border-[color:var(--deck-line)] px-3 py-3 text-right text-[10px] font-semibold uppercase tracking-wider text-[color:var(--deck-accent)]">
              {labels.price}
            </th>
          </tr>
        </thead>
        <tbody>
          {props.rows.map((r, idx) => (
            <tr
              key={`${r.package}-${idx}`}
              className="border-b border-[color:var(--deck-line)]/45 bg-transparent last:border-b-0"
            >
              <td className="px-3 py-3 align-top font-medium text-[color:var(--deck-fg)]">{r.package}</td>
              <td className="px-3 py-3 align-top text-[color:var(--deck-muted)]">{r.deliverables}</td>
              <td className="px-3 py-3 text-right tabular-nums text-[color:var(--deck-fg)]">{r.price}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )

  return (
    <section className="space-y-6">
      {titleRow}
      {tableBlock}
    </section>
  )
}

function Timeline(
  props: Extract<ProposalBlock, { type: 'timeline' }>['props'] & { letterheadAlign?: boolean },
) {
  const titleRow = (
    <h2 className="text-base font-semibold uppercase tracking-[0.18em] text-[color:var(--deck-fg)]">
      {props.title}
    </h2>
  )

  const milestones = (
    <div className="space-y-0">
      {props.milestones.map((m, idx) => (
        <div
          key={`${m.week}-${idx}`}
          className="flex gap-5 border-b border-[color:var(--deck-line)]/45 py-4 last:border-b-0"
        >
          <span className="w-28 shrink-0 text-[10px] font-semibold uppercase tracking-wider text-[color:var(--deck-accent)]">
            {m.week}
          </span>
          <span className="min-w-0 flex-1 text-sm leading-relaxed text-[color:var(--deck-muted)]">{m.label}</span>
        </div>
      ))}
    </div>
  )

  return (
    <section className="space-y-6">
      {titleRow}
      {milestones}
    </section>
  )
}

function Terms(
  props: Extract<ProposalBlock, { type: 'terms' }>['props'] & { letterheadAlign?: boolean },
) {
  if (props.letterheadAlign) {
    return (
      <section>
        <p className="text-xs leading-relaxed text-[color:var(--deck-muted)]">{props.body}</p>
      </section>
    )
  }
  return (
    <section>
      <p className="text-xs leading-relaxed text-[color:var(--deck-muted)]">{props.body}</p>
    </section>
  )
}

function VisualGridImagePlaceholder() {
  return (
    <div
      className="flex min-h-[120px] w-full flex-col items-center justify-center px-4 py-8"
      style={{
        backgroundColor: 'var(--deck-surface-tint)',
        backgroundImage: `linear-gradient(to right, color-mix(in srgb, var(--deck-line) 27%, transparent) 1px, transparent 1px),
          linear-gradient(to bottom, color-mix(in srgb, var(--deck-line) 27%, transparent) 1px, transparent 1px)`,
        backgroundSize: '24px 24px',
      }}
      aria-hidden
    >
      <span className="text-[10px] uppercase tracking-[0.2em] text-[color:var(--deck-muted)]">
        Image
      </span>
    </div>
  )
}

function VisualGridCell({
  cell,
}: {
  cell: Extract<ProposalBlock, { type: 'visual_grid' }>['props']['rows'][number]['cells'][number]
}) {
  if (cell.kind === 'image') {
    return (
      <div
        className="flex h-full min-h-[120px] min-w-0 flex-col justify-center overflow-hidden rounded-xl"
        style={{ backgroundColor: 'var(--deck-surface-tint)' }}
      >
        {cell.imageUrl ? (
          <img
            src={cell.imageUrl}
            alt=""
            className="mx-auto block h-auto max-h-full w-full object-contain"
          />
        ) : (
          <VisualGridImagePlaceholder />
        )}
      </div>
    )
  }

  return (
    <div
      className="flex h-full min-h-[120px] w-full min-w-0 flex-col items-center justify-center overflow-hidden rounded-xl p-5 text-center"
      style={{ backgroundColor: 'var(--deck-panel-plum)' }}
    >
      <div className="w-full min-w-0">
        {cell.heading ? (
          <p className="w-full max-w-full whitespace-normal text-sm font-semibold leading-snug text-[color:var(--deck-fg)] wrap-anywhere">
            {cell.heading}
          </p>
        ) : null}
        {cell.body ? (
          <p
            className={cn(
              'w-full max-w-full whitespace-normal text-sm leading-relaxed text-[color:var(--deck-muted)] wrap-anywhere',
              cell.heading ? 'mt-3' : '',
            )}
          >
            {cell.body}
          </p>
        ) : null}
        {!cell.heading && !cell.body ? (
          <p className="text-sm text-[color:var(--deck-muted)]/60">…</p>
        ) : null}
      </div>
    </div>
  )
}

function VisualGrid(props: Extract<ProposalBlock, { type: 'visual_grid' }>['props']) {
  return (
    <section className="space-y-3">
      {props.sectionTitle ? (
        <h2 className="text-base font-semibold uppercase tracking-[0.18em] text-[color:var(--deck-fg)]">
          {props.sectionTitle}
        </h2>
      ) : null}
      <div className="flex flex-col gap-3">
        {props.rows.map((row) => (
          <div key={row.id} className="flex w-full items-stretch gap-2">
            {row.cells.map((cell) => (
              <div
                key={cell.id}
                className="flex min-h-0 min-w-0 flex-col"
                style={{
                  flex: `${visualGridCellFlexGrow(cell)} 1 0%`,
                }}
              >
                <VisualGridCell cell={cell} />
              </div>
            ))}
          </div>
        ))}
      </div>
    </section>
  )
}

function ServiceMatrix({
  props,
}: {
  props: Extract<ProposalBlock, { type: 'service_matrix' }>['props']
}) {
  const cols = props.columnLabels.length
  return (
    <section className="space-y-6">
      <h2 className="text-base font-semibold uppercase tracking-[0.18em] text-[color:var(--deck-fg)]">
        {props.title}
      </h2>
      <div className="overflow-x-auto overflow-hidden rounded-sm border border-white/10">
        <table className="w-full min-w-[280px] border-collapse text-sm">
          <thead>
            <tr className="bg-[color:var(--deck-surface)] text-left">
              <th className="border-b border-white/10 px-3 py-2.5 text-[10px] font-semibold uppercase tracking-wider text-[color:var(--deck-muted)]" />
              {props.columnLabels.map((label, i) => (
                <th
                  key={`${label}-${i}`}
                  className="border-b border-white/10 px-3 py-2.5 text-center text-[10px] font-semibold uppercase tracking-wider text-[color:var(--deck-accent)]"
                >
                  {label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {props.rows.map((row) => (
              <tr
                key={row.id}
                className="border-b border-white/[0.06] last:border-b-0"
              >
                <td className="px-3 py-2.5 font-medium text-[color:var(--deck-fg)] wrap-anywhere">
                  {row.label}
                </td>
                {Array.from({ length: cols }, (_, i) => {
                  const on = Boolean(row.included[i])
                  return (
                    <td key={i} className="px-3 py-2.5 text-center align-middle text-[color:var(--deck-accent)]">
                      {on ? <Check className="inline-block h-4 w-4" strokeWidth={2.5} aria-label="" /> : <span className="text-[color:var(--deck-muted)]/50">—</span>}
                    </td>
                  )
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  )
}

function VideoBlock({ props }: { props: Extract<ProposalBlock, { type: 'video' }>['props'] }) {
  const { t } = useTranslation()
  const title = props.title?.trim()
  const playback = useMemo(() => {
    if (props.source === 'embed') {
      return resolveVideoPlayback(props.embedUrl)
    }
    if (props.source === 'url') {
      return { mode: 'video' as const, src: props.fileUrl }
    }
    return { mode: 'video' as const, src: props.fileUrl }
  }, [props])

  if (props.source === 'embed' && !props.embedUrl.trim()) {
    return (
      <section className="space-y-3">
        {title ? (
          <h2 className="text-base font-semibold uppercase tracking-[0.18em] text-[color:var(--deck-fg)]">
            {title}
          </h2>
        ) : null}
        <p className="text-sm text-[color:var(--deck-muted)]/80">{t('proposals.video.placeholder')}</p>
      </section>
    )
  }

  if (props.source === 'upload' && !props.fileUrl) {
    return (
      <section className="space-y-3">
        {title ? (
          <h2 className="text-base font-semibold uppercase tracking-[0.18em] text-[color:var(--deck-fg)]">
            {title}
          </h2>
        ) : null}
        <p className="text-sm text-[color:var(--deck-muted)]/80">{t('proposals.video.placeholder')}</p>
      </section>
    )
  }

  if (props.source === 'url' && !props.fileUrl.trim()) {
    return (
      <section className="space-y-3">
        {title ? (
          <h2 className="text-base font-semibold uppercase tracking-[0.18em] text-[color:var(--deck-fg)]">
            {title}
          </h2>
        ) : null}
        <p className="text-sm text-[color:var(--deck-muted)]/80">{t('proposals.video.placeholder')}</p>
      </section>
    )
  }

  if (!playback) {
    return (
      <section className="space-y-3">
        {title ? (
          <h2 className="text-base font-semibold uppercase tracking-[0.18em] text-[color:var(--deck-fg)]">
            {title}
          </h2>
        ) : null}
        <p className="text-sm text-[color:var(--deck-muted)]">{t('proposals.video.invalidUrl')}</p>
      </section>
    )
  }

  return (
    <section className="space-y-4">
      {title ? (
        <h2 className="text-base font-semibold uppercase tracking-[0.18em] text-[color:var(--deck-fg)]">
          {title}
        </h2>
      ) : null}
      <div className="overflow-hidden rounded-sm border border-white/10">
        {playback.mode === 'iframe' ? (
          <div className="relative aspect-video w-full">
            <iframe
              title={title || 'Video'}
              src={playback.src}
              className="absolute inset-0 h-full w-full"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
              allowFullScreen
            />
          </div>
        ) : (
          <video
            className="aspect-video w-full object-contain"
            controls
            playsInline
            preload="metadata"
            src={playback.src}
          />
        )}
      </div>
    </section>
  )
}

function ImageComparisonPreview({
  props,
}: {
  props: Extract<ProposalBlock, { type: 'image_comparison' }>['props']
}) {
  const { t } = useTranslation()
  const initial = props.initialSplitPercent ?? 50
  const [split, setSplit] = useState(initial)
  const wrapRef = useRef<HTMLDivElement>(null)
  const dragging = useRef(false)
  const rangeId = useId()

  useEffect(() => {
    setSplit(initial)
  }, [initial, props.beforeUrl, props.afterUrl])

  const setFromClientX = useCallback((clientX: number) => {
    const el = wrapRef.current
    if (!el) return
    const rect = el.getBoundingClientRect()
    const x = Math.min(Math.max(clientX - rect.left, 0), rect.width)
    const pct = rect.width > 0 ? Math.round((x / rect.width) * 100) : 50
    setSplit(pct)
  }, [])

  const onPointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    if (e.button !== 0) return
    dragging.current = true
    wrapRef.current?.setPointerCapture(e.pointerId)
    setFromClientX(e.clientX)
  }

  const onPointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!dragging.current) return
    setFromClientX(e.clientX)
  }

  const onPointerUp = (e: React.PointerEvent<HTMLDivElement>) => {
    dragging.current = false
    try {
      wrapRef.current?.releasePointerCapture(e.pointerId)
    } catch {
      /* not capturing */
    }
  }

  const before = props.beforeUrl
  const after = props.afterUrl
  if (!before || !after) {
    return (
      <section className="space-y-3">
        <div
          className="flex aspect-video w-full flex-col items-center justify-center rounded-sm border border-white/10 bg-[color:var(--deck-surface)] text-sm text-[color:var(--deck-muted)]"
          aria-hidden
        >
          {t('proposals.imageComparison.needBoth')}
        </div>
      </section>
    )
  }

  return (
    <section className="space-y-3">
      <div
        ref={wrapRef}
        className="relative aspect-video w-full select-none overflow-hidden rounded-sm border border-white/10 touch-pan-y"
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerLeave={onPointerUp}
        role="slider"
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={split}
        aria-label="Before and after comparison"
      >
        <img src={after} alt="" className="absolute inset-0 h-full w-full object-cover" />
        <div
          className="absolute inset-0 overflow-hidden"
          style={{ clipPath: `inset(0 ${100 - split}% 0 0)` }}
        >
          <img src={before} alt="" className="h-full w-full object-cover" />
        </div>
        <div
          className="pointer-events-none absolute inset-y-0 w-0.5 bg-white"
          style={{ left: `${split}%`, transform: 'translateX(-50%)' }}
        />
        <div
          className="pointer-events-none absolute flex h-9 w-9 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full border border-black/25 bg-white text-xs font-bold text-black"
          style={{ left: `${split}%`, top: '50%' }}
          aria-hidden
        >
          ‹ ›
        </div>
        {(props.beforeLabel || props.afterLabel) && (
          <div className="pointer-events-none absolute inset-x-0 top-2 flex justify-between gap-2 px-2 text-[10px] font-semibold uppercase tracking-wider text-white">
            {props.beforeLabel ? (
              <span className="rounded-sm bg-[color:var(--ui-scrim-chip)] px-1.5 py-0.5">{props.beforeLabel}</span>
            ) : (
              <span aria-hidden className="inline-block min-w-0 shrink" />
            )}
            {props.afterLabel ? (
              <span className="rounded-sm bg-[color:var(--ui-scrim-chip)] px-1.5 py-0.5">{props.afterLabel}</span>
            ) : (
              <span aria-hidden className="inline-block min-w-0 shrink" />
            )}
          </div>
        )}
      </div>
      <label className="sr-only" htmlFor={rangeId}>
        Comparison position
      </label>
      <input
        id={rangeId}
        type="range"
        min={0}
        max={100}
        value={split}
        className="mt-1 w-full accent-[color:var(--deck-accent)]"
        onChange={(e) => setSplit(Number(e.target.value))}
      />
    </section>
  )
}

function renderDeckPreviewBlock(
  block: ProposalBlock,
  blockIndex: number,
  blocks: ProposalBlock[],
  language: DeckLanguage,
  theme: ProposalDeckTheme,
): React.ReactNode {
  const coverHeroTagLine =
    block.type === 'cover' ? heroTagLineForCoverBlock(blocks, blockIndex) : null
  switch (block.type) {
    case 'cover':
      return <Cover props={block.props} heroTagLine={coverHeroTagLine} />
    case 'about_2mb':
      return <About {...block.props} />
    case 'why_us':
      return <WhyUs {...block.props} />
    case 'testimonials':
      return <Testimonials {...block.props} />
    case 'comparable_cases':
      return <ComparableCases {...block.props} />
    case 'project_scope':
      return (
        <DeckSectionShell surface={block.props.sectionSurface ?? 'deck'} theme={theme}>
          <ProjectScope {...block.props} />
        </DeckSectionShell>
      )
    case 'pricing':
      return (
        <DeckSectionShell surface={block.props.sectionSurface ?? 'deck'} theme={theme}>
          <Pricing props={block.props} language={language} />
        </DeckSectionShell>
      )
    case 'timeline':
      return (
        <DeckSectionShell surface={block.props.sectionSurface ?? 'deck'} theme={theme}>
          <Timeline {...block.props} />
        </DeckSectionShell>
      )
    case 'terms':
      return (
        <DeckSectionShell surface={block.props.sectionSurface ?? 'deck'} theme={theme}>
          <Terms {...block.props} />
        </DeckSectionShell>
      )
    case 'visual_grid':
      return <VisualGrid {...block.props} />
    case 'service_matrix':
      return <ServiceMatrix props={block.props} />
    case 'video':
      return <VideoBlock props={block.props} />
    case 'service_tags':
      return <ServiceTagsPreview props={block.props} />
    case 'image_comparison':
      return <ImageComparisonPreview props={block.props} />
  }
}

export function ProposalDeckPreview({
  blocks,
  language = 'en',
  themeOverride,
  studioLogoOverride,
  deckFontsOverride,
  brandKitConfigured = false,
}: {
  blocks: ProposalBlock[]
  language?: DeckLanguage
  /** Live Brand kit palette — wins over cover snapshot in editor preview. */
  themeOverride?: ProposalDeckTheme | null
  studioLogoOverride?: string | null
  deckFontsOverride?: ProposalDeckFonts | null
  /** When true, never show the built-in 2MB wordmark — only kit logo or empty state. */
  brandKitConfigured?: boolean
}) {
  const { t } = useTranslation()
  const deckTheme = themeOverride ?? resolveDeckThemeFromBlocks(blocks)
  const studioLogoUrl = studioLogoOverride ?? resolveStudioLogoFromBlocks(blocks)
  const deckFonts = deckFontsOverride ?? null

  useEffect(() => {
    if (!deckFonts?.fonts.length) return
    injectProposalDeckFonts(deckFonts.fonts)
  }, [deckFonts])
  const body: React.ReactNode[] = []
  let i = 0
  while (i < blocks.length) {
    const block = blocks[i]
    if (isLetterheadSurfaceBlock(block)) {
      const run: ProposalBlock[] = []
      while (i < blocks.length && isLetterheadSurfaceBlock(blocks[i])) {
        run.push(blocks[i])
        i++
      }
      body.push(
        <LetterheadContinuitySheet
          key={`letterhead-${run[0].id}`}
          blocks={run}
          language={language}
          theme={deckTheme}
        />,
      )
      continue
    }
    body.push(
      <Fragment key={block.id}>
        {renderDeckPreviewBlock(block, i, blocks, language, deckTheme)}
      </Fragment>,
    )
    i++
  }

  return (
    <div
      className="proposal-deck w-full max-w-none space-y-12 px-4 pt-8 pb-0 sm:space-y-14 sm:px-5 sm:pt-10 sm:pb-0 [&_h1]:font-[family-name:var(--deck-font-accent)] [&_h2]:font-[family-name:var(--deck-font-accent)] [&_th]:font-[family-name:var(--deck-font-accent)]"
      style={deckRootStyle(deckTheme, deckFonts)}
    >
      <header className="flex flex-wrap items-end justify-between gap-4 border-b border-[color:var(--deck-line)] pb-8">
        {studioLogoUrl ? (
          <img
            src={studioLogoUrl}
            alt=""
            className="h-[2.75rem] max-w-[10rem] shrink-0 object-contain object-left"
          />
        ) : brandKitConfigured ? (
          <p className="text-[10px] font-medium uppercase tracking-[0.2em] text-[color:var(--deck-muted)]">
            {t('studioSettings.brandKit.noPrimaryLogo')}
          </p>
        ) : null}
        <p className="text-[10px] font-medium uppercase tracking-[0.35em] text-[color:var(--deck-muted)]">
          Proposal
        </p>
      </header>

      {body}
    </div>
  )
}

function heroTagLineForCoverBlock(blocks: ProposalBlock[], coverIndex: number): string | null {
  const next = blocks[coverIndex + 1]
  const prev = blocks[coverIndex - 1]
  const tagBlock =
    next?.type === 'service_tags' ? next : prev?.type === 'service_tags' ? prev : null
  if (!tagBlock || tagBlock.type !== 'service_tags') return null
  const line = tagBlock.props.entries
    .map((e) => e.label.trim())
    .filter(Boolean)
    .join(' · ')
  return line || null
}
