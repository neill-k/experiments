import OpenAI from 'openai'

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
})

/**
 * Compute a 1536-dimensional embedding for the given text
 * using OpenAI's text-embedding-3-small model.
 *
 * Server-side only — never call from client components.
 */
export async function computeEmbedding(text: string): Promise<number[]> {
  const response = await openai.embeddings.create({
    model: 'text-embedding-3-small',
    input: text,
  })

  return response.data[0].embedding
}
