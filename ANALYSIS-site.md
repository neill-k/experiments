# Experiments Site - Architecture Analysis

**Date:** 2026-02-15  
**Scope:** Full site analysis - architecture, security, performance, design, accessibility  
**Status:** Analysis only - no changes made

---

## Table of Contents

1. [Executive Summary](#1-executive-summary)
2. [Architecture & Code Organization](#2-architecture--code-organization)
3. [Server vs Client Component Usage](#3-server-vs-client-component-usage)
4. [Security](#4-security)
5. [Performance](#5-performance)
6. [Design System Consistency](#6-design-system-consistency)
7. [Shared Component Quality](#7-shared-component-quality)
8. [Supabase Usage Patterns](#8-supabase-usage-patterns)
9. [Accessibility](#9-accessibility)
10. [Recommendations - Ranked by Impact](#10-recommendations--ranked-by-impact)

---

## 1. Executive Summary

The site is a well-structured Next.js 16 experiments showcase with Supabase auth, real-time comments, and agent (bot) integration. The core architecture is sound for an MVP, but several patterns need attention before scaling:

**Good:**
- Clean routing structure (`/e/[slug]` for experiments, `/account` for user, `/api/agent/*` for bot APIs)
- RLS enabled on all tables with sensible policies
- Agent token hashing with HMAC (never stores raw tokens)
- Rate limiting on all API routes
- Real-time comment subscriptions with fallback polling
- Good OG/Twitter metadata per experiment

**Needs Work:**
- Homepage and several pages are `'use client'` when they could be server components (biggest performance win)
- Experiment sub-apps (`prompt-library`, `agent-spec-builder`) render their own `<html>` and `<body>` tags in nested layouts - this is a critical architectural bug
- Duplicate code across components (auth state, agent invite, copy-to-clipboard patterns)
- No `color-scheme: dark` on `<html>`, no `<meta name="theme-color">`
- Widespread accessibility gaps (missing labels, focus states, ARIA)
- Single-instance in-memory rate limiter won't work in serverless/multi-instance deployments
- No input sanitization on comment bodies (XSS risk via rendered HTML)
- `p5` (920KB unparsed) bundled as a top-level dependency even though only one experiment uses it

---

## 2. Architecture & Code Organization

### What's Good

| Area | Assessment |
|------|-----------|
| Route structure | Clean: `/e/[slug]`, `/account`, `/api/agent/*`, `/agent-setup` |
| Supabase separation | `client.ts` (browser) vs `server.ts` (admin + user-scoped) |
| Agent token module | `lib/agent/token.ts` - clean separation of `generate`, `hash`, `getBearerToken` |
| Rate limiter | Simple but effective for single-node MVP |
| Experiment isolation | Each experiment has its own directory under `/e/` |
| Metadata | Per-experiment OG/Twitter cards with proper templates |

### What Needs Refactoring

#### 2.1 Nested layouts render duplicate `<html>` and `<body>` - **CRITICAL BUG**

`/e/prompt-library/layout.tsx` and `/e/agent-spec-builder/layout.tsx` both render full `<html>` and `<body>` tags:

```tsx
// prompt-library/layout.tsx
export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased`}>
        {children}
      </body>
    </html>
  );
}
```

In Next.js App Router, **only the root layout should render `<html>` and `<body>`**. Nested layouts should return fragments or `<div>` wrappers. This creates invalid HTML with nested `<html>` tags, breaks font inheritance from the root layout, and each sub-app loads different fonts (Geist Sans/Mono) than the site (Instrument Serif/DM Sans/JetBrains Mono).

#### 2.2 Experiment sub-apps have their own `globals.css` with conflicting design tokens

`agent-spec-builder/globals.css` and `prompt-library/globals.css` define `--background: #ffffff` (light mode!) while the root `globals.css` uses `--bg: #08080a` (dark). This means these experiments render in a completely different visual context than the rest of the site.

#### 2.3 Duplicated code patterns

The following pattern is copy-pasted across 4+ components:

```tsx
useEffect(() => {
  getSupabase().auth.getUser().then(({ data }) => setUserId(data.user?.id ?? null))
  const { data: sub } = getSupabase().auth.onAuthStateChange((_evt, session) => {
    setUserId(session?.user?.id ?? null)
  })
  return () => sub.subscription.unsubscribe()
}, [])
```

Found in: `AuthButtons.tsx`, `AccountContent.tsx`, `Comments.tsx`, `CommentsHistoryPage`, `RegisterBotPage`. This should be a `useAuth()` hook or context provider.

#### 2.4 `requireAgent()` is duplicated

The `requireAgent()` function is copied identically in both `api/agent/comment/route.ts` and `api/agent/latest/route.ts`. Extract to a shared utility.

#### 2.5 Orphaned/redundant pages

- `/register-bot/page.tsx` duplicates functionality already in `/account` (AccountContent has agent creation). Consider removing or redirecting.
- `src/components/AgentSpecBuilder.tsx` appears to be an older version of the experiment - the actual experiment lives at `/e/agent-spec-builder/page.tsx` with a more complete implementation. The component may be dead code.

#### 2.6 Hardcoded experiment list on homepage

The homepage hardcodes experiments in a `const experiments = [...]` array. The API route `/api/experiments` exists to fetch from GitHub, but isn't used by the homepage. This means adding a new experiment requires editing `page.tsx`.

---

## 3. Server vs Client Component Usage

### 3.1 Homepage is entirely client-side - **HIGH IMPACT**

`src/app/page.tsx` is marked `'use client'` and renders a static list of experiments. The only interactive parts are:
- Tag filter buttons (could use URL search params)
- Stagger animation on mount

**The entire experiment list is static data that should be rendered server-side.** The tag filter could use `searchParams` (server-side filtering) or be a small client island. The stagger animation could use CSS `animation-delay` instead of `useState` + `useEffect`.

This means:
- The full React runtime + component code ships to the client for a static list
- No SEO benefit from the experiment content (it's client-rendered)
- No streaming/Suspense possible

### 3.2 Account page layout is server, content is client - acceptable

`/account/page.tsx` is a server component that wraps `<AccountContent />` (client). This is the correct pattern since auth state is needed.

### 3.3 Comments history page is entirely client - could be partially server

`/account/comments/page.tsx` is marked `'use client'` at the top level. The page shell (heading, back link) could be a server component wrapping a client data-fetching component.

### 3.4 Agent setup page is a server component - **GOOD**

`/agent-setup/page.tsx` uses `searchParams` and renders server-side. Correct pattern.

### 3.5 Register bot page is entirely client - should be partially server

Same pattern as comments history - the page shell is static and could be server-rendered.

---

## 4. Security

### 4.1 RLS - **WELL DONE**

All three tables (`experiments`, `comments`, `agents`) have RLS enabled with appropriate policies:

| Table | SELECT | INSERT | UPDATE | DELETE |
|-------|--------|--------|--------|--------|
| experiments | Anyone | Authenticated | None (admin only) | None (admin only) |
| comments | Anyone | Own user_id | Own user_id | None (soft delete only) |
| agents | Own user_id | Own user_id | Own user_id | N/A |

This is solid. Server routes use `supabaseAdmin()` which bypasses RLS appropriately.

### 4.2 Agent token security - **GOOD**

- Tokens are HMAC-SHA256 hashed with `AGENT_TOKEN_SECRET` before storage
- Raw tokens are never persisted
- `hashAgentToken()` properly validates `AGENT_TOKEN_SECRET` exists

### 4.3 Comment body not sanitized - **MEDIUM RISK**

Comment bodies are rendered with `whitespace-pre-wrap` as raw text in the `Comments` component. While React auto-escapes JSX string children (so no XSS via `{c.body}`), there's no server-side sanitization or validation beyond length. If comments are ever rendered as HTML or Markdown, this becomes an XSS vector.

**Recommendation:** Sanitize on write (strip HTML tags) and validate content type.

### 4.4 `agent-setup` page exposes token in URL - **LOW RISK, DOCUMENTED**

The setup URL contains the raw agent token as a query param (`?t=TOKEN`). This is by design (one-time use), but:
- Browser history will contain the token
- The page itself doesn't actually "claim" the token - it just displays it and shows curl commands
- There's no actual claim endpoint; the token works directly as a bearer token

**Gap:** The docs say "expires after first use" but there's no claim flow that invalidates the setup token. The agent token IS the bearer token - it works forever until revoked.

### 4.5 `supabaseAdmin()` creates new client per call - **LOW RISK**

`supabaseAdmin()` creates a new Supabase client on every invocation. While not a security issue, it's wasteful. Consider caching the admin client at module level.

### 4.6 API route hardening

| Route | Auth | Rate Limit | Input Validation | Error Handling |
|-------|------|------------|-------------------|----------------|
| `POST /api/agent/comment` | Bearer token + agent lookup | ✅ 60/5min per IP | ✅ slug + body length | ✅ try/catch + 500 |
| `POST /api/agent/invite` | Bearer JWT + user verification | ✅ 20/10min per IP | ✅ label length | ✅ try/catch + 500 |
| `GET /api/agent/latest` | Bearer token + agent lookup | ✅ 120/5min per IP | N/A (no input) | ✅ try/catch + 500 |
| `GET /api/experiments` | None (public) | ❌ None | N/A | ✅ try/catch |

**`/api/experiments` has no rate limiting** - it fetches from GitHub on every request (with 60s `revalidate`). Not critical but should be rate-limited.

### 4.7 In-memory rate limiter - **WON'T SURVIVE SERVERLESS**

The `rateLimit()` function uses an in-memory `Map`. In Vercel's serverless model, each function invocation may run in a different instance. The rate limiter will be ineffective under load. This is fine for MVP but should be replaced with Upstash Redis or Vercel KV before launch.

### 4.8 `x-forwarded-for` spoofing

Rate limiting uses `x-forwarded-for` header, which can be spoofed. On Vercel, the platform sets this reliably, but direct deployments may be vulnerable.

---

## 5. Performance

### 5.1 Bundle size - `p5` is a heavy dependency - **HIGH IMPACT**

```json
"p5": "^2.2.1"
```

p5.js is ~920KB minified. It's only used by the "The Blob" experiment (which doesn't even appear to use it - the blob uses raw Canvas 2D API). If it's used by another experiment:
- It should be dynamically imported (`next/dynamic`) only on the page that needs it
- Currently it's in the top-level `dependencies`, which may cause it to be included in shared chunks

**Actually, reviewing the-blob code:** The blob experiment uses raw `useRef<HTMLCanvasElement>` and `getContext('2d')` - no p5 import. `p5` may be entirely unused. Remove or isolate.

### 5.2 `react-markdown` + `remark-gfm` shipped to all client bundles - **MEDIUM IMPACT**

These are imported in `AgentSpecBuilder.tsx` (shared component) and the agent-spec-builder page. react-markdown with remark-gfm is ~50KB gzipped. It should be dynamically imported since it's only needed when the preview tab is active:

```tsx
const ReactMarkdown = dynamic(() => import('react-markdown'), { ssr: false })
```

### 5.3 Homepage ships unnecessary client JS - **HIGH IMPACT**

As noted in §3.1, the homepage is a client component rendering static data. Converting to a server component eliminates the React hydration cost for the experiment list.

### 5.4 No `<Suspense>` boundaries

No pages use `<Suspense>` for streaming. The account pages could benefit from Suspense boundaries around data-fetching sections.

### 5.5 Polling creates unnecessary network traffic

- `AccountContent` polls agents every 10s
- `Comments` polls every 5s (in addition to realtime)
- `CommentsHistoryPage` polls every 10s

The realtime subscriptions should handle updates. Polling should only activate as a fallback when realtime disconnects, not run continuously alongside it. This doubles network traffic for every user.

### 5.6 Multiple Supabase `getUser()` calls on page load

`AuthButtons` calls `getSupabase().auth.getUser()` on mount. Every page with comments calls it again. Every account page calls it again. The auth state should be centralized in a context provider to avoid duplicate auth requests.

### 5.7 `jszip` dependency

```json
"jszip": "^3.10.1"
```

JSZip (~45KB gzipped) is used in the agent-spec-builder's export-pack feature. Should be dynamically imported only when the user clicks "Export."

### 5.8 No `loading.tsx` or skeleton states

No route segments have `loading.tsx` files. This means navigating between pages shows no loading indicator. Add shimmer/skeleton states for account and experiment pages.

---

## 6. Design System Consistency

### 6.1 Font stack fragmentation - **CRITICAL**

| Context | Fonts Loaded |
|---------|-------------|
| Root layout | Instrument Serif, DM Sans, JetBrains Mono |
| prompt-library layout | Geist Sans, Geist Mono |
| agent-spec-builder layout | Geist Sans, Geist Mono |

The experiment sub-apps load entirely different font families. Users navigating from the homepage to an experiment see a jarring font change. **All experiments should use the root layout's font stack.**

### 6.2 Color system fragmentation

| Context | Background | Foreground | Border |
|---------|-----------|------------|--------|
| Root globals.css | `#08080a` | `#ebebeb` | `#1a1a1a` |
| prompt-library globals.css | `#ffffff` (light) / `#0a0a0a` (dark) | `#171717` / `#ededed` | - |
| agent-spec-builder globals.css | `#ffffff` (light) / `#0a0a0a` (dark) | `#171717` / `#ededed` | - |

The experiment sub-apps default to **light mode** while the main site is strictly dark. This means:
- On first load, experiments may flash white before dark mode media query kicks in
- The overall experience is inconsistent

### 6.3 CSS variable naming inconsistency

Root uses `--bg`, `--fg`, `--muted`, `--border`, `--border-hover`, `--accent`.  
Sub-apps use `--background`, `--foreground`, `--color-background`, `--color-foreground`.  
No shared design token file exists.

### 6.4 Spacing patterns

The main site consistently uses:
- `px-4 sm:px-6` for horizontal padding
- `py-12 sm:py-16` for main content
- `max-w-3xl` for content width (homepage), `max-w-2xl` for account, `max-w-5xl` for nav

This is generally consistent. However, experiment pages define their own padding/widths independently.

### 6.5 Border radius

The entire site uses sharp corners (`border` without `rounded-*`). This is deliberate and consistent - maintaining a brutalist/technical aesthetic. **Good.**

### 6.6 No global animation/transition token

Transitions are defined inline: `transition-colors`, `transition: opacity 0.4s ease`, etc. No shared duration/easing tokens. This is fine for MVP but limits consistency at scale.

---

## 7. Shared Component Quality

### 7.1 `AuthButtons.tsx`

**Strengths:**
- Handles signed-in and signed-out states cleanly
- Dropdown menu with overlay backdrop for click-outside dismissal
- Shows avatar initial + truncated email

**Issues:**
- **No keyboard support** for dropdown - can't navigate menu with arrow keys, Escape doesn't close
- **No ARIA attributes** - missing `aria-expanded`, `aria-haspopup`, `role="menu"`
- **No focus trap** in dropdown
- Avatar initial uses a `<span>` instead of a proper avatar component (not reusable)
- Click-outside dismissal uses `position: fixed; inset: 0` invisible div - works but is a non-standard pattern; a `useClickOutside` hook is more maintainable
- Dropdown position not checked against viewport bounds (could overflow on mobile)

### 7.2 `Comments.tsx`

**Strengths:**
- Real-time subscription with visual status indicator (green/yellow/red dot)
- Fallback polling if realtime fails
- Auto-scroll to new comments
- Soft delete with user confirmation
- Character count display
- Agent invite flow embedded in comments section

**Issues:**
- **Very large component** (~290 lines, 12+ state variables) - should be split into sub-components:
  - `CommentList` (display only)
  - `CommentForm` (draft + post)
  - `AgentInviteCard` (invite generation)
  - `useComments()` hook (data fetching + realtime)
- **Agent invite UI is duplicated** from `AccountContent.tsx` - same invite flow appears in both places
- **No optimistic updates** - after posting, waits for `refresh()` to complete before clearing draft
- **`useEffect` dependency array warnings** - `refresh` is used in effects but not in the dependency array (eslint-disable comment present)
- **Polling runs even when realtime is connected** - wastes bandwidth
- **No loading skeleton** - shows "No comments yet" briefly before loading
- **No error boundary** - if Supabase throws, the whole section crashes

### 7.3 `AccountContent.tsx`

**Strengths:**
- Clean separation of profile section, agents section, danger zone
- Agent creation with invite URL display

**Issues:**
- **~200 lines with 8 state variables** - could benefit from splitting
- **Polling every 10 seconds** even when the user isn't looking at the page (no visibility check)
- **Duplicate agent invite logic** with `Comments.tsx` and `RegisterBotPage`
- **`alert()` for errors** - should use inline error messages or a toast system
- **No loading skeleton** for agents list

### 7.4 `AgentSpecBuilder.tsx` (shared component)

This appears to be an older version of the agent-spec-builder experiment. The actual experiment at `/e/agent-spec-builder/page.tsx` has a more complete implementation with quality scoring, export packs, eval cases, etc.

**The shared component (`src/components/AgentSpecBuilder.tsx`) may be dead code.** It imports from `@/lib/agent-spec/*` while the actual page imports from `@/app/e/agent-spec-builder/lib/*`.

---

## 8. Supabase Usage Patterns

### 8.1 Client creation - **ACCEPTABLE but improvable**

`client.ts` creates a singleton at module level - good. However:
- The `supabase` variable is exported as a nullable (`| null`), then `getSupabase()` throws if null
- This means a build-time error if env vars are missing, which is fine
- But the pattern could be cleaner with a non-null assertion at the module boundary

`server.ts` creates a new admin client on every `supabaseAdmin()` call. The Supabase JS client is lightweight, but this is slightly wasteful. Consider caching at module level.

### 8.2 Experiments table - auto-creation from client

`Comments.tsx` attempts to INSERT into `experiments` if the slug doesn't exist:

```tsx
const { data: inserted, error: insErr } = await getSupabase()
  .from('experiments')
  .insert({ slug })
  .select('id')
  .single()
```

This is done from the **client** (browser) using the anon key. It works because the RLS policy allows authenticated inserts. However:
- **Any authenticated user can create arbitrary experiment rows** - there's no validation that the slug corresponds to a real experiment
- The API route uses `supabaseAdmin().upsert()` which is cleaner
- Consider moving experiment creation to a server action or API route

### 8.3 Realtime - **GOOD USE**

Comments correctly subscribe to `postgres_changes` for both INSERT and UPDATE events, filtered by `experiment_id`. This is the recommended Supabase pattern.

### 8.4 No Supabase types generated

There's no `database.types.ts` file. Types are manually defined inline:

```tsx
type CommentRow = { id: string; body: string; ... }
type Agent = { id: string; label: string; ... }
```

**Run `supabase gen types typescript`** to generate type-safe database types. This prevents type drift as the schema evolves.

### 8.5 No database indexes on query patterns

Based on the migrations, these indexes exist:
- `agents_token_hash_key` (unique) - ✅
- `agents_user_id_idx` - ✅
- `comments_one_per_agent_per_experiment` (unique partial) - ✅

**Missing indexes:**
- `comments.experiment_id` - used in every comment query (`WHERE experiment_id = ?`). **Critical for performance as comments grow.**
- `comments.user_id` - used in comment history page (`WHERE user_id = ?`)
- `experiments.slug` - used for experiment lookup (`WHERE slug = ?`). Should have a unique index.

### 8.6 No `experiments.slug` unique constraint

The `experiments` table appears to use `slug` as a logical key (upsert on conflict uses it), but there's no visible unique constraint in the migrations. The API route uses `{ onConflict: 'slug' }` which implies one exists - but it should be explicitly created in a migration.

### 8.7 `getUser()` vs `getSession()`

The code mixes `getUser()` (network call to Supabase auth) and `getSession()` (reads from local storage). On page load, `getUser()` is called, which is correct for server trust (it validates with Supabase). But the pattern is called repeatedly across components when it should be centralized.

---

## 9. Accessibility

### 9.1 Critical Issues

| Issue | Location | Impact |
|-------|----------|--------|
| **No `color-scheme: dark`** on `<html>` | `layout.tsx` | Scrollbars, form inputs may appear light-themed on some browsers |
| **No `<meta name="theme-color">`** | `layout.tsx` | Mobile browser chrome won't match dark background |
| **No skip-to-content link** | `layout.tsx` | Keyboard users must tab through nav on every page |
| **Tag filter buttons have no `aria-pressed`** | `page.tsx` | Screen readers can't tell which tag is active |
| **Dropdown menu has no ARIA** | `AuthButtons.tsx` | Missing `aria-expanded`, `aria-haspopup="menu"`, `role="menu"`, `role="menuitem"` |
| **No focus-visible styles** | `globals.css` | `outline-none` on inputs with no replacement focus indicator |
| **Avatar `<span>` not semantic** | `AuthButtons.tsx` | Screen reader reads raw letter with no context |
| **Form inputs lack `<label>` elements** | `AccountContent.tsx`, `Comments.tsx` | "Agent name" text is a `<label>` element ✅, but comment textarea has only `placeholder` |
| **`confirm()` for destructive actions** | Multiple | Not accessible; should use a modal dialog |
| **No `aria-live` regions** | Comments | New comments arrive silently for screen readers |
| **Icon-only delete button `×`** | `Comments.tsx` | Has `title` but needs `aria-label` |
| **Realtime status dots have no text alternative** | Multiple | Colored dots only - no screen reader announcement |
| **No heading hierarchy on experiment pages** | Multiple | `<h1>` exists but sub-sections use `<h2>` inconsistently |

### 9.2 Form Issues

| Issue | Location |
|-------|----------|
| No `autocomplete` on inputs | Agent name input, comment textarea |
| No `inputmode` specification | - |
| Placeholders don't end with `…` | "My Bot" should be "My Bot…" per guidelines |
| No error states on form fields | Errors shown via `alert()` |

### 9.3 Animation Issues

| Issue | Location |
|-------|----------|
| `prefers-reduced-motion` respected in `globals.css` ✅ | Root styles |
| But NOT respected in JS animations | Homepage stagger animation (`style={{ transition: ... }}`) |
| `animate-pulse` class used without motion check | Realtime status indicators |

---

## 10. Recommendations - Ranked by Impact

### 🔴 Critical (Do First)

| # | Recommendation | Impact | Effort |
|---|---------------|--------|--------|
| **1** | **Fix nested layout `<html>`/`<body>` tags** in prompt-library and agent-spec-builder layouts. These should NOT render `<html>` or `<body>` - use the root layout. Remove duplicate font loading and `globals.css` imports. | Fixes invalid HTML, font consistency, shared nav | Medium |
| **2** | **Convert homepage to a server component.** Move experiment data to a static array (or fetch from API), render server-side. Extract tag filter into a small client component using `searchParams`. | Eliminates ~50KB+ client JS, improves SEO, faster FCP | Medium |
| **3** | **Add missing database indexes** on `comments.experiment_id`, `comments.user_id`, and ensure `experiments.slug` has a unique index. | Prevents table scans as data grows; critical for production | Low |

### 🟠 High Priority

| # | Recommendation | Impact | Effort |
|---|---------------|--------|--------|
| **4** | **Create a `useAuth()` hook or `AuthProvider` context** to centralize auth state. Eliminates 5+ duplicate `useEffect` auth subscriptions across the codebase. | Reduces duplicate network calls, simplifies components | Medium |
| **5** | **Audit and remove unused `p5` dependency.** If no experiment uses it, remove. If one does, dynamically import. | Saves ~920KB from bundle analysis | Low |
| **6** | **Dynamically import `react-markdown` and `jszip`** - only load when user activates preview mode or clicks export. | Saves ~100KB from initial page load | Low |
| **7** | **Unify design tokens** - create a single `tokens.css` with shared variables (`--bg`, `--fg`, `--border`, etc.) and import across all layouts. Experiments should inherit the root dark theme. | Consistent visual experience | Medium |
| **8** | **Extract `requireAgent()` into shared middleware** at `lib/agent/auth.ts` instead of duplicating across API routes. | Code deduplication, easier to maintain | Low |

### 🟡 Medium Priority

| # | Recommendation | Impact | Effort |
|---|---------------|--------|--------|
| **9** | **Add `color-scheme: dark` to `<html>` and `<meta name="theme-color" content="#08080a">`** | Fixes native UI elements in dark mode | Trivial |
| **10** | **Add ARIA attributes to AuthButtons dropdown** - `aria-expanded`, `aria-haspopup`, keyboard navigation, Escape to close | Accessibility compliance | Medium |
| **11** | **Conditional polling** - only poll when realtime is disconnected. Stop polling when `realtimeStatus === 'connected'`. | Reduces unnecessary network traffic by 50% | Low |
| **12** | **Split `Comments.tsx` into sub-components** - `CommentList`, `CommentForm`, `AgentInviteCard`, `useComments()` hook | Maintainability, testability | Medium |
| **13** | **Generate Supabase types** with `supabase gen types typescript` and use throughout | Type safety, prevents schema drift | Low |
| **14** | **Add skip-to-content link** in root layout | Keyboard accessibility | Trivial |
| **15** | **Add `focus-visible` ring styles** for all interactive elements | Keyboard navigation visibility | Low |
| **16** | **Remove or redirect `/register-bot`** - functionality duplicated in `/account` | Reduces maintenance surface | Trivial |

### 🟢 Low Priority (Polish)

| # | Recommendation | Impact | Effort |
|---|---------------|--------|--------|
| **17** | Add `loading.tsx` skeletons for `/account` and `/account/comments` | Better perceived performance | Low |
| **18** | Replace `alert()`/`confirm()` with toast notifications and modal dialogs | Better UX and accessibility | Medium |
| **19** | Add `<link rel="preconnect">` for Supabase domain | Slightly faster initial auth | Trivial |
| **20** | Add `aria-live="polite"` region for new comments | Screen reader awareness of updates | Low |
| **21** | Investigate replacing in-memory rate limiter with Upstash Redis before production traffic | Rate limiting actually works in serverless | Medium |
| **22** | Add `text-wrap: balance` on headings | Better typography | Trivial |
| **23** | Remove dead `AgentSpecBuilder.tsx` shared component if confirmed unused | Reduce code surface | Trivial |
| **24** | Server-side sanitize comment bodies (strip HTML) on INSERT | Defense in depth for XSS | Low |
| **25** | Add `tabular-nums` to date/number columns in comment lists | Aligned numbers | Trivial |

---

## Appendix: File Inventory

```
src/
├── app/
│   ├── layout.tsx              # Root layout (server component) ✅
│   ├── page.tsx                # Homepage - 'use client' ⚠️
│   ├── globals.css             # Root styles ✅
│   ├── account/
│   │   ├── page.tsx            # Account page (server wrapper) ✅
│   │   └── comments/page.tsx   # Comment history - 'use client' ⚠️
│   ├── agent-setup/page.tsx    # Agent onboarding (server component) ✅
│   ├── register-bot/page.tsx   # Bot registration - duplicate of /account ⚠️
│   ├── api/
│   │   ├── agent/
│   │   │   ├── comment/route.ts  # Agent comment POST ✅
│   │   │   ├── invite/route.ts   # Agent invite POST ✅
│   │   │   └── latest/route.ts   # Latest experiments GET ✅
│   │   └── experiments/route.ts  # Public experiments GET (no rate limit) ⚠️
│   └── e/
│       ├── the-blob/             # Canvas experiment ✅
│       ├── prompt-library/       # Prompt tool - nested <html> ❌
│       └── agent-spec-builder/   # Spec builder - nested <html> ❌
├── components/
│   ├── AuthButtons.tsx         # Auth dropdown (needs ARIA) ⚠️
│   ├── AccountContent.tsx      # Account page content ✅
│   ├── AgentSpecBuilder.tsx    # Possibly dead code ⚠️
│   └── comments/Comments.tsx   # Comment system (needs splitting) ⚠️
├── lib/
│   ├── supabase/
│   │   ├── client.ts           # Browser Supabase client ✅
│   │   └── server.ts           # Admin + user-scoped clients ✅
│   ├── agent/token.ts          # Token generation + hashing ✅
│   ├── rate-limit/simple.ts    # In-memory rate limiter ⚠️
│   └── agent-spec/             # Shared spec builder logic (possibly unused) ⚠️
│       ├── spec.ts
│       ├── lint.ts
│       ├── share.ts
│       └── presets.ts
supabase/migrations/
├── 20260213_agent_linked_comments.sql  # Agents table + comment attribution ✅
└── 20260215_rls_experiments_comments.sql # RLS policies ✅
```

---

*Analysis by Quill - 2026-02-15*