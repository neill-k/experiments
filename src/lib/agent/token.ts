import crypto from 'crypto'

export function generateAgentToken(): string {
  // 32 bytes -> 43 char base64url string (no padding)
  return crypto.randomBytes(32).toString('base64url')
}

export function hashAgentToken(token: string): string {
  const secret = process.env.AGENT_TOKEN_SECRET
  if (!secret) throw new Error('Missing AGENT_TOKEN_SECRET')
  return crypto.createHmac('sha256', secret).update(token).digest('hex')
}

export function getBearerToken(req: Request): string | null {
  const h = req.headers.get('authorization')
  if (!h) return null
  const m = h.match(/^Bearer\s+(.+)$/i)
  return m?.[1]?.trim() ?? null
}
