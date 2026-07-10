import 'server-only'

import Anthropic from '@anthropic-ai/sdk'
import { z } from 'zod'
import { loadPromptMarkdown } from '@/lib/ai/loadPrompt'
import type { NewsApiPayload } from '@/lib/enrichment/types'

const extractedSignalSchema = z.object({
  text: z.string().min(1).max(500),
  sourceUrl: z.string().url().nullable().optional(),
  type: z.string().max(40).default('press'),
  confidence: z.number().min(0).max(1).optional(),
})

const extractResponseSchema = z.object({
  signals: z.array(extractedSignalSchema).max(5),
})

export type ExtractedSignal = z.infer<typeof extractedSignalSchema>

function extractFirstJsonObject(text: string): unknown {
  const start = text.indexOf('{')
  const end = text.lastIndexOf('}')
  if (start === -1 || end === -1 || end <= start) {
    throw new Error('no_json_object')
  }
  return JSON.parse(text.slice(start, end + 1)) as unknown
}

export async function extractSignalsFromNews(input: {
  accountName: string
  website: string | null
  news: NewsApiPayload
  apolloOrgSummary?: string | null
}): Promise<ExtractedSignal[]> {
  const apiKey = process.env.ANTHROPIC_API_KEY?.trim()
  if (!apiKey) {
    throw new Error('missing_anthropic_api_key')
  }

  if (!input.news.headlines.length) {
    return []
  }

  const prompt = loadPromptMarkdown('v1/signal_extract.md')
  const client = new Anthropic({ apiKey })
  const modelId = process.env.ANTHROPIC_MODEL?.trim() || prompt.model

  const userPayload = JSON.stringify({
    company: input.accountName,
    website: input.website,
    orgContext: input.apolloOrgSummary ?? null,
    headlines: input.news.headlines,
  })

  const msg = await client.messages.create({
    model: modelId,
    max_tokens: 2048,
    temperature: prompt.temperature,
    system: prompt.body,
    messages: [
      {
        role: 'user',
        content: userPayload,
      },
    ],
  })

  let textOut = ''
  for (const block of msg.content) {
    if (block.type === 'text') textOut += block.text
  }

  const parsed = extractResponseSchema.parse(extractFirstJsonObject(textOut))
  return parsed.signals.filter((s) => (s.confidence ?? 1) >= 0.4)
}
