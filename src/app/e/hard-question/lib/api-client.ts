import type { ZodType } from 'zod'
import { fetchWithAuth } from './fetch-with-auth'

export class HardQuestionApiError extends Error {
  status: number
  payload: unknown

  constructor(message: string, status: number, payload: unknown) {
    super(message)
    this.name = 'HardQuestionApiError'
    this.status = status
    this.payload = payload
  }
}

export function isHardQuestionApiError(value: unknown): value is HardQuestionApiError {
  return value instanceof HardQuestionApiError
}

function getErrorMessage(payload: unknown, status: number): string {
  if (payload && typeof payload === 'object' && 'error' in payload) {
    const error = (payload as { error?: unknown }).error
    if (typeof error === 'string' && error.trim().length > 0) {
      return error
    }
  }

  return `Request failed (${status})`
}

export async function requestHardQuestionJson<T>(
  url: string,
  schema: ZodType<T>,
  init?: RequestInit
): Promise<T> {
  const res = await fetchWithAuth(url, init)
  const payload = await res.json().catch(() => null)

  if (!res.ok) {
    throw new HardQuestionApiError(getErrorMessage(payload, res.status), res.status, payload)
  }

  const parsed = schema.safeParse(payload)
  if (!parsed.success) {
    console.error('Malformed Hard Question API response', {
      url,
      issues: parsed.error.issues,
    })
    throw new Error('Received malformed response from server')
  }

  return parsed.data
}
