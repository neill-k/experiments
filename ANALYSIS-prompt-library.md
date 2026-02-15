# Prompt Library — Analysis Report

**Date:** 2026-02-15  
**Status:** Analysis only — no changes made  
**File:** `src/app/e/prompt-library/page.tsx` (938 lines, single component)

---

## Executive Summary

The prompt library is a **938-line monolithic `'use client'` component** with **16 `useState` hooks**, **7 `useEffect` hooks**, no component decomposition, no custom hooks, no URL state, and a fragile localStorage persistence layer. It violates nearly every guideline in the Vercel React Best Practices, Composition Patterns, and Web Interface Guidelines skills. It functions as a prototype but fails as a product — the UX is clunky, the architecture is unmaintainable, and the design system doesn't match the parent site.

The core problem isn't any single bug — it's that this was built as "dump everything into one component and ship it" without any architectural thought. Every feature (templates, variables, versioning, sharing, search, pinning, LLM testing, settings) is interleaved in a single render function with shared state that makes them impossible to reason about independently.

---

## 1. Component Architecture

### The Problem: 938 Lines, One Component

The entire application — sidebar, editor, preview, variable panel, version history, settings panel, LLM testing, new prompt modal, share/export/import logic, and comments — lives in a single `PromptLibrary()` function. This is the anti-pattern that the Vercel Composition Patterns skill explicitly warns against.

**What's in this one component:**
- Sidebar navigation with search, prompt list, pin toggles, new prompt button, import, and template dropdown
- Main content area with name editor, toolbar (settings/share/preview/save/delete), editor/preview toggle
- Settings panel (API key + model selection)
- Variables panel with input fields
- Version history panel
- Copy/export buttons
- LLM test button + response display
- New prompt modal
- Comments section
- Mobile sidebar overlay

That's roughly **10-12 distinct UI regions** jammed into one render path. Per the composition patterns skill, this should be broken into compound components with shared context, not a monolith with boolean props controlling visibility.

### Specific Violations

- **No compound components.** Everything is inline JSX. There's no `<Sidebar>`, `<Editor>`, `<VariablePanel>`, `<VersionHistory>`, etc.
- **No composition.** The component can't be extended, rearranged, or partially reused. Want to use the editor without the sidebar? Impossible.
- **Boolean prop proliferation (internal).** `showPreview`, `showNewPrompt`, `showPresetDropdown`, `sidebarOpen`, `showSettings` — five booleans controlling mutually exclusive or toggled UI states. This is exactly what the `architecture-avoid-boolean-props` rule warns against.
- **No separation of concerns.** Business logic (createPrompt, savePrompt, deletePrompt, sharePrompt, testWithLLM, serializePrompt, deserializePrompt, extractVariables, substituteVariables) is mixed with UI rendering.

---

## 2. State Management

### 16 `useState` Calls

| Hook | Purpose | Problem |
|------|---------|---------|
| `prompts` | All prompts array | Core data — fine |
| `selectedId` | Currently selected prompt | Should be URL state |
| `editName` | Name input value | Derived from selectedPrompt — synced via effect |
| `editContent` | Editor content | Derived from selectedPrompt — synced via effect |
| `testValues` | Variable fill-in values | Derived from selectedPrompt — synced via effect |
| `showPreview` | Edit/preview toggle | Should be URL state |
| `showNewPrompt` | Modal visibility | UI state — fine as local |
| `newPromptName` | Modal input value | UI state — fine as local |
| `showPresetDropdown` | Dropdown visibility | UI state — fine as local |
| `sidebarOpen` | Mobile sidebar | UI state — fine as local |
| `searchQuery` | Search filter | Should be URL state |
| `showSettings` | Settings panel toggle | Should be URL state |
| `settings` | API key + model | Persistent config — over-coupled with prompts |
| `llmLoading` | API call in progress | UI state — fine |
| `llmResponse` | API response text | Transient result — fine |

**Key issues:**

1. **Derived state stored as state (violation of `rerender-derived-state-no-effect`).** `editName`, `editContent`, and `testValues` are synced from `selectedPrompt` via a `useEffect`. This is the textbook anti-pattern — derive during render or use a key-based reset. The effect creates a render cascade: select prompt → effect fires → setState × 3 → re-render.

2. **No URL state.** `selectedId`, `showPreview`, `searchQuery`, and `showSettings` should all be URL search params (via `nuqs` or similar). This means:
   - You can't link to a specific prompt
   - You can't share a filtered view
   - Browser back button doesn't undo navigation
   - Refreshing loses your selection

3. **Settings coupled to component.** API key and model selection are stored in component state + synced to localStorage via effects. This should be a separate hook or context.

### 7 `useEffect` Calls

| # | Purpose | Problem |
|---|---------|---------|
| 1 | Check URL for shared prompt on mount | Calls `createPrompt` inside effect (violates `react-hooks/set-state-in-effect` — has eslint-disable comment acknowledging it) |
| 2 | Load prompts from localStorage | Calls setPrompts + setSelectedId in same effect |
| 3 | Save prompts to localStorage | Runs on every prompts change — no debounce, no error boundary |
| 4 | Load settings from localStorage | Separate from prompt loading |
| 5 | Save settings to localStorage | Runs on every settings change |
| 6 | Sync selected prompt → edit state | The derived-state-as-effect anti-pattern |
| 7 | (implicit via `createPrompt` being called in effect #1) | |

**The effects create ordering issues.** Effect #1 (shared prompt) calls `createPrompt`, which calls `setPrompts`. But effect #2 (load from localStorage) also calls `setPrompts`. Both run on mount. The shared prompt import could be overwritten by the localStorage load depending on timing. There's no coordination between them.

**No lazy state initialization (violation of `rerender-lazy-state-init`).** The localStorage reads happen in effects instead of lazy initializers:

```tsx
// Current (wrong): effect fires after first render
useEffect(() => {
  const saved = localStorage.getItem('prompt-library');
  if (saved) setPrompts(JSON.parse(saved));
}, []);

// Better: lazy initializer, no flash of empty state
const [prompts, setPrompts] = useState<Prompt[]>(() => {
  try {
    const saved = localStorage.getItem('prompt-library');
    return saved ? JSON.parse(saved) : [];
  } catch { return []; }
});
```

---

## 3. UX/UI Quality

### What's Clunky

1. **Manual save button.** Users must click "save" to persist edits. There's no auto-save, no dirty indicator, no unsaved-changes warning. If you edit content and click another prompt in the sidebar, your changes are silently lost. This is the #1 data-loss vector.

2. **`alert()` for feedback.** The share function uses `alert('Share link copied to clipboard!')`. In 2026. On a dark theme site. This is jarring.

3. **No confirmation for delete.** Clicking "delete" immediately destroys the prompt. No undo, no confirmation modal. Violates the Web Interface Guidelines rule: "Destructive actions need confirmation modal or undo window — never immediate."

4. **Edit/Preview toggle is confusing.** The button says "preview" when you're in edit mode and "edit" when you're in preview mode. But the toggle doesn't preserve scroll position, and switching loses any unsaved variable fill-in context.

5. **Variables panel shows stale data.** Because variables are extracted from `selectedPrompt.variables` (the saved version), not from `editContent` (the current edit), the variable panel doesn't update as you type new `{{variables}}` into the editor. You have to save first.

6. **Version history is append-only noise.** Every save creates a new version. There's no way to name versions, diff between them, or prune old ones. After 20 saves, you have 20 entries that all say "v1" through "v20" with timestamps. Versions only show `toLocaleTimeString()` — no date. If you saved versions across multiple days, they're indistinguishable.

7. **Template dropdown opens upward.** The preset/template dropdown uses `absolute bottom-full`, opening upward from the button. This is disorienting and may clip off-screen on short viewports.

8. **No empty state guidance.** On first visit with no prompts, you get "No prompt selected" with tiny gray text. No tutorial, no suggestion to load a template, no visual invitation to explore.

### What's Broken

1. **Shared prompt import race condition.** If you visit with `?s=...` and have existing prompts in localStorage, both load simultaneously. The shared prompt may or may not appear depending on effect ordering.

2. **Deleting all prompts breaks localStorage.** The save effect has `if (prompts.length > 0)` — so if you delete all prompts, the old data persists in localStorage and reloads on next visit. You can never have an empty library.

3. **API key stored in localStorage as plaintext.** The settings panel stores API keys in localStorage with no encryption, no warning beyond a tiny gray note. Anyone with access to dev tools can read them.

---

## 4. Feature Design — Half-Baked Assessment

| Feature | Status | Assessment |
|---------|--------|------------|
| **Templates/Presets** | ⚠️ Partially done | Good content (the 7 presets are excellent prompts), but loading a template creates a new prompt — you can't browse/preview templates before committing. No categories, no search within templates. |
| **Variables** | ⚠️ Partially done | `{{variable}}` extraction works. But variables don't update live from the editor (only from saved content). No default values, no variable descriptions, no variable types (text vs multiline vs dropdown). |
| **Versioning** | ⚠️ Barely done | Append-only, no diffs, no named versions, no date shown (only time), no way to delete versions, no storage limit. After heavy use, versions bloat localStorage. |
| **Sharing** | ⚠️ Fragile | Base64-encodes entire prompt into URL query param. Long prompts (like the presets at ~2000 chars) create URLs that are ~3000+ characters. Many browsers/platforms truncate URLs over 2048 chars. Import race condition on load. |
| **Search** | ✅ Functional | Simple text search across name + content. Works fine for the scale. |
| **Pinning** | ✅ Functional | Toggle pin, sorted to top. Works. The icon (●/○) is cryptic — no tooltip explains what it means on first encounter. |
| **LLM Testing** | ⚠️ Bare minimum | Direct API call from browser (CORS issues likely with Anthropic API — `x-api-key` header requires server-side proxy). No streaming. No conversation context. No system prompt vs user prompt distinction. |
| **Import/Export** | ⚠️ Minimal | Import reads `.md`/`.txt` files. Export writes basic markdown. No round-trip fidelity (variables, metadata lost on export). |

---

## 5. Mobile Experience

### What Works
- Sidebar has a mobile overlay pattern with hamburger toggle
- Touch targets are 44px minimum (good)
- Buttons and inputs are sized for fingers

### What Doesn't
- **The hamburger button overlaps content.** It's `fixed top-[60px] left-3 z-40` which sits on top of the main content area with no background blending.
- **Editor textarea is cramped.** `min-h-[300px]` on mobile, but the variables panel takes up the remaining space below, pushing comments way down.
- **No swipe gesture for sidebar.** Mobile users expect swipe-to-open. Button-only is friction.
- **Settings panel stacks poorly.** API key input + model dropdown go full-width but the layout shift is jarring.
- **Template dropdown may clip.** Opening upward from bottom of sidebar, it could be hidden behind the keyboard or other elements.
- **No `touch-action: manipulation`** — double-tap zoom delay on interactive elements.

---

## 6. Code Quality

### Duplication
- `font-[family-name:var(--font-mono)]` appears **~30 times** inline. Should be a utility class or component.
- `font-[family-name:var(--font-body)]` appears **~15 times**.
- `font-[family-name:var(--font-display)]` appears **~5 times**.
- `border border-[#1a1a1a]` appears everywhere — should use the `--border` CSS variable from the root stylesheet.
- `min-h-[44px]` appears on **every** interactive element individually.
- Button styling patterns are repeated 15+ times with minor variations.

### Naming
- `editName` / `editContent` — ambiguous. Edit what? "Draft" would be clearer.
- `testValues` — test what? "variableValues" is more descriptive.
- `showPreview` — boolean but also controls the toggle button label. Confusing.
- `PRESETS` — called "presets" in code but "Templates" in UI. Pick one.

### Typing
- `PRESETS` array has no explicit type — it's inferred from `typeof PRESETS[0]`.
- `settings` stores API key as plain string with no validation.
- `Prompt.versions` grows unbounded — no max length type constraint.
- `testValues` is `Record<string, string>` but could have more structured variable types.

### Error Handling
- `JSON.parse` wrapped in try-catch in load effects — good.
- `localStorage.setItem` NOT wrapped in try-catch — will throw when quota exceeded (violation of `client-localstorage-schema`).
- `navigator.clipboard.writeText` not wrapped — will throw if clipboard API is denied.
- `fetch` to LLM APIs has basic error handling but no timeout, no abort controller, no retry.
- No error boundary wrapping the component.

---

## 7. localStorage Patterns

### Current Implementation
```
Key: 'prompt-library'       → JSON array of all prompts (including all versions)
Key: 'prompt-library-settings' → JSON settings object with API key
```

### Problems

1. **No versioning of storage schema (violation of `client-localstorage-schema`).** If the `Prompt` interface changes, old data may break. No migration path.

2. **Unbounded growth.** Each prompt stores ALL versions, each version stores the FULL content. The preset prompts are ~1500-2500 chars each. After 10 prompts with 10 versions each, you're looking at ~250KB+ of localStorage. The 5MB browser limit will eventually be hit with no graceful handling.

3. **No try-catch on writes.** `localStorage.setItem` will throw `QuotaExceededError` when full. The app will silently stop persisting.

4. **API key in plaintext.** `settings.apiKey` is stored as-is. No encryption, no obfuscation, no session-only option.

5. **Can't clear all data.** If you delete all prompts, the save effect skips (due to `prompts.length > 0` guard), so stale data persists.

6. **No export/backup of all data.** If localStorage is cleared (browser update, incognito, clearing site data), everything is gone. No cloud backup, no full-library export.

---

## 8. Design System Alignment

### Parent Site Design Language
The root `layout.tsx` uses:
- **Instrument Serif** (display/headings via `--font-display`)
- **DM Sans** (body via `--font-body`)
- **JetBrains Mono** (code via `--font-mono`)
- **Dark theme:** `#08080a` background, `#ebebeb` foreground
- **No rounded corners** — all borders are sharp
- **CSS variables:** `--bg`, `--fg`, `--muted`, `--border`, `--border-hover`, `--accent`
- **Grain texture + gradient overlay** on body
- **Shared nav bar** at top

### Prompt Library Deviations

1. **Has its own `layout.tsx` with different fonts.** Uses `Geist` and `Geist_Mono` instead of Instrument Serif / DM Sans / JetBrains Mono. This means the prompt library has completely different typography than every other page on the site.

2. **Has its own `globals.css`** that overrides the root styles with a minimal Tailwind config. Loses the grain texture, gradient overlay, and CSS variables.

3. **Hardcodes colors** instead of using CSS variables. `bg-[#08080a]`, `text-[#ebebeb]`, `border-[#1a1a1a]` are hardcoded ~50 times instead of using `var(--bg)`, `var(--fg)`, `var(--border)`.

4. **References font variables that don't exist in its own layout.** The component uses `font-[family-name:var(--font-display)]`, `font-[family-name:var(--font-body)]`, `font-[family-name:var(--font-mono)]` — but its own `layout.tsx` defines `--font-geist-sans` and `--font-geist-mono`. These references only work because the ROOT layout also loads and sets those variables. The experiment's own layout is basically a no-op fighting with the parent.

5. **The experiment layout creates a SECOND `<html>` and `<body>`** if it's rendered as a nested layout — but since it's under `src/app/e/prompt-library/`, Next.js actually uses the ROOT layout from `src/app/layout.tsx`, making this local layout's `<html>`/`<body>` wrapper either ignored or conflicting. This is a structural bug.

6. **No visual character.** The DESIGN.md says "Don't be vanilla" and each experiment should have a "point of view." The prompt library is pure utilitarian gray. No accent color, no distinctive visual element, no personality. It's the "default Next.js" aesthetic the design doc explicitly warns against.

---

## 9. Vision — What Would Make This Actually Good?

The current prompt library is a **CRUD form with localStorage**. It's what you'd build in a tutorial. Here's what a prompt library people would *want to use* looks like:

### The Core Insight
A prompt library isn't a note-taking app. It's a **workbench**. The value isn't storing prompts — it's **iterating on them**. The killer loop is:

1. Write/edit a prompt
2. Fill in variables
3. Test it (see the output)
4. Compare to the previous version
5. Refine and repeat

Everything should optimize for this loop being fast and frictionless.

### Key Design Changes

**1. Auto-save with undo, not manual save.**
Remove the save button entirely. Every keystroke saves after a short debounce. Ctrl+Z works. Version history is automatic but smart — only snapshot after meaningful pauses (not every character).

**2. Split-pane editor with live preview.**
Don't toggle between edit and preview. Show them side-by-side on desktop (editor left, rendered preview right). Variables fill in live as you type them. On mobile, make it a swipeable pane.

**3. Diff view for versions.**
When you click a version, show a diff against the current content. Not just "here's the old text" — show what changed and why it matters.

**4. Template browser, not a dropdown.**
Templates should be a first-class browsing experience. Show a grid/list with descriptions, variable counts, preview snippets. Let people browse before committing. Categories, search, "start from this" button.

**5. Folders or tags for organization.**
Beyond pinning, let users organize prompts into categories. System prompts, code prompts, writing prompts, etc.

**6. Keyboard-first interaction.**
`⌘K` to search, `⌘N` for new prompt, `⌘S` for manual snapshot, `⌘P` for preview, `⌘Enter` to test with LLM. Show a keyboard shortcut hint.

**7. Smart variable UI.**
Variables could have types (short text, long text, dropdown with options), default values, descriptions. The variable panel could be a proper form, not just blank inputs.

**8. Server-side persistence (optional).**
For authenticated users, sync to Supabase. The project already has Supabase configured. This eliminates the localStorage fragility.

**9. An actual design identity.**
Pick an accent color. Add a subtle motif. Make the editor feel like a crafted tool, not a gray box. The presets are excellent writing — the UI should match that quality.

---

## 10. Concrete Recommendations — Ranked by Impact

### 🔴 Critical (Do First)

1. **Delete the experiment-specific `layout.tsx` and `globals.css`.**
   Let the root layout handle fonts and base styles. The current setup creates font conflicts and loses the site-wide design language. Impact: fixes typography, grain texture, and CSS variable availability in one move.

2. **Break into components + custom hooks.**
   Minimum decomposition:
   - `usePromptLibrary()` hook — all state + CRUD operations
   - `useLocalStorage<T>(key, initial)` hook — generic persistence
   - `<Sidebar>` — prompt list, search, actions
   - `<Editor>` — textarea + preview toggle
   - `<VariablePanel>` — variable inputs + version history
   - `<SettingsPanel>` — API config
   - `<NewPromptModal>` — creation dialog
   - `<TemplateDropdown>` — preset browser
   
   This alone takes the file from 938 lines to ~150 per component.

3. **Fix the delete-all-prompts bug.**
   Remove the `if (prompts.length > 0)` guard on the save effect, or handle empty state by writing `[]` to localStorage.

4. **Add destructive action confirmation.**
   Delete needs a confirmation step or undo. This is a Web Interface Guidelines violation that causes real data loss.

### 🟡 High Impact

5. **Add auto-save with debounce.**
   Remove manual save. Debounce writes at 500ms. Show a subtle "Saved" indicator. Eliminate the entire class of "lost my edits" bugs.

6. **Move selected prompt + view state to URL params.**
   Use `nuqs` or `useSearchParams`. `?id=xxx&view=preview&q=search` makes the app linkable, back-button-friendly, and shareable.

7. **Use lazy state initialization for localStorage.**
   Replace the mount-time effects with `useState(() => loadFromStorage())`. Eliminates flash of empty state.

8. **Wrap localStorage writes in try-catch.**
   Handle `QuotaExceededError`. Show a user-facing warning if storage is full.

9. **Live variable extraction from editor content.**
   Extract variables from `editContent` (the draft), not `selectedPrompt.content` (the saved version). Variables should update as the user types.

### 🟢 Medium Impact

10. **Add keyboard shortcuts.** `⌘K` search, `⌘N` new, `Escape` to close modals. Power users expect this from a developer tool.

11. **Replace `alert()` with toast notifications.** Use a minimal toast component for share/copy/export feedback.

12. **Add split-pane editor/preview on desktop.** Side-by-side instead of toggle.

13. **Add version diffs.** Show character-level or line-level diff when browsing versions.

14. **Cap version history.** Keep last 20 versions per prompt. Prune on save.

15. **Use CSS variables from root stylesheet.** Replace all hardcoded `#08080a`, `#1a1a1a`, etc. with `var(--bg)`, `var(--border)`, etc.

16. **Extract shared button/input components.** The same button styling is repeated 15+ times. Create `<ActionButton>` and `<TextInput>` components.

### 🔵 Nice to Have

17. **Template browser experience.** Grid view with descriptions, preview, and categories.

18. **Folders or tags for prompt organization.** 

19. **Supabase sync for authenticated users.**

20. **Proper LLM testing with server-side proxy.** Avoid CORS issues, support streaming, distinguish system vs user messages.

21. **Add a distinctive accent color and visual motif.** Per DESIGN.md, commit to a design point of view.

---

## Appendix: Guideline Violations Summary

### Vercel React Best Practices
- `rerender-derived-state-no-effect` — editName, editContent, testValues synced via effect
- `rerender-lazy-state-init` — localStorage reads in effects, not lazy initializers  
- `client-localstorage-schema` — no versioning, no try-catch on writes
- `js-cache-storage` — localStorage read on every mount with no caching
- `rerender-move-effect-to-event` — shared prompt import in effect instead of event handler

### Vercel Composition Patterns
- `architecture-avoid-boolean-props` — 5 boolean visibility toggles
- `architecture-compound-components` — zero decomposition
- `state-lift-state` — all state trapped in single component
- `state-decouple-implementation` — UI directly coupled to localStorage

### Web Interface Guidelines
- Destructive action (delete) with no confirmation or undo
- No `aria-live` for async updates (LLM response, save confirmation)
- No keyboard shortcut support
- No `touch-action: manipulation`
- No `overscroll-behavior: contain` on sidebar/modal
- `alert()` used for user feedback
- Timestamps use `toLocaleTimeString()` (no `Intl.DateTimeFormat` with explicit options)
- No visible focus states beyond browser default
- No `beforeunload` warning for unsaved changes
- Pin icon (●/○) has no `aria-label` explaining its purpose
- Template dropdown has no keyboard navigation
