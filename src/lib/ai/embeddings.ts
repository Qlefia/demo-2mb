import 'server-only'

/**
 * OpenAI text embeddings for comparable-case retrieval (Phase 6).
 * Requires `OPENAI_API_KEY` (optional until match pipeline runs).
 */
export async function embedText(text: string): Promise<number[]> {
  const apiKey = process.env.OPENAI_API_KEY?.trim()
  if (!apiKey) {
    throw new Error('missing_openai_api_key')
  }

  const res = await fetch('https://api.openai.com/v1/embeddings', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'text-embedding-3-large',
      input: text.slice(0, 8000),
    }),
  })

  if (!res.ok) {
    const errBody = await res.text()
    throw new Error(`openai_embeddings_http_${res.status}: ${errBody.slice(0, 500)}`)
  }

  const json = (await res.json()) as {
    data?: Array<{ embedding?: number[] }>
  }
  const emb = json.data?.[0]?.embedding
  if (!emb || emb.length !== 1536) {
    throw new Error('bad_embedding_dim')
  }
  return emb
}
