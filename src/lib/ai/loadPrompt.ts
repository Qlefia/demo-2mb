import fs from 'node:fs'
import path from 'node:path'

export interface LoadedPromptFile {
  id: string
  version: number
  model: string
  temperature: number
  body: string
}

/**
 * Load `src/lib/ai/prompts/v{N}/*.md` with YAML frontmatter (id, version, model, temperature).
 */
export function loadPromptMarkdown(relativeFromPromptsDir: string): LoadedPromptFile {
  const base = path.join(process.cwd(), 'src/lib/ai/prompts', relativeFromPromptsDir)
  const raw = fs.readFileSync(base, 'utf8')
  if (!raw.startsWith('---')) {
    throw new Error(`Prompt ${relativeFromPromptsDir} must start with YAML frontmatter`)
  }
  const end = raw.indexOf('\n---', 3)
  if (end === -1) throw new Error(`Prompt ${relativeFromPromptsDir}: missing closing ---`)
  const fm = raw.slice(3, end).trim()
  const body = raw.slice(end + 4).trim()
  const meta: Record<string, string> = {}
  for (const line of fm.split('\n')) {
    const idx = line.indexOf(':')
    if (idx === -1) continue
    const k = line.slice(0, idx).trim()
    const v = line.slice(idx + 1).trim()
    meta[k] = v.replace(/^["']|["']$/g, '')
  }
  return {
    id: meta.id ?? 'unknown',
    version: Number(meta.version ?? '1'),
    model: meta.model ?? 'claude-sonnet-4-20250514',
    temperature: Number(meta.temperature ?? '0.2'),
    body,
  }
}
