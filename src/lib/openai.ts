import OpenAI from 'openai'

/** Lazy-initialized client - avoids crashing at build time when the key isn't set. */
let _openai: OpenAI | null = null

function getClient(): OpenAI {
  if (!_openai) {
    _openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY })
  }
  return _openai
}

/**
 * Compute a 1536-dimensional embedding for the given text
 * using OpenAI's text-embedding-3-small model.
 *
 * Server-side only - never call from client components.
 */
export async function computeEmbedding(text: string): Promise<number[]> {
  const response = await getClient().embeddings.create({
    model: 'text-embedding-3-small',
    input: text,
  })

  return response.data[0].embedding
}
