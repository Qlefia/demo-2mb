/**
 * Sync work descriptions + catalog links from 2mb.studio case-category and case pages.
 * Usage: node scripts/sync-studio-works-from-site.mjs [--dry-run]
 */
import fs from 'fs'
import * as cheerio from 'cheerio'
import postgres from 'postgres'

const WORKSPACE_ID = '00000000-0000-4000-8000-000000000001'
const SITE = 'https://www.2mb.studio'
const dryRun = process.argv.includes('--dry-run')

const CATEGORIES = [
  ['Interior', `${SITE}/case-category/interior`, 'interior'],
  ['Exterior', `${SITE}/case-category/exterior`, 'exterior'],
  ['Complex', `${SITE}/case-category/complex`, 'mixed'],
  ['Branding & Website', `${SITE}/case-category/branding-website`, 'branding'],
]

const SITE_LABEL_TO_CATALOG_TITLE = {
  'interior visualization': 'Interior Render',
  'exterior visualization': 'Exterior Render',
  'conceptual interior design': 'Conceptual Interior Design',
  'conceptual facade design': 'Conceptual Facade Design',
  'conceptual landscape design': 'Conceptual Landscape Design',
  '360° virtual tour': '360° Virtual Tour',
  '360 virtual tour': '360° Virtual Tour',
  walkthrough: 'Walkthrough',
  'axonometric view': 'Axonometric View',
  "bird's-eye view": "Bird's-Eye View",
  'birds-eye view': "Bird's-Eye View",
  'project masterplan': 'Project Masterplan',
  modeling: 'Modeling',
  'corporate website': 'Corporate Website',
  'landing page': 'Landing Page',
  development: 'Development',
  'app design': 'App Design',
  'brand identity': 'UX/UI Design',
  'design & digital-support': 'UX/UI Design',
  'design & digital support': 'UX/UI Design',
  'ux/ui design': 'UX/UI Design',
}

const SERVICE_RE =
  /(Interior Visualization|Exterior Visualization|Conceptual Interior Design|Conceptual Facade Design|Conceptual Landscape Design|3D Animation|360° Virtual Tour|Walkthrough|Axonometric View|Bird's-Eye View|Project Masterplan|Modeling|Brand Identity|Design & Digital-support|Design & Digital Support|Corporate Website|Development|Landing Page|App Design|UX\/UI Design)/gi

function loadEnv() {
  const text = fs.readFileSync('.env.local', 'utf8')
  const env = {}
  for (const line of text.split(/\r?\n/)) {
    const t = line.trim()
    if (!t || t.startsWith('#')) continue
    const m = t.match(/^([A-Z0-9_]+)=(.+)$/)
    if (!m) continue
    env[m[1]] = m[2].trim().replace(/^["']|["']$/g, '')
  }
  if (!env.DATABASE_URL) throw new Error('DATABASE_URL missing')
  return env
}

function normTitle(s) {
  return s
    .toLowerCase()
    .normalize('NFD')
    .replace(/\p{M}/gu, '')
    .replace(/[^a-z0-9]+/g, ' ')
    .trim()
}

function normHref(href) {
  if (!href) return ''
  const path = href.replace(SITE, '').split('?')[0].replace(/\/$/, '')
  return path.toLowerCase()
}

function resolve3dAnimation(categoryKind) {
  return categoryKind === 'exterior' ? 'Exterior 3D Animation' : 'Interior 3D Animation'
}

function catalogIdForSiteLabel(label, catalogByTitle, categoryKind) {
  const key = label.trim().toLowerCase().replace(/\s+/g, ' ')
  if (key === '3d animation') {
    return catalogByTitle.get(resolve3dAnimation(categoryKind)) ?? null
  }
  const title = SITE_LABEL_TO_CATALOG_TITLE[key]
  if (!title) return null
  return catalogByTitle.get(title) ?? null
}

function extractServiceLabels(text) {
  const labels = []
  let m
  const re = new RegExp(SERVICE_RE.source, 'gi')
  while ((m = re.exec(text)) !== null) labels.push(m[1])
  return [...new Set(labels)]
}

function toDescriptionHtml(text) {
  const clean = text.replace(/\s+/g, ' ').trim()
  if (!clean) return ''
  return `<p>${clean.replace(/"/g, '&quot;')}</p>`
}

function parseTimeline(blockText) {
  const m = blockText.match(/timeline:\s*([^\n]+?)(?:\n|play video|jump to case|$)/i)
  return m ? m[1].trim() : ''
}

function parseFeaturedCases(html, categoryLabel, categoryKind) {
  const $ = cheerio.load(html)
  const cases = []

  $('div.fs-cms_item.w-dyn-item').each((_, item) => {
    const root = $(item)
    const title = root.find('h2').first().text().replace(/\s+/g, ' ').trim()
    if (!title) return

    const subheader = root.find('.case_description_header > div').first().text().replace(/\s+/g, ' ').trim()
    const description =
      root.find('.case_description_top_content p').first().text().replace(/\s+/g, ' ').trim() ||
      root.find('.case_description p').first().text().replace(/\s+/g, ' ').trim()

    if (description.length < 15) return

    const blockText = root.text().replace(/\s+/g, ' ')
    const caseHref = root.find('a[href*="/cases/"]').first().attr('href') ?? ''

    cases.push({
      title,
      subheader,
      categoryLabel,
      categoryKind,
      description,
      serviceLabels: extractServiceLabels(blockText),
      timeline: parseTimeline(blockText),
      caseHref: caseHref.startsWith('http') ? caseHref : caseHref ? `${SITE}${caseHref}` : '',
    })
  })

  return cases
}

function parseCaseDetailPage(html, caseHref, categoryKind) {
  const text = html.replace(/\s+/g, ' ')
  const taskMatch = text.match(
    /Task:\s*([\s\S]{40,1200}?)(?:\s*Services:|\s*Timeline:|\s*Client:|\s*×\s*No items)/i,
  )
  const description = taskMatch ? taskMatch[1].trim() : ''

  const servicesBlock = text.match(/Services:\s*([\s\S]{10,400}?)(?:\s*Timeline:|\s*Client:|\s*×)/i)
  const serviceLabels = servicesBlock ? extractServiceLabels(servicesBlock[1]) : []

  const timeline = parseTimeline(text)

  return {
    description,
    serviceLabels,
    timeline,
    caseHref: caseHref.startsWith('http') ? caseHref : `${SITE}${caseHref}`,
    categoryKind,
  }
}

function matchWork(siteCase, works) {
  if (siteCase.caseHref) {
    const hrefKey = normHref(siteCase.caseHref)
    const byHref = works.find((w) => normHref(w.caseUrl) === hrefKey)
    if (byHref) return byHref
  }

  const key = normTitle(siteCase.title)
  for (const w of works) {
    if (normTitle(w.title) === key) return w
  }

  let best = null
  let bestScore = 0
  for (const w of works) {
    const wk = normTitle(w.title)
    const tokens = key.split(' ').filter((t) => t.length > 2)
    let s = 0
    for (const tok of tokens) {
      if (wk.includes(tok)) s += 2
    }
    if (s > bestScore) {
      bestScore = s
      best = w
    }
  }
  return bestScore >= 4 ? best : null
}

function applySiteCaseToWork(work, siteCase, catalogByTitle) {
  const linkedCatalogIds = []
  for (const label of siteCase.serviceLabels) {
    const id = catalogIdForSiteLabel(label, catalogByTitle, siteCase.categoryKind)
    if (id && !linkedCatalogIds.includes(id)) linkedCatalogIds.push(id)
  }

  const descriptionHtml = toDescriptionHtml(siteCase.description)
  const patch = {}
  if (descriptionHtml) {
    patch.description = descriptionHtml
    patch.taskBody = descriptionHtml
  }
  if (siteCase.subheader && !work.subheader?.trim()) patch.subheader = siteCase.subheader
  if (siteCase.timeline) patch.timeline = siteCase.timeline
  if (linkedCatalogIds.length > 0) patch.linkedCatalogIds = linkedCatalogIds
  if (siteCase.caseHref && !work.caseUrl?.trim()) patch.caseUrl = siteCase.caseHref

  return patch
}

function patchChanged(work, patch) {
  for (const [k, v] of Object.entries(patch)) {
    if (k === 'linkedCatalogIds') {
      if (JSON.stringify(work.linkedCatalogIds) !== JSON.stringify(v)) return true
    } else if (work[k] !== v) return true
  }
  return false
}

async function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms))
}

async function main() {
  const env = loadEnv()
  const sql = postgres(env.DATABASE_URL, { max: 1 })
  const [row] = await sql`
    SELECT sales FROM workspace_studio_settings
    WHERE workspace_id = ${WORKSPACE_ID}::uuid
  `
  if (!row) throw new Error('settings row missing')

  const sales = row.sales
  const works = sales.works ?? []
  const catalogByTitle = new Map((sales.serviceCatalog ?? []).map((c) => [c.title, c.id]))

  const siteCases = []
  for (const [label, url, kind] of CATEGORIES) {
    const res = await fetch(url, { headers: { 'User-Agent': '2mb-crm-sync/1.0' } })
    if (!res.ok) throw new Error(`${url} → ${res.status}`)
    siteCases.push(...parseFeaturedCases(await res.text(), label, kind))
    console.log(`[fetch] ${label}: ${siteCases.length} featured total`)
    await sleep(150)
  }

  const report = { updated: 0, skipped: 0, casePages: 0, unmatched: [] }

  for (const siteCase of siteCases) {
    const work = matchWork(siteCase, works)
    if (!work) {
      report.unmatched.push(siteCase.title)
      continue
    }
    const patch = applySiteCaseToWork(work, siteCase, catalogByTitle)
    if (!patchChanged(work, patch)) {
      report.skipped++
      continue
    }
    Object.assign(work, patch)
    report.updated++
    if (!dryRun) console.log(`[cat] ${work.title}`)
  }

  const needsCasePage = works.filter(
    (w) => w.caseUrl?.trim() && !stripHtml(w.description) && !stripHtml(w.taskBody),
  )

  for (const work of needsCasePage) {
    const url = work.caseUrl.startsWith('http') ? work.caseUrl : `${SITE}${work.caseUrl}`
    const res = await fetch(url, { headers: { 'User-Agent': '2mb-crm-sync/1.0' } })
    if (!res.ok) continue
    const kind =
      work.categoryLabel === 'Exterior'
        ? 'exterior'
        : work.categoryLabel === 'Branding & Website'
          ? 'branding'
          : work.categoryLabel === 'Complex'
            ? 'mixed'
            : 'interior'
    const detail = parseCaseDetailPage(await res.text(), url, kind)
    if (!detail.description) continue

    const siteCase = {
      title: work.title,
      subheader: '',
      categoryLabel: work.categoryLabel,
      categoryKind: kind,
      description: detail.description,
      serviceLabels: detail.serviceLabels,
      timeline: detail.timeline,
      caseHref: url,
    }
    const patch = applySiteCaseToWork(work, siteCase, catalogByTitle)
    if (!patchChanged(work, patch)) continue
    Object.assign(work, patch)
    report.updated++
    report.casePages++
    if (!dryRun) console.log(`[case] ${work.title}`)
    await sleep(120)
  }

  if (!dryRun) {
    await sql`
      UPDATE workspace_studio_settings
      SET sales = ${sql.json(sales)}, revision = revision + 1
      WHERE workspace_id = ${WORKSPACE_ID}::uuid
    `
    console.log('Saved (revision +1)')
  }

  await sql.end()
  console.log('\nSummary:', report)
  if (report.unmatched.length) console.log('Unmatched:', report.unmatched.join(', '))
}

function stripHtml(html) {
  return (html ?? '').replace(/<[^>]+>/g, '').trim()
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
