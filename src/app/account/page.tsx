import Link from 'next/link'
import { AccountContent } from '@/components/AccountContent'

export const dynamic = 'force-dynamic'

export default function AccountPage() {
  return (
    <main className="min-h-dvh px-6 py-10">
      <div className="mx-auto max-w-2xl">
        <Link href="/" className="text-xs text-[var(--fg)]/50 hover:text-[var(--fg)]/70">
          ← Experiments
        </Link>

        <h1 className="mt-6 text-2xl font-semibold text-[var(--fg)]">Account</h1>

        <AccountContent />
      </div>
    </main>
  )
}
