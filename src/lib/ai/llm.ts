import 'server-only'

import Anthropic from '@anthropic-ai/sdk'
import { loadPromptMarkdown } from '@/lib/ai/loadPrompt'
import type { GroundingPack } from '@/lib/ai/grounding'
import { dossierSectionsSchema, type DossierSections } from '@/lib/dossiers/schema'

/** Rough USD for dashboard; tune when Anthropic publishes Sonnet 4 list prices. */
const USD_PER_MTOK_IN = 3
const USD_PER_MTOK_OUT = 15

export interface AiDossierUsage {
  model: string
  promptId: string
  promptVersion: number
  tokensIn: number
  tokensOut: number
  costUsd: number
  latencyMs: number
  calledAt: string
}

export interface CompleteDossierDraftResult {
  sections: DossierSections
  usage: AiDossierUsage
  rawText: string
}

function estimateCostUsd(tokensIn: number, tokensOut: number): number {
  return (tokensIn * USD_PER_MTOK_IN + tokensOut * USD_PER_MTOK_OUT) / 1_000_000
}

function extractFirstJsonObject(text: string): unknown {
  const start = text.indexOf('{')
  const end = text.lastIndexOf('}')
  if (start === -1 || end === -1 || end <= start) {
    throw new Error('no_json_object')
  }
  const slice = text.slice(start, end + 1)
  return JSON.parse(slice) as unknown
}

/**
 * Calls Claude with dossier_master v1 and parses structured dossier sections.
 */
export async function completeDossierDraftFromGrounding(
  grounding: GroundingPack,
): Promise<CompleteDossierDraftResult> {
  const apiKey = process.env.ANTHROPIC_API_KEY?.trim()
  if (!apiKey) {
    throw new Error('missing_anthropic_api_key')
  }

  const prompt = loadPromptMarkdown('v1/dossier_master.md')
  const client = new Anthropic({ apiKey })
  const userPayload = JSON.stringify({
    grounding: {
      prospectId: grounding.prospectId,
      accountId: grounding.accountId,
      accountName: grounding.accountName,
      website: grounding.website,
      enrichment: grounding.enrichment,
      topCases: grounding.topCases,
    },
  })

  const started = Date.now()
  const modelId = process.env.ANTHROPIC_MODEL?.trim() || prompt.model
  const msg = await client.messages.create({
    model: modelId,
    max_tokens: 16_384,
    temperature: prompt.temperature,
    system: prompt.body,
    messages: [
      {
        role: 'user',
        content: `Return ONLY the dossier JSON.\n\n${userPayload}`,
      },
    ],
  })

  const latencyMs = Date.now() - started
  let textOut = ''
  for (const block of msg.content) {
    if (block.type === 'text') textOut += block.text
  }

  const parsedObj = extractFirstJsonObject(textOut)
  const sections = dossierSectionsSchema.parse(parsedObj)

  const tokensIn = msg.usage?.input_tokens ?? 0
  const tokensOut = msg.usage?.output_tokens ?? 0
  const calledAt = new Date().toISOString()

  return {
    sections,
    rawText: textOut,
    usage: {
      model: modelId,
      promptId: prompt.id,
      promptVersion: prompt.version,
      tokensIn,
      tokensOut,
      costUsd: estimateCostUsd(tokensIn, tokensOut),
      latencyMs,
      calledAt,
    },
  }
}
