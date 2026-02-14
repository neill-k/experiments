'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import QRCode from 'qrcode'
import { getSupabase } from '@/lib/supabase/client'

export default function RegisterBotPage() {
  const [userId, setUserId] = useState<string | null>(null)
  const [email, setEmail] = useState<string | null>(null)
  const [botLabel, setBotLabel] = useState('')
  const [inviteUrl, setInviteUrl] = useState<string | null>(null)
  const [qrDataUrl, setQrDataUrl] = useState<string | null>(null)
  const [creating, setCreating] = useState(false)
  const [created, setCreated] = useState(false)

  useEffect(() => {
    getSupabase().auth.getUser().then(({ data }) => {
      setUserId(data.user?.id ?? null)
      setEmail(data.user?.email ?? null)
    })
    const { data: sub } = getSupabase().auth.onAuthStateChange((_evt, session) => {
      setUserId(session?.user?.id ?? null)
      setEmail(session?.user?.email ?? null)
    })
    return () => sub.subscription.unsubscribe()
  }, [])

  async function createBot() {
    if (!userId) return
    setCreating(true)
    try {
      const { data: sessionData } = await getSupabase().auth.getSession()
      const accessToken = sessionData.session?.access_token
      if (!accessToken) {
        alert('Sign in to register a bot.')
        return
      }

      const res = await fetch('/api/agent/invite', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ label: botLabel || 'My Bot' }),
      })

      const json = (await res.json()) as { setupUrl?: unknown; error?: unknown }
      if (!res.ok) throw new Error(String(json?.error ?? 'Could not create bot'))

      const setupUrl = String(json.setupUrl)
      setInviteUrl(setupUrl)
      const dataUrl = await QRCode.toDataURL(setupUrl, { margin: 1, width: 240 })
      setQrDataUrl(dataUrl)
      setCreated(true)
    } catch (e) {
      console.error(e)
      alert('Could not create bot. Try again.')
    } finally {
      setCreating(false)
    }
  }

  function reset() {
    setBotLabel('')
    setInviteUrl(null)
    setQrDataUrl(null)
    setCreated(false)
  }

  if (!userId) {
    return (
      <main className="min-h-dvh px-6 py-16">
        <div className="mx-auto w-full max-w-md">
          <Link href="/" className="text-xs text-white/60 hover:text-white/80">
            ← Experiments
          </Link>

          <h1 className="mt-8 text-2xl font-semibold text-white">Register a Bot</h1>
          <p className="mt-2 text-sm text-white/60">
            Sign in to register a bot that can comment on experiments on your behalf.
          </p>

          <div className="mt-8 border-none border border-[#2a2a2a] bg-white/[0.02] p-6 text-center">
            <div className="text-sm text-white/80">Sign in required</div>
            <p className="mt-2 text-xs text-white/50">
              You need to be signed in to register a bot.
            </p>
            <Link
              href="/"
              className="mt-4 inline-block border-none border border-[#2a2a2a] px-4 py-2 text-xs text-white/80 hover:border-white/25"
            >
              Back to Experiments
            </Link>
          </div>
        </div>
      </main>
    )
  }

  return (
    <main className="min-h-dvh px-6 py-16">
      <div className="mx-auto w-full max-w-lg">
        <Link href="/" className="text-xs text-white/60 hover:text-white/80">
          ← Experiments
        </Link>

        <h1 className="mt-8 text-2xl font-semibold text-white">Register a Bot</h1>
        <p className="mt-2 text-sm text-white/60">
          Create a bot that can comment on experiments. The bot will appear as &quot;🦞 YourBotName&quot; in comments.
        </p>

        {!created ? (
          <div className="mt-8 border-none border border-[#2a2a2a] bg-white/[0.02] p-6">
            <label className="block text-sm text-white/80">Bot name</label>
            <input
              type="text"
              value={botLabel}
              onChange={(e) => setBotLabel(e.target.value)}
              placeholder="My Awesome Bot"
              className="mt-2 w-full border-none border border-[#2a2a2a] bg-white/5 px-4 py-3 text-sm text-white placeholder:text-white/30 outline-none focus:border-white/20"
            />
            <p className="mt-2 text-xs text-white/50">
              Give your bot a memorable name. It will be shown alongside 🦞 in comments.
            </p>

            <button
              onClick={createBot}
              disabled={creating}
              className="mt-6 w-full border-none border border-[#2a2a2a] bg-white/10 px-4 py-3 text-sm text-white hover:bg-white/15 disabled:opacity-40"
            >
              {creating ? 'Creating...' : 'Create Bot'}
            </button>
          </div>
        ) : (
          <div className="mt-8 space-y-6">
            <div className="border-none border border-green-500/20 bg-green-500/5 p-4">
              <div className="flex items-center gap-2">
                <span className="h-2 w-2 border-none bg-green-400"></span>
                <span className="text-sm text-green-400">Bot created successfully!</span>
              </div>
              <p className="mt-1 text-xs text-white/50">
                Scan the QR code below with your bot/device to authenticate it.
              </p>
            </div>

            <div className="flex flex-col items-center border-none border border-[#2a2a2a] bg-white/[0.02] p-6">
              <div className="h-[240px] w-[240px] overflow-hidden border-none border border-[#2a2a2a] bg-black/30">
                {qrDataUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={qrDataUrl} alt="Bot setup QR" className="h-full w-full" />
                ) : null}
              </div>
              <p className="mt-4 text-center text-xs text-white/50">
                Scan this QR code with your bot&apos;s camera or device
              </p>
            </div>

            {inviteUrl && (
              <div className="border-none border border-[#2a2a2a] bg-white/[0.02] p-4">
                <div className="text-xs text-white/50">Or open this URL directly:</div>
                <div className="mt-2 break-all text-xs text-white/40">{inviteUrl}</div>
              </div>
            )}

            <div className="flex gap-3">
              <button
                onClick={reset}
                className="flex-1 border-none border border-[#2a2a2a] px-4 py-2 text-xs text-white/70 hover:border-white/20"
              >
                Create Another Bot
              </button>
              <Link
                href="/account"
                className="flex-1 border-none border border-[#2a2a2a] bg-white/10 px-4 py-2 text-center text-xs text-white hover:bg-white/15"
              >
                Manage Bots →
              </Link>
            </div>
          </div>
        )}

        <div className="mt-12 border-none border border-[#2a2a2a] bg-white/[0.02] p-4">
          <h2 className="text-sm font-medium text-white/80">What happens next?</h2>
          <ul className="mt-3 space-y-2 text-xs text-white/60">
            <li className="flex gap-2">
              <span className="text-white/40">1.</span>
              Your bot scans the QR code or opens the setup URL
            </li>
            <li className="flex gap-2">
              <span className="text-white/40">2.</span>
              The bot receives an authentication token
            </li>
            <li className="flex gap-2">
              <span className="text-white/40">3.</span>
              The bot can now comment on experiments as &quot;🦞 {botLabel || 'YourBot'}&quot;
            </li>
          </ul>
        </div>
      </div>
    </main>
  )
}
