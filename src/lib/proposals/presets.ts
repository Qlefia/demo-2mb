import type { ProposalBlock } from './blockSchema'
import {
  emptyCoverProps,
  normalizeAboutFieldOrder,
  normalizeProjectScopeFieldOrder,
} from './blockSchema'

export type ProposalPresetId = 'developer' | 'architect' | 'custom'

function nid(): string {
  return globalThis.crypto.randomUUID()
}

/** Developer-led villa / CGI deck — section order aligned with commercial PDF reference:
 * cover → service tags → showcase video → visual grid → references → testimonials → scope → pricing → timeline → terms.
 */
export function presetDeveloper(): ProposalBlock[] {
  const cover = emptyCoverProps()
  cover.letterheadSurface = 'light'

  const gRow1 = nid()
  const gRow2 = nid()

  return [
    {
      id: nid(),
      type: 'cover',
      props: cover,
    },
    {
      id: nid(),
      type: 'service_tags',
      props: {
        title: 'Leistungen im Fokus',
        entries: [],
      },
    },
    {
      id: nid(),
      type: 'video',
      props: {
        title: 'Latest animation',
        source: 'embed',
        embedUrl: '',
      },
    },
    {
      id: nid(),
      type: 'visual_grid',
      props: {
        sectionTitle: 'Projekt-Galerie',
        rows: [
          {
            id: gRow1,
            cells: [
              {
                id: nid(),
                kind: 'image',
                imageUrl: null,
                imageAspect: 'landscape',
              },
              {
                id: nid(),
                kind: 'image',
                imageUrl: null,
                imageAspect: 'portrait',
              },
            ],
          },
          {
            id: gRow2,
            cells: [
              {
                id: nid(),
                kind: 'image',
                imageUrl: null,
                imageAspect: 'portrait',
              },
              {
                id: nid(),
                kind: 'image',
                imageUrl: null,
                imageAspect: 'landscape',
              },
              {
                id: nid(),
                kind: 'image',
                imageUrl: null,
                imageAspect: 'landscape',
              },
            ],
          },
        ],
      },
    },
    {
      id: nid(),
      type: 'comparable_cases',
      props: {
        title: 'Referenzprojekte',
        cases: [
          {
            name: 'Luxury Residential',
            line: 'Film & Still-Pipeline bis zur Übergabe',
            imageUrl: null,
          },
          {
            name: 'Masterplan Campus',
            line: 'Skalierbare Asset-Produktion über mehrere Phasen',
            imageUrl: null,
          },
        ],
      },
    },
    {
      id: nid(),
      type: 'testimonials',
      props: {
        title: 'Stimmen',
        items: [
          {
            quote:
              'Hochwertige Visuals und klare Prozesse — das beschleunigt Freigaben bei anspruchsvollen Stakeholdern.',
            name: 'Name Platzhalter',
            role: 'Head of Marketing',
            company: 'Kunde Platzhalter',
          },
        ],
      },
    },
    {
      id: nid(),
      type: 'project_scope',
      props: {
        title: 'Leistungsumfang',
        bullets: [
          'Creative Direction & Storyboard',
          'CGI-Produktion und Review-Zyklen',
          'Filmediting / Farbkorrektur / Ton',
          'Lieferung für Print, Web und Präsentation',
        ],
        imageUrl: null,
        fieldOrder: normalizeProjectScopeFieldOrder(undefined),
        sectionSurface: 'letterhead',
      },
    },
    {
      id: nid(),
      type: 'pricing',
      props: {
        title: 'Investition (indikativ)',
        sectionSurface: 'letterhead',
        rows: [
          {
            package: 'Phase — Konzept & Styleframes',
            deliverables: 'Look Definition, Keyframes, Freigaben',
            price: 'auf Anfrage',
          },
          {
            package: 'Phase — Produktion',
            deliverables: 'Assets nach Shotliste, Iterationen nach Vereinbarung',
            price: 'auf Anfrage',
          },
        ],
      },
    },
    {
      id: nid(),
      type: 'timeline',
      props: {
        title: 'Meilensteine',
        sectionSurface: 'letterhead',
        milestones: [
          { week: 'Woche 1–2', label: 'Kickoff, Briefing, Styleframes' },
          { week: 'Woche 3–6', label: 'Produktion & Reviews' },
          { week: 'Woche 7+', label: 'Final Delivery & Übergabe' },
        ],
      },
    },
    {
      id: nid(),
      type: 'terms',
      props: {
        sectionSurface: 'letterhead',
        body: ' ',
      },
    },
  ]
}

/** Architect / planning narrative — visual quality & coordination. */
export function presetArchitect(): ProposalBlock[] {
  const cover = emptyCoverProps()

  return [
    {
      id: nid(),
      type: 'cover',
      props: cover,
    },
    {
      id: nid(),
      type: 'about_2mb',
      props: {
        title: ' ',
        body: ' ',
        kpis: [
          { label: 'Projekte begleitet', value: '49+' },
          { label: 'Jahre Erfahrung', value: '12' },
          { label: 'Länder', value: '8' },
        ],
        fieldOrder: normalizeAboutFieldOrder(undefined),
      },
    },
    {
      id: nid(),
      type: 'comparable_cases',
      props: {
        title: 'Ausgewählte Referenzen',
        cases: [
          { name: 'Hochhausensemble', line: 'Koordination Gewerke & BIM', imageUrl: null },
          { name: 'Sanierung Bestand', line: 'Digitaler Zwilling für Betrieb', imageUrl: null },
        ],
      },
    },
    {
      id: nid(),
      type: 'project_scope',
      props: {
        title: 'Leistungsbild',
        bullets: [
          'Workshops zu Planungsstandards und Datenmodell',
          'Abstimmung Schnittstellen Lieferanten / GAEB',
          'Begleitung Ausführung bis Übergabe',
        ],
        imageUrl: null,
        fieldOrder: normalizeProjectScopeFieldOrder(undefined),
        sectionSurface: 'deck',
      },
    },
    {
      id: nid(),
      type: 'timeline',
      props: {
        title: 'Phasenplan',
        sectionSurface: 'deck',
        milestones: [
          { week: 'Phase A', label: 'Ist-Aufnahme & Zielbild' },
          { week: 'Phase B', label: 'Planungslinie & Reviews' },
          { week: 'Phase C', label: 'Umsetzung & QA' },
        ],
      },
    },
    {
      id: nid(),
      type: 'testimonials',
      props: {
        title: 'Feedback',
        items: [
          {
            quote: 'Starke Einbindung des Planungsteams — weniger Schnittstellenfehler auf der Baustelle.',
            name: 'Name Platzhalter',
            role: 'Projektleiterin',
            company: 'Architekturbüro Platzhalter',
          },
        ],
      },
    },
    {
      id: nid(),
      type: 'terms',
      props: {
        sectionSurface: 'deck',
        body:
          'Vertraulichkeit: Dieses Dokument ist nur für den genannten Empfängerkreis bestimmt. Rechtlich bindend sind nur individuell vereinbarte Vertragswerke.',
      },
    },
  ]
}

/** Same starting point as developer; sales rearranges in editor. */
export function presetCustom(): ProposalBlock[] {
  return presetDeveloper()
}

export function blocksForPreset(preset: ProposalPresetId): ProposalBlock[] {
  switch (preset) {
    case 'developer':
      return presetDeveloper()
    case 'architect':
      return presetArchitect()
    case 'custom':
      return presetCustom()
    default:
      return presetDeveloper()
  }
}
