'use client'

import { useState } from 'react'
import { fetchWithAuth } from '../lib/fetch-with-auth'

interface FavoriteButtonProps {
  questionId: string
  initialFavorited?: boolean
}

export function FavoriteButton({ questionId, initialFavorited = false }: FavoriteButtonProps) {
  const [favorited, setFavorited] = useState(initialFavorited)
  const [loading, setLoading] = useState(false)

  async function toggle() {
    if (loading) return
    setLoading(true)
    const prev = favorited
    setFavorited(!prev)

    try {
      const res = await fetchWithAuth('/api/hard-question/favorites', {
        method: favorited ? 'DELETE' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ question_id: questionId }),
      })
      if (!res.ok) {
        setFavorited(prev) // rollback
      }
    } catch {
      setFavorited(prev) // rollback
    } finally {
      setLoading(false)
    }
  }

  return (
    <button
      onClick={toggle}
      disabled={loading}
      aria-busy={loading}
      className="favorite-btn p-3 transition-colors flex items-center justify-center relative"
      aria-label={favorited ? 'Remove from favorites' : 'Add to favorites'}
      style={{ color: favorited ? 'var(--fg)' : 'var(--muted)', minWidth: '44px', minHeight: '44px' }}
    >
      <span className={`absolute inset-0 flex items-center justify-center transition-opacity duration-200 ${loading ? 'opacity-100' : 'opacity-0'}`} aria-hidden="true">
        <span className="h-5 w-5 animate-spin rounded-full border-2 border-current/20 border-t-current" />
      </span>
      <svg
        className={`transition-opacity duration-200 ${loading ? 'opacity-0' : 'opacity-100'}`}
        width="20"
        height="20"
        viewBox="0 0 24 24"
        fill={favorited ? 'currentColor' : 'none'}
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="square"
        strokeLinejoin="miter"
      >
        <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
      </svg>

      <style jsx>{`
        .favorite-btn:hover {
          color: var(--fg);
        }
        .favorite-btn:disabled {
          opacity: 0.5;
        }
      `}</style>
    </button>
  )
}
