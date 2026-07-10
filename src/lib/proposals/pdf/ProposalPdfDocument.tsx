import { Document, Image, Page, Text, View } from '@react-pdf/renderer'
import type { ReactNode } from 'react'
import type { ProposalBlock, VisualCell, VisualRow, CoverFieldId } from '@/lib/proposals/blockSchema'
import { visualGridCellFlexGrow } from '@/lib/proposals/blockSchema'
import {
  DECK_TYPE_SCALE,
  VISUAL_GRID_ROW_HEIGHT_PT,
  type DeckLanguage,
  pricingTableLabels,
} from '@/lib/proposals/deckLayout'
import { resolveDeckThemeFromBlocks, type ProposalDeckTheme } from '@/lib/proposals/deckTheme'
import {
  buildPdfStyles,
  pdfSectionColors,
  type ProposalPdfStyles,
} from '@/lib/proposals/pdf/buildPdfStyles'

function pdfSectionSurface(block: ProposalBlock): 'deck' | 'letterhead' {
  if (
    block.type === 'project_scope' ||
    block.type === 'pricing' ||
    block.type === 'timeline' ||
    block.type === 'terms'
  ) {
    return block.props.sectionSurface ?? 'deck'
  }
  return 'deck'
}

function coverHeroTagLineFromBlocks(
  blocks: ProposalBlock[],
  coverIndex: number,
): string | undefined {
  const next = blocks[coverIndex + 1]
  const prev = blocks[coverIndex - 1]
  const tagBlock =
    next?.type === 'service_tags' ? next : prev?.type === 'service_tags' ? prev : null
  if (!tagBlock || tagBlock.type !== 'service_tags') return undefined
  const line = tagBlock.props.entries
    .map((e) => e.label.trim())
    .filter(Boolean)
    .join(' · ')
  return line || undefined
}

function visualGridTextShellStyle(cell: VisualCell, theme: ProposalDeckTheme) {
  const grow = visualGridCellFlexGrow(cell)
  return {
    flexGrow: grow,
    flexBasis: 0,
    flexShrink: 1,
    minWidth: 0,
    minHeight: VISUAL_GRID_ROW_HEIGHT_PT,
    height: VISUAL_GRID_ROW_HEIGHT_PT,
    justifyContent: 'center' as const,
    alignItems: 'center' as const,
    overflow: 'hidden' as const,
    borderRadius: 8,
    backgroundColor: theme.surfaceTint,
    padding: 16,
  }
}

function visualGridCellShellStyle(cell: VisualCell) {
  const grow = visualGridCellFlexGrow(cell)
  return {
    flexGrow: grow,
    flexBasis: 0,
    flexShrink: 1,
    minWidth: 0,
    minHeight: VISUAL_GRID_ROW_HEIGHT_PT,
    height: VISUAL_GRID_ROW_HEIGHT_PT,
    justifyContent: 'center' as const,
    alignItems: 'center' as const,
    overflow: 'hidden' as const,
    borderRadius: 8,
    padding: 6,
  }
}

function VisualGridCellPdf({
  cell,
  theme,
  styles,
}: {
  cell: VisualCell
  theme: ProposalDeckTheme
  styles: ProposalPdfStyles
}) {
  if (cell.kind === 'image') {
    const shell = visualGridCellShellStyle(cell)
    return (
      <View style={[shell, { backgroundColor: theme.surfaceTint, padding: 0 }]}>
        {cell.imageUrl ? (
          <Image
            src={cell.imageUrl}
            style={{
              width: '100%',
              height: '100%',
              objectFit: 'contain',
            }}
          />
        ) : (
          <Text style={[styles.small, { color: theme.muted }]}>RENDER</Text>
        )}
      </View>
    )
  }
  const textShell = visualGridTextShellStyle(cell, theme)
  return (
    <View style={textShell}>
      <View style={{ width: '100%', minWidth: 0 }}>
        {cell.heading ? (
          <Text
            style={[
              styles.body,
              styles.vgTextBreak,
              {
                color: theme.fg,
                fontWeight: 600,
                textAlign: 'center',
                width: '100%',
                marginBottom: cell.body ? 6 : 0,
              },
            ]}
          >
            {cell.heading}
          </Text>
        ) : null}
        {cell.body ? (
          <Text style={[styles.body, styles.vgTextBreak, { textAlign: 'center', width: '100%' }]}>{cell.body}</Text>
        ) : null}
      </View>
    </View>
  )
}

function VisualGridRowPdf({
  row,
  theme,
  styles,
}: {
  row: VisualRow
  theme: ProposalDeckTheme
  styles: ProposalPdfStyles
}) {
  return (
    <View style={styles.vgRow}>
      {row.cells.map((cell) => (
        <VisualGridCellPdf key={cell.id} cell={cell} theme={theme} styles={styles} />
      ))}
    </View>
  )
}

function CoverLetterheadPdf({
  props,
  language,
  theme,
  styles,
}: {
  props: Extract<ProposalBlock, { type: 'cover' }>['props']
  language: DeckLanguage
  theme: ProposalDeckTheme
  styles: ProposalPdfStyles
}) {
  const hasBands = props.senderBlock?.trim() || props.recipientBlock?.trim()
  const hasDoc =
    props.documentKindLine?.trim() ||
    props.issuedLine?.trim() ||
    props.validLine?.trim()
  if (!hasBands && !hasDoc) return null

  const light = props.letterheadSurface === 'light'
  const bandFg = light ? theme.letterheadFg : theme.muted
  const prepared =
    language === 'de' ? 'Vorbereitet für' : 'Prepared for'

  return (
    <View
      style={{
        marginBottom: 14,
        paddingBottom: 14,
        borderBottomWidth: 1,
        borderBottomColor: theme.line,
        backgroundColor: light ? theme.letterheadBg : undefined,
        padding: light ? 12 : 0,
        borderRadius: light ? 6 : 0,
      }}
    >
      {hasBands ? (
        <View style={{ flexDirection: 'row', gap: 16, marginBottom: hasDoc ? 12 : 0 }}>
          <View style={{ flex: 1 }}>
            <Text style={[styles.small, { color: bandFg }]}>{props.senderBlock}</Text>
          </View>
          <View style={{ flex: 1 }}>
            <Text style={[styles.accentLabel, { marginBottom: 6, color: theme.accent }]}>{prepared}</Text>
            <Text style={[styles.body, { color: light ? theme.letterheadFg : theme.fg }]}>
              {props.recipientBlock}
            </Text>
          </View>
        </View>
      ) : null}
      {hasDoc ? (
        <View
          style={{
            flexDirection: 'row',
            flexWrap: 'wrap',
            gap: 12,
            paddingTop: hasBands ? 10 : 0,
            borderTopWidth: hasBands ? 1 : 0,
            borderTopColor: theme.line,
          }}
        >
          {props.documentKindLine?.trim() ? (
            <Text style={[styles.accentLabel, { color: theme.accent }]}>{props.documentKindLine}</Text>
          ) : null}
          {props.issuedLine?.trim() ? (
            <Text style={[styles.small, { color: bandFg }]}>{props.issuedLine}</Text>
          ) : null}
          {props.validLine?.trim() ? (
            <Text style={[styles.small, { color: bandFg }]}>{props.validLine}</Text>
          ) : null}
        </View>
      ) : null}
    </View>
  )
}

function CoverPdfField({
  fieldId,
  props,
  coverHeroTagLine,
  theme,
  styles,
}: {
  fieldId: CoverFieldId
  props: Extract<ProposalBlock, { type: 'cover' }>['props']
  coverHeroTagLine?: string
  theme: ProposalDeckTheme
  styles: ProposalPdfStyles
}) {
  switch (fieldId) {
    case 'heroImageUrl':
      return props.heroImageUrl ? (
        <Image
          src={props.heroImageUrl}
          style={{
            width: '100%',
            maxHeight: 140,
            marginBottom: 12,
            objectFit: 'cover',
          }}
        />
      ) : null
    case 'clientLogoUrl':
      return props.clientLogoUrl ? (
        <Image
          src={props.clientLogoUrl}
          style={{
            maxHeight: 36,
            width: 140,
            marginBottom: 10,
            objectFit: 'contain',
          }}
        />
      ) : null
    case 'dateLabel':
      return props.dateLabel ? (
        <Text style={[styles.accentLabel, { color: theme.accent }]}>{props.dateLabel}</Text>
      ) : null
    case 'headline':
      return (
        <View wrap={false}>
          <View
            style={{
              width: 48,
              height: 1,
              backgroundColor: theme.accent,
              marginBottom: 10,
            }}
          />
          <Text style={styles.coverHeadline}>{props.headline}</Text>
          {coverHeroTagLine ? (
            <Text style={[styles.small, { marginTop: 8 }]}>{coverHeroTagLine}</Text>
          ) : null}
        </View>
      )
    case 'subtitle':
      return <Text style={styles.coverSubtitle}>{props.subtitle}</Text>
    case 'clientCompany':
      return props.clientCompany ? (
        <Text style={[styles.body, { color: theme.fg }]}>{props.clientCompany}</Text>
      ) : null
    case 'contactName':
      return props.contactName ? <Text style={styles.small}>{props.contactName}</Text> : null
    case 'contactRole':
      return props.contactRole ? <Text style={styles.small}>{props.contactRole}</Text> : null
    case 'contactEmail':
      return props.contactEmail ? <Text style={styles.small}>{props.contactEmail}</Text> : null
    default:
      return null
  }
}

function BlockPdf({
  block,
  language,
  coverHeroTagLine,
  theme,
  styles,
}: {
  block: ProposalBlock
  language: DeckLanguage
  coverHeroTagLine?: string
  theme: ProposalDeckTheme
  styles: ProposalPdfStyles
}) {
  const palette = pdfSectionColors(theme, pdfSectionSurface(block) === 'letterhead')
  switch (block.type) {
    case 'cover':
      return (
        <View style={styles.rule}>
          <CoverLetterheadPdf props={block.props} language={language} theme={theme} styles={styles} />
          {block.props.fieldOrder.map((fid) => (
            <View key={fid} wrap={false}>
              <CoverPdfField
                fieldId={fid}
                props={block.props}
                coverHeroTagLine={coverHeroTagLine}
                theme={theme}
                styles={styles}
              />
            </View>
          ))}
        </View>
      )
    case 'why_us':
      return (
        <View wrap={false}>
          {block.props.fieldOrder.map((fid) =>
            fid === 'title' ? (
              <Text key={fid} style={styles.h2}>
                {block.props.title}
              </Text>
            ) : (
              <View key={fid}>
                {block.props.bullets.map((b) => (
                  <Text key={b} style={styles.body}>
                    • {b}
                  </Text>
                ))}
              </View>
            ),
          )}
        </View>
      )
    case 'about_2mb':
      return (
        <View wrap={false}>
          {block.props.fieldOrder.map((fid) =>
            fid === 'title' ? (
              <Text key={fid} style={styles.h2}>
                {block.props.title}
              </Text>
            ) : fid === 'body' ? (
              <Text key={fid} style={styles.body}>
                {block.props.body}
              </Text>
            ) : (
              <View
                key={fid}
                style={{
                  flexDirection: 'row',
                  flexWrap: 'wrap',
                  marginTop: 12,
                  paddingTop: 12,
                  borderTopWidth: 1,
                  borderTopColor: theme.line,
                }}
              >
                {block.props.kpis.map((k, idx) => (
                  <View key={`kpi-${idx}-${k.label.slice(0, 12)}`} style={[styles.kpiCol, { marginBottom: 12 }]}>
                    <Text style={styles.kpiVal}>{k.value}</Text>
                    <Text style={styles.small}>{k.label}</Text>
                  </View>
                ))}
              </View>
            ),
          )}
        </View>
      )
    case 'testimonials':
      return (
        <View wrap={false}>
          <Text style={styles.h2}>{block.props.title}</Text>
          {block.props.items.map((t, idx) => (
            <View key={`${idx}-${t.name}-${t.quote.slice(0, 40)}`} style={{ marginBottom: 12 }}>
              <Text style={[styles.body, { fontStyle: 'italic' }]}>&ldquo;{t.quote}&rdquo;</Text>
              <Text style={styles.small}>
                {t.name} · {t.role} · {t.company}
              </Text>
            </View>
          ))}
        </View>
      )
    case 'comparable_cases': {
      const n = block.props.cases.length
      const colPct = n >= 3 ? '31%' : '48%'
      return (
        <View wrap={false}>
          <Text style={styles.h2}>{block.props.title}</Text>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', marginTop: 8 }}>
            {block.props.cases.map((c, idx) => (
              <View
                key={`${c.name}-${idx}`}
                style={{
                  width: colPct,
                  marginBottom: 10,
                  padding: 10,
                  backgroundColor: theme.surface,
                  borderRadius: 4,
                  borderWidth: 1,
                  borderColor: theme.line,
                }}
              >
                {c.imageUrl ? (
                  <Image
                    src={c.imageUrl}
                    style={{
                      width: '100%',
                      height: 72,
                      marginBottom: 8,
                      objectFit: 'cover',
                      borderRadius: 3,
                    }}
                  />
                ) : (
                  <View
                    style={{
                      height: 72,
                      marginBottom: 8,
                      borderRadius: 3,
                      backgroundColor: theme.surfaceTint,
                      justifyContent: 'center',
                      alignItems: 'center',
                    }}
                  >
                    <Text style={[styles.small, { fontSize: DECK_TYPE_SCALE.caption }]}>RENDER</Text>
                  </View>
                )}
                <Text style={[styles.body, { color: theme.fg }]}>{c.name}</Text>
                <Text style={styles.small}>{c.line}</Text>
              </View>
            ))}
          </View>
        </View>
      )
    }
    case 'project_scope': {
      const { fg, muted } = palette
      return (
        <View wrap={false}>
          {block.props.fieldOrder.map((fid) =>
            fid === 'title' ? (
              <Text key={fid} style={[styles.h2, { color: fg }]}>
                {block.props.title}
              </Text>
            ) : fid === 'imageUrl' ? (
              block.props.imageUrl ? (
                <Image
                  key={fid}
                  src={block.props.imageUrl}
                  style={{
                    width: '100%',
                    maxHeight: 160,
                    marginBottom: 10,
                    objectFit: 'cover',
                  }}
                />
              ) : null
            ) : (
              <View key={fid}>
                {block.props.bullets.map((b) => (
                  <Text key={b} style={[styles.body, { color: muted }]}>
                    • {b}
                  </Text>
                ))}
              </View>
            ),
          )}
        </View>
      )
    }
    case 'pricing': {
      const pl = pricingTableLabels(language)
      const { fg, muted, line, accent } = palette
      return (
        <View wrap={false}>
          <Text style={[styles.h2, { color: fg }]}>{block.props.title}</Text>
          <View style={[styles.tableHeader, { borderBottomColor: line }]}>
            <Text style={[styles.cell, { flex: 1.2, color: accent }]}>
              {pl.package}
            </Text>
            <Text style={[styles.cell, { flex: 2, color: accent }]}>
              {pl.deliverables}
            </Text>
            <Text style={[styles.cell, { flex: 0.8, textAlign: 'right', color: accent }]}>
              {pl.price}
            </Text>
          </View>
          {block.props.rows.map((r, idx) => (
            <View key={`${idx}-${r.package.slice(0, 24)}`} style={styles.tableRow} wrap={false}>
              <Text style={[styles.cell, { flex: 1.2, color: fg }]}>{r.package}</Text>
              <Text style={[styles.cell, { flex: 2, color: muted }]}>{r.deliverables}</Text>
              <Text style={[styles.cell, { flex: 0.8, textAlign: 'right', color: fg }]}>{r.price}</Text>
            </View>
          ))}
        </View>
      )
    }
    case 'timeline': {
      const { fg, muted, line, accent } = palette
      return (
        <View wrap={false}>
          <Text style={[styles.h2, { color: fg }]}>{block.props.title}</Text>
          {block.props.milestones.map((m) => (
            <View
              key={m.week}
              style={{
                flexDirection: 'row',
                marginBottom: 8,
                borderBottomWidth: 1,
                borderBottomColor: line,
                paddingBottom: 6,
              }}
            >
              <Text style={[styles.small, { width: 80, color: accent }]}>{m.week}</Text>
              <Text style={[styles.body, { color: muted }]}>{m.label}</Text>
            </View>
          ))}
        </View>
      )
    }
    case 'terms': {
      const { muted } = palette
      return (
        <View style={{ marginTop: 12 }}>
          <Text style={[styles.small, { color: muted }]}>{block.props.body}</Text>
        </View>
      )
    }
    case 'service_matrix': {
      const { title, columnLabels, rows } = block.props
      const { fg, muted, line, accent } = palette
      return (
        <View wrap={false}>
          <Text style={styles.h2}>{title}</Text>
          <View
            style={{
              flexDirection: 'row',
              borderBottomWidth: 1,
              borderBottomColor: line,
              paddingBottom: 4,
              marginBottom: 6,
            }}
          >
            <Text style={[styles.small, { width: '26%', color: muted }]}> </Text>
            {columnLabels.map((lab, i) => (
              <Text
                key={`h-${i}-${lab}`}
                style={[styles.small, { flex: 1, textAlign: 'center', color: accent }]}
              >
                {lab}
              </Text>
            ))}
          </View>
          {rows.map((row) => (
            <View key={row.id} style={{ flexDirection: 'row', marginBottom: 4 }}>
              <Text style={[styles.body, { width: '26%', color: fg }]}>{row.label}</Text>
              {columnLabels.map((_, ci) => (
                <Text
                  key={`${row.id}-${ci}`}
                  style={[styles.cell, { flex: 1, textAlign: 'center', color: accent }]}
                >
                  {row.included[ci] ? '✓' : '—'}
                </Text>
              ))}
            </View>
          ))}
        </View>
      )
    }
    case 'video': {
      const title = block.props.title?.trim() || 'Video'
      let urlLine = ''
      if (block.props.source === 'embed') urlLine = block.props.embedUrl
      else urlLine = block.props.fileUrl
      return (
        <View wrap={false}>
          <Text style={styles.h2}>{title}</Text>
          <Text style={styles.small}>{urlLine}</Text>
        </View>
      )
    }
    case 'service_tags':
      return (
        <View wrap={false}>
          <Text style={styles.h2}>{block.props.title}</Text>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginTop: 8 }}>
            {block.props.entries.map((e, idx) => (
              <View
                key={`${e.sourceId ?? 'c'}-${idx}`}
                style={{
                  backgroundColor: theme.tagChipBg,
                  paddingHorizontal: 10,
                  paddingVertical: 6,
                  borderRadius: 4,
                }}
              >
                <Text style={[styles.small, { color: palette.accent }]}>{e.label}</Text>
              </View>
            ))}
          </View>
        </View>
      )
    case 'image_comparison': {
      const p = block.props
      return (
        <View wrap={false}>
          <View style={{ flexDirection: 'row', gap: 8 }}>
            <View style={{ width: '48%' }}>
              {p.beforeUrl ? (
                <Image
                  src={p.beforeUrl}
                  style={{
                    width: '100%',
                    height: 140,
                    objectFit: 'cover',
                    borderRadius: 4,
                  }}
                />
              ) : (
                <Text style={styles.small}>—</Text>
              )}
              {p.beforeLabel ? <Text style={[styles.small, { marginTop: 4 }]}>{p.beforeLabel}</Text> : null}
            </View>
            <View style={{ width: '48%' }}>
              {p.afterUrl ? (
                <Image
                  src={p.afterUrl}
                  style={{
                    width: '100%',
                    height: 140,
                    objectFit: 'cover',
                    borderRadius: 4,
                  }}
                />
              ) : (
                <Text style={styles.small}>—</Text>
              )}
              {p.afterLabel ? <Text style={[styles.small, { marginTop: 4 }]}>{p.afterLabel}</Text> : null}
            </View>
          </View>
        </View>
      )
    }
    case 'visual_grid':
      return null
  }
}

export function ProposalPdfDocument({
  documentTitle,
  metaLine,
  blocks,
  language = 'en',
}: {
  documentTitle: string
  metaLine?: string
  blocks: ProposalBlock[]
  language?: DeckLanguage
}) {
  const theme = resolveDeckThemeFromBlocks(blocks)
  const styles = buildPdfStyles(theme)
  const pages: ReactNode[] = []
  let pageNum = 0

  for (let blockIndex = 0; blockIndex < blocks.length; blockIndex++) {
    const b = blocks[blockIndex]
    if (b.type === 'visual_grid') {
      for (let rowIdx = 0; rowIdx < b.props.rows.length; rowIdx++) {
        const row = b.props.rows[rowIdx]
        pageNum++
        pages.push(
          <Page key={`${b.id}-${row.id}`} size="A4" style={styles.page}>
            {metaLine ? <Text style={styles.meta}>{metaLine}</Text> : null}
            {rowIdx === 0 && b.props.sectionTitle ? (
              <Text style={styles.h2}>{b.props.sectionTitle}</Text>
            ) : null}
            <VisualGridRowPdf row={row} theme={theme} styles={styles} />
          </Page>,
        )
      }
      continue
    }

    pageNum++
    const lh = pdfSectionSurface(b) === 'letterhead'
    const coverHero = b.type === 'cover' ? coverHeroTagLineFromBlocks(blocks, blockIndex) : undefined

    pages.push(
      <Page key={b.id} size="A4" style={lh ? styles.pageLight : styles.page}>
        {metaLine ? <Text style={lh ? styles.metaLight : styles.meta}>{metaLine}</Text> : null}
        <BlockPdf block={b} language={language} coverHeroTagLine={coverHero} theme={theme} styles={styles} />
        {lh ? (
          <View style={styles.letterheadFooter} fixed>
            <Text style={styles.footerBrand}>2mb.studio</Text>
            <Text style={styles.footerPage}>{String(pageNum).padStart(2, '0')}</Text>
          </View>
        ) : null}
      </Page>,
    )
  }

  return <Document title={documentTitle}>{pages}</Document>
}
