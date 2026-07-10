/**
 * Phase 6 — semantic retrieval for dossier Section 8 (`comparable_cases` + pgvector).
 *
 * Readonly audit notes:
 * - **A:** Table name `comparable_cases` avoids bare `cases`; RLS mirrors `playbooks`
 *   (founder/admin/ops/sales SELECT catalogue).
 * - **B:** Matching runs only on the server inside `POST dossier/generate` (never client).
 *   Uses the same DB accessor as the route (`withUserRls` or privileged transaction).
 * - **C:** Dossier Section 8 schema expects three `{ name, why }` slots; `top_cases`
 *   carries catalogue metadata so the model can fill names and rationales from grounding.
 */

import 'server-only'

import { sql } from 'drizzle-orm'
import type { Database } from '@/lib/db/client'

export interface ComparableCaseMatch {
  id: string
  slug: string
  name: string
  scaleUnits: number | null
  projectType: string | null
  facadeStyle: string | null
  region: string | null
  year: number | null
  summary: string
  pdfUrl: string | null
  similarity: number
}

export interface MatchCasesOptions {
  hqCountry?: string | null
  hqCity?: string | null
  /** Cosine similarity per pgvector `<=>`; default 0.35 lets sparse seeds still return top-K */
  minSimilarity?: number
}

interface RawMatchRow {
  id: string
  slug: string
  name: string
  scale_units: number | null
  project_type: string | null
  facade_style: string | null
  region: string | null
  year: number | null
  summary: string
  pdf_url: string | null
  similarity: number
}

function vectorLiteral(vec: number[]): string {
  if (vec.length !== 1536) throw new Error('match_cases_bad_dim')
  const inner = vec.map((n) => Number(n.toFixed(8))).join(',')
  return `'[${inner}]'::vector(1536)`
}

function regionBoost(
  opts: MatchCasesOptions,
  region: string | null,
): number {
  if (!region) return 0
  const r = region.toLowerCase()
  if (opts.hqCity) {
    const c = opts.hqCity.toLowerCase()
    if (c.length >= 2 && r.includes(c)) return 0.12
  }
  if (opts.hqCountry) {
    const c = opts.hqCountry.toLowerCase()
    if (c.length >= 2 && r.includes(c)) return 0.06
  }
  return 0
}

/**
 * Top-5 cosine neighbours → re-rank by region hint → return top-3 JSON-safe objects.
 */
export async function matchComparableCases(
  tx: Database,
  queryEmbedding: number[],
  opts: MatchCasesOptions = {},
): Promise<ComparableCaseMatch[]> {
  const lit = vectorLiteral(queryEmbedding)
  const minSim = opts.minSimilarity ?? 0.0

  const rawQuery = `
    select
      cc.id::text as id,
      cc.slug::text as slug,
      cc.name::text as name,
      cc.scale_units as scale_units,
      cc.project_type::text as project_type,
      cc.facade_style::text as facade_style,
      cc.region::text as region,
      cc.year as year,
      cc.summary::text as summary,
      cc.pdf_url::text as pdf_url,
      (1 - (ce.embedding <=> ${lit}))::double precision as similarity
    from comparable_cases cc
    inner join case_embeddings ce on ce.case_id = cc.id
    order by ce.embedding <=> ${lit}
    limit 12
  `

  const result = await tx.execute(sql.raw(rawQuery))
  const rows = result as unknown as RawMatchRow[]
  if (!rows?.length) return []

  const filtered =
    minSim > 0 ? rows.filter((row) => row.similarity >= minSim) : rows
  if (!filtered.length) return []

  const ranked = filtered
    .map((row) => ({
      row,
      score: row.similarity + regionBoost(opts, row.region),
    }))
    .sort((a, b) => b.score - a.score)
    .slice(0, 3)

  return ranked.map(({ row }) => ({
    id: row.id,
    slug: row.slug,
    name: row.name,
    scaleUnits: row.scale_units,
    projectType: row.project_type,
    facadeStyle: row.facade_style,
    region: row.region,
    year: row.year,
    summary: row.summary,
    pdfUrl: row.pdf_url,
    similarity: row.similarity,
  }))
}
