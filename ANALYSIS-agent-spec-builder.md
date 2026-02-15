# Agent Spec Builder — Architecture & Quality Analysis

**Date:** 2026-02-15  
**Scope:** All files in `src/app/e/agent-spec-builder/`, `src/components/AgentSpecBuilder.tsx`, `src/lib/agent-spec/`, and `overnight-builder/DESIGN.md`  
**Total lines analyzed:** ~3,807 across 14 files

---

## Executive Summary

The Agent Spec Builder is a well-conceived tool with solid domain logic (spec generation, linting, quality scoring, eval rubrics, export packs, prompt packs). The lib layer is clean and well-separated. However, the UI is a **927-line monolithic component** with significant architectural debt, duplicated code across two parallel implementations, design system misalignment, and accessibility gaps. The tool feels like a **strong prototype** — functional and useful, but not polished enough for production.

**Biggest wins available:**
1. Eliminate the duplicated codebase (two complete implementations exist)
2. Extract the monolith into composable components
3. Fix the examples page (renders in light mode, broken CSS classes)
4. Add localStorage persistence for work-in-progress

---

## 1. Component Architecture

### The Problem: A 927-Line Monolith

`page.tsx` is a single `Home()` component containing:
- All state management (7+ useState hooks)
- URL parameter parsing
- Session tracking
- Quality meter UI
- Spec input form (12+ fields)
- Tool contract editor (nested CRUD)
- Eval rubric editor (nested CRUD)
- Generated spec output panel
- Preview/raw toggle
- Lint results
- Export actions (6 buttons)
- Toast notifications
- Footer with stats
- Comments section

This violates the Vercel composition pattern of avoiding boolean prop proliferation and monolithic components. Every keystroke in any field rerenders the entire 927-line tree.

### The Duplicate Codebase Problem

There are **two complete implementations**:

| File | Lines | Features |
|------|-------|----------|
| `src/app/e/agent-spec-builder/page.tsx` | 927 | Quality meter, eval rubric, export pack, prompt pack, local stats, hints |
| `src/components/AgentSpecBuilder.tsx` | 570 | Older version, no eval rubric, no quality meter, no export pack |

And **two complete lib directories**:

| Path | Files |
|------|-------|
| `src/app/e/agent-spec-builder/lib/` | spec.ts, lint.ts, presets.ts, share.ts, quality.ts, export-pack.ts, prompt-pack.ts, local-stats.ts |
| `src/lib/agent-spec/` | spec.ts, lint.ts, presets.ts, share.ts (older versions, missing evalCases field) |

The `src/lib/agent-spec/` versions are stale — `SpecInput` doesn't include `evalCases`, presets have only 5 items vs 11, and share.ts doesn't handle evalCases. This is a maintenance landmine.

### What Should Be Extracted

```
components/
├── SpecInputForm/
│   ├── SpecInputForm.tsx          # Form orchestrator
│   ├── ToolContractEditor.tsx     # CRUD for tool contracts
│   ├── EvalRubricEditor.tsx       # CRUD for eval cases
│   ├── BudgetFields.tsx           # Cost/latency budget group
│   └── QualityMeter.tsx           # Completeness scoring bar
├── SpecOutput/
│   ├── SpecOutput.tsx             # Output panel orchestrator
│   ├── SpecPreview.tsx            # Raw/preview toggle
│   ├── LintResults.tsx            # Lint findings display
│   └── ExportActions.tsx          # Copy, share, download, export, prompt pack
├── ui/
│   ├── Field.tsx                  # Reusable input field
│   ├── TextArea.tsx               # Reusable textarea
│   └── Toast.tsx                  # Toast notification
└── hooks/
    ├── useSpecState.ts            # State + URL parsing + persistence
    └── useLocalStats.ts           # Session tracking wrapper
```

**Impact: HIGH** — Enables independent testing, reduces rerender scope, makes the codebase navigable.

---

## 2. State Management

### Current State

All state lives in a single `useState<SpecInput>` with spread-based updates:
```tsx
setInput({ ...input, appName: v })
```

This is **fine for the current scale** but has issues:

### Issue: Every Field Change Rerenders Everything

Each keystroke in any field triggers:
1. `setInput(...)` — new state object
2. `useMemo(() => generateSpecMarkdown(input), [input])` — regenerates full markdown
3. `useMemo(() => lintSpec(input), [input])` — re-lints
4. `useMemo(() => evaluateQuality(input), [input])` — re-scores
5. Full component re-render (927 lines of JSX)

The `useMemo` calls are appropriate for derived values, but the entire tree re-renders because nothing is extracted or memoized. The tool contract and eval case editors are particularly expensive since they map over arrays inline.

### Issue: Tool Contract Updates Are Verbose and Fragile

Every tool contract field change clones the entire array:
```tsx
const updated = [...input.toolContracts];
updated[idx] = { ...tc, name: e.target.value };
setInput({ ...input, toolContracts: updated });
```

This pattern is repeated **14 times** across tool contracts and **5 times** across eval cases. A single `updateToolContract(idx, field, value)` helper would eliminate ~60 lines of duplicated mutation logic.

### Issue: No Functional setState

Per Vercel React best practices (`rerender-functional-setstate`), updates based on current state should use functional form:
```tsx
// Current (stale closure risk):
setInput({ ...input, appName: v })

// Better:
setInput(prev => ({ ...prev, appName: v }))
```

### Issue: No Debouncing on Expensive Derived Computations

`generateSpecMarkdown`, `lintSpec`, and `evaluateQuality` all run on every keystroke. While currently fast, markdown generation with 10+ tool contracts and eval cases could become sluggish. Consider `useDeferredValue` or `startTransition` for the non-critical derived values (lint, quality score).

### No Race Conditions

The single-threaded, synchronous state model means no race conditions exist. Clipboard operations correctly use try/catch with finally for cleanup.

---

## 3. UX/UI Quality

**Verdict: Functional prototype, not a polished tool.**

### Strengths
- Quality meter is a genuinely good UX idea — provides progressive disclosure of what's missing
- Lint results offer specific, actionable suggestions
- Presets are well-written and cover diverse use cases
- "Start with 5 common cases" button for eval rubric is excellent onboarding
- Field hints (the `hint` prop) guide users effectively
- Export Pack (ZIP) and Prompt Pack are differentiated, high-value features

### Issues

**Toast notification is bare-bones:**
- No `aria-live` region for screen readers
- Disappears after 2.5s regardless of content length
- Multiple rapid actions can overlap toasts (only last one shown)
- No visual differentiation between success and error states

**Action button overflow on output panel:**
The output section header has 7 buttons (Raw/Preview toggle, Copy, Share link, Download .md, Export Pack, Prompt Pack). On medium screens, these wrap awkwardly. On mobile, they stack vertically but consume significant viewport space.

**No persistence of work-in-progress:**
If the browser tab closes, all work is lost. There's no auto-save to localStorage. The `local-stats` module tracks usage stats but doesn't save the spec itself. This is the single biggest UX gap — users creating complex specs with tool contracts and eval cases can lose everything.

**No undo/redo:**
"Clear" button wipes everything with no confirmation and no undo. Destructive action with no safety net violates web interface guidelines.

**No unsaved changes warning:**
No `beforeunload` handler to warn about leaving with unsaved work.

**Examples page is broken:**
- Renders in **light mode** (white background, `text-zinc-900`) while the main builder is dark
- Uses `className="rounded-none-lg"` and `className="rounded-none-xl"` — these are not valid Tailwind classes (probably meant to remove rounding but the syntax is wrong)
- Links point to `/?example=...` (root) instead of `/e/agent-spec-builder?example=...`
- Header link "Back to builder" points to `/` instead of `/e/agent-spec-builder`

**No search/filter on presets:**
With 11 presets, the preset buttons in the header overflow. Consider a dropdown or modal instead of inline buttons.

---

## 4. Mobile Responsiveness

### Layout: Mostly Handled
- `grid-cols-1 lg:grid-cols-2` correctly stacks panels on mobile
- `flex-col sm:flex-row` patterns handle header layout
- `overflow-hidden` on main prevents horizontal scroll

### Issues

**Touch targets too small:**
- Tool contract "Remove" button: bare text link, no padding — fails 44×44px minimum
- Eval case "Remove" button: same issue
- Eval category `<select>`: `text-xs` with minimal padding
- Quality category tags: `text-[10px]` with `px-1.5 py-0.5` — too small for touch
- Preset buttons: `px-3 py-1` at `text-sm` — borderline

**Overflow in tool contract/eval editors:**
- `grid-cols-1 md:grid-cols-2` is fine, but the nested cards have no max-width constraint
- Long tool names in inputs can push beyond viewport on narrow screens

**Preview panel scroll:**
- `max-h-[60vh]` on the preview area is appropriate but could be problematic on landscape phones where 60vh is very small

**Header navigation:**
- "Examples" and "GitHub" links in the header are adequate size but have no active state

---

## 5. Code Quality

### Duplication

**Critical: The entire codebase is duplicated.**

| Concern | `app/e/agent-spec-builder/lib/` | `lib/agent-spec/` |
|---------|------|------|
| spec.ts | 202 lines (with evalCases) | 168 lines (without evalCases) |
| lint.ts | Identical 103 lines | Identical 103 lines |
| presets.ts | 578 lines (11 presets) | 238 lines (5 presets) |
| share.ts | 60 lines (with evalCases) | 58 lines (without evalCases) |

The older `src/lib/agent-spec/` should be deleted or consolidated.

**`bulletize()` function duplicated 4 times:**
Appears in `spec.ts`, `export-pack.ts`, `prompt-pack.ts`, and `lint.ts` (as `lines()`). Should be a shared utility.

**`slugify()` function duplicated twice:**
In both `export-pack.ts` and `prompt-pack.ts`.

**`downloadText()` pattern duplicated:**
The blob → URL → anchor → click → cleanup pattern appears in `page.tsx`, `AgentSpecBuilder.tsx`, and `prompt-pack.ts`.

### Naming

- `Home()` as the component name for the main page — should be `AgentSpecBuilderPage` or similar
- `empty` as the initial state constant — `INITIAL_SPEC` or `EMPTY_SPEC` would be clearer
- `md` as the markdown variable — too terse, `specMarkdown` is clearer
- `copy()` and `copyShareLink()` — fine
- `ec` for eval case and `tc` for tool contract — acceptable in inline map callbacks

### Typing

Generally good. `SpecInput`, `ToolContract`, `EvalCase`, `LintFinding`, `LocalStats` are all well-typed. No `any` usage. One concern:

- `decodeSpecState` does minimal validation — it trusts that parsed JSON conforms to `SpecInput`. A runtime schema validator (zod) would prevent malformed share links from corrupting state.

### Error Handling

- Clipboard operations: properly wrapped in try/catch ✓
- localStorage operations: properly wrapped in try/catch ✓
- Export pack generation: try/catch with toast feedback ✓
- Share link decoding: try/catch returning null ✓
- Missing: no error boundary for the React tree itself

---

## 6. localStorage Usage

### Current Usage

Only `local-stats.ts` uses localStorage, storing usage counters under `agent-spec-builder-stats`. The spec itself is **not** persisted.

### Issues

**No versioning on stats key:**
Per Vercel best practice `client-localstorage-schema`, localStorage keys should be versioned:
```typescript
// Current:
const STORAGE_KEY = "agent-spec-builder-stats";

// Should be:
const STORAGE_KEY = "agent-spec-builder-stats:v1";
```

**No spec auto-save (the big miss):**
Users creating complex specs with tool contracts and eval cases can lose everything on page close. Add:
```typescript
// Auto-save on every state change (debounced)
useEffect(() => {
  const timer = setTimeout(() => {
    try {
      localStorage.setItem('agent-spec-builder-draft:v1', JSON.stringify(input));
    } catch {}
  }, 500);
  return () => clearTimeout(timer);
}, [input]);
```

**Size limit risk with share links:**
`encodeSpecState` base64-encodes the full JSON state into a URL query parameter. With 10 tool contracts and 10 eval cases with detailed content, this can easily exceed browser URL length limits (~2,000–8,000 chars depending on browser). No warning or fallback is provided.

**localStorage quota:**
The stats object is tiny (<1KB). If spec auto-save is added, a fully loaded spec could be 5-20KB — well within the ~5MB quota. But consider adding a size check.

---

## 7. Design System Alignment

### Expected: Instrument Serif / DM Sans / JetBrains Mono, dark theme, no rounded corners

### Actual Issues

**Wrong font family:**
Layout uses Geist Sans and Geist Mono, not Instrument Serif / DM Sans / JetBrains Mono. This is a standalone experiment layout, so it has its own font choices — but it doesn't match the parent site's design language.

**Rounded corners inconsistency:**
The DESIGN.md says dark theme family but doesn't mandate corner styles. However, the quality meter progress bar uses `rounded-full`, and the quality category indicator dots use `rounded-full`. The rest of the UI correctly uses no rounding (`border` without `rounded-*`). The `AgentSpecBuilder.tsx` version uses `rounded` on inputs — inconsistent.

**Color system:**
- Main page uses `bg-[#08080a]`, `text-[#ebebeb]`, `border-[#2a2a2a]`, `bg-[#0a0a0c]` — a consistent dark palette ✓
- Older `AgentSpecBuilder.tsx` uses `bg-white/[0.02]`, `text-white/80`, `bg-white/5` — alpha-based approach, inconsistent with the main version
- Accent colors: emerald for positive states, amber for prompt pack, red for remove — reasonable but undocumented

**Typography tokens:**
No use of the semantic font variables. Body text uses Tailwind defaults. The globals.css sets `font-family: Arial, Helvetica, sans-serif` which overrides the Geist font variable, meaning the Google font load is wasted.

**globals.css defines light mode variables that are never used:**
```css
:root {
  --background: #ffffff;
  --foreground: #171717;
}
```
The page hardcodes dark colors directly, never referencing these CSS variables.

### Examples Page: Complete Design Break
The examples page renders in light mode (`bg-zinc-50 text-zinc-900 border-zinc-200 bg-white`) — completely breaking the dark theme requirement.

---

## 8. Accessibility

### Critical Issues

**No skip link:**
No skip-to-content link for keyboard users.

**No focus management after actions:**
After loading a preset, clearing the form, or copying to clipboard, focus is not managed. Users relying on screen readers get no indication that state changed.

**Toast has no `aria-live` region:**
```tsx
// Current:
{toast ? <div className="...">{toast}</div> : null}

// Should be:
<div role="status" aria-live="polite">{toast}</div>
```

**Icon-only buttons without labels:**
Not applicable here (buttons all have text), but the "Remove" buttons in tool contracts/eval cases are styled as bare text and could benefit from a more accessible label: `aria-label="Remove tool contract: ${tc.name}"`.

**No focus-visible styles:**
Inputs have `ring-zinc-700 focus:ring-2` which is decent, but buttons have **no visible focus indicator**. Every interactive element uses `hover:` states but no `focus-visible:` states.

**Checkbox has no associated label element:**
The idempotent checkbox uses a sibling `<span>` but isn't wrapped in a `<label>`, so clicking the text doesn't toggle the checkbox:
```tsx
// Current:
<input type="checkbox" ... className="h-4 w-4" />
<span className="text-xs text-zinc-400">Idempotent</span>

// Should be:
<label className="flex items-center gap-2">
  <input type="checkbox" ... className="h-4 w-4" />
  <span className="text-xs text-zinc-400">Idempotent</span>
</label>
```

**Form inputs missing `name` and `autocomplete` attributes:**
Per web interface guidelines, all inputs should have meaningful `name` attributes and appropriate `autocomplete` settings.

**Select element for eval categories has no label:**
The `<select>` for eval case category has no associated `<label>` or `aria-label`.

**Heading hierarchy:**
`<h1>` → `<h2>` (Inputs / Generated Spec) is correct. However, "Tool Contracts (structured)" and "Eval Rubric" use `<div>` with font-medium styling instead of `<h3>`, breaking the semantic hierarchy.

---

## 9. Feature Completeness

### What's There (Good Coverage)
- ✅ Form input with field validation hints
- ✅ Quality completeness meter
- ✅ Spec linting with actionable suggestions
- ✅ Raw markdown and rendered preview
- ✅ Copy to clipboard
- ✅ Share via URL
- ✅ Download as .md
- ✅ Export pack (ZIP: SPEC.md, EVAL_PLAN.md, SECURITY_NOTES.md, PROMPTS.md, README.md)
- ✅ Prompt pack generation
- ✅ 11 diverse presets
- ✅ Structured tool contracts
- ✅ Eval rubric builder
- ✅ Local usage stats

### What's Missing

| Feature | Priority | Rationale |
|---------|----------|-----------|
| **Auto-save to localStorage** | P0 | Users lose all work on page close |
| **Undo/redo** | P1 | "Clear" is destructive with no recovery |
| **Confirmation before Clear** | P1 | Destructive action needs confirmation |
| **`beforeunload` warning** | P1 | Prevent accidental navigation away |
| **Keyboard shortcuts** | P2 | Cmd+S to download, Cmd+C to copy, etc. |
| **Collapsible sections** | P2 | Form is very long; collapsing filled sections would improve navigation |
| **Import from markdown** | P2 | Allow round-tripping — paste an existing spec and parse it |
| **URL state sync** | P2 | Per web guidelines: tabs, sections, and filter state should reflect in URL |
| **Diff view** | P3 | Show what changed between edits (useful for share link comparison) |
| **Version history** | P3 | List of past saved drafts in localStorage |
| **AI-assisted completion** | P3 | Optional: use an LLM to suggest missing sections based on filled ones |
| **Dark mode select/checkbox styling** | P2 | Native `<select>` and `<input type="checkbox">` render with OS defaults, looking jarring in the dark theme |

---

## 10. Concrete Recommendations Ranked by Impact

### Tier 1 — Ship Blockers (Do First)

1. **Delete `src/lib/agent-spec/` and `src/components/AgentSpecBuilder.tsx`**  
   These are stale duplicates. The canonical code is in `src/app/e/agent-spec-builder/`. The old lib is missing `evalCases` in `SpecInput` and will cause type errors if anything imports it.  
   *Effort: 10 min. Impact: Eliminates confusion and stale-code bugs.*

2. **Add localStorage auto-save for the draft spec**  
   Save `input` state to localStorage on change (debounced 500ms). Load on mount (before URL params, which should override). Key: `agent-spec-builder-draft:v1`.  
   *Effort: 30 min. Impact: Prevents data loss — the #1 UX issue.*

3. **Fix the Examples page**  
   - Switch to dark theme to match the builder
   - Fix links to point to `/e/agent-spec-builder?example=...`
   - Remove invalid `rounded-none-lg` / `rounded-none-xl` classes
   *Effort: 20 min. Impact: Currently completely broken.*

4. **Add `beforeunload` warning and Clear confirmation**  
   ```tsx
   useEffect(() => {
     const handler = (e: BeforeUnloadEvent) => { e.preventDefault(); };
     window.addEventListener('beforeunload', handler);
     return () => window.removeEventListener('beforeunload', handler);
   }, []);
   ```
   And wrap the Clear button with `if (!confirm('Clear all fields?')) return;`.  
   *Effort: 10 min. Impact: Prevents accidental data loss.*

### Tier 2 — Architecture (Do Next)

5. **Extract the monolith into ~8 focused components**  
   Follow the component structure in Section 1. Key extractions:
   - `ToolContractEditor` — eliminates 14 inline onChange handlers
   - `EvalRubricEditor` — eliminates 5 inline onChange handlers  
   - `QualityMeter` — self-contained, memoizable
   - `ExportActions` — 7 buttons with handlers
   - `LintResults` — stateless display
   - `Field` / `TextArea` — already extracted, move to shared `ui/`
   *Effort: 2-3 hours. Impact: Halves the component size, enables memoization, makes code navigable.*

6. **Create shared utility module for `bulletize`, `slugify`, `downloadBlob`**  
   Currently duplicated across 4+ files.  
   *Effort: 20 min. Impact: DRY, single source of truth.*

7. **Use `useReducer` or a custom `useSpecState` hook**  
   Consolidate the 7+ useState hooks and URL parsing logic into a single hook. Provides a cleaner API and enables undo/redo via action history.  
   *Effort: 1 hour. Impact: Cleaner state management, enables undo feature.*

### Tier 3 — Polish (Refinements)

8. **Add accessibility fixes**  
   - `aria-live="polite"` on toast container
   - `focus-visible:ring-2` on all buttons
   - `<label>` wrappers on checkboxes
   - `aria-label` on category `<select>`
   - `name` attributes on form inputs
   - Skip link to main content
   *Effort: 45 min. Impact: Baseline accessibility compliance.*

9. **Style native form controls for dark mode**  
   The `<select>` and `<input type="checkbox">` render with OS-default styling. Add custom styling or use a design system component.  
   *Effort: 30 min. Impact: Visual consistency.*

10. **Add collapsible sections to the input form**  
    The form is very long. Let users collapse filled sections (accordion pattern). Store collapse state in URL or localStorage.  
    *Effort: 1 hour. Impact: Better navigation, especially on mobile.*

11. **Add share link size warning**  
    When the encoded state exceeds ~2,000 chars, warn the user that the link may not work in all browsers. Consider a server-side short URL fallback.  
    *Effort: 20 min. Impact: Prevents silent failures on complex specs.*

12. **Fix globals.css font override**  
    Remove `font-family: Arial, Helvetica, sans-serif` from `body` — it overrides the Geist font variable loaded in `layout.tsx`, wasting a Google Fonts network request.  
    *Effort: 5 min. Impact: Correct typography, faster load.*

### Tier 4 — Future Features

13. **Keyboard shortcuts** (Cmd+S, Cmd+C, Cmd+Shift+S for share)
14. **Import from markdown** (parse an existing spec into the form)
15. **Undo/redo** (via useReducer action history)
16. **Version history** (list of localStorage snapshots)

---

## Appendix: File-Level Notes

### `page.tsx:1` — Missing `"use client"` is actually present ✓

### `page.tsx` — Web Interface Guidelines Findings

```
page.tsx:70    - "..." → "…" in placeholder strings (multiple instances)
page.tsx:112   - Header link to /examples should be /e/agent-spec-builder/examples
page.tsx:115   - GitHub link points to https://github.com (generic, not actual repo)
page.tsx:141   - Quality meter progress bar uses rounded-full (inconsistent with no-rounding design)
page.tsx:199   - Tool contract "Remove" button: no focus-visible style
page.tsx:199   - Tool contract "Remove" button: touch target too small (text-only)
page.tsx:229   - Checkbox not wrapped in <label> — clicking text doesn't toggle
page.tsx:248   - textarea fields missing name attribute
page.tsx:376   - Eval category <select> missing aria-label
page.tsx:402   - "Remove" eval case button: no focus-visible, small touch target
page.tsx:490   - 7 action buttons in header — consider dropdown on mobile
page.tsx:544   - Toast div missing aria-live="polite"
page.tsx:598   - <pre> code block: no max-width, very long lines won't wrap in raw mode
page.tsx:627   - Footer "..." should be "…"
```

### `examples/page.tsx` — Critical Issues

```
examples/page.tsx:6   - Light mode (bg-zinc-50) breaks dark theme requirement
examples/page.tsx:13  - "rounded-none-lg" is not a valid Tailwind class
examples/page.tsx:23  - Link href="/" should be "/e/agent-spec-builder"
examples/page.tsx:33  - Link href=`/?example=...` should be `/e/agent-spec-builder?example=...`
examples/page.tsx:36  - "rounded-none-xl" is not a valid Tailwind class
examples/page.tsx:44  - "rounded-none-lg" repeated
```

### `globals.css` — Issues

```
globals.css:14 - body font-family overrides Geist font variable from layout.tsx
globals.css:3-5 - Light mode CSS variables defined but never used (page hardcodes dark colors)
```

### `layout.tsx` — Clean ✓

Properly sets metadata, OG tags, and font variables. No issues.

### `lib/spec.ts` — Clean ✓

Well-structured markdown generation. Good use of helper functions.

### `lib/quality.ts` — Clean ✓

Weighted scoring system is well-designed. Clear category definitions.

### `lib/lint.ts` — Clean ✓

Good heuristic-based linting. `isVagueMetric` is clever.

### `lib/presets.ts` — Good but Large

578 lines of preset data. Consider moving to a JSON file or splitting into individual preset files for maintainability.

### `lib/local-stats.ts` — Missing Key Versioning

Otherwise clean. Try/catch on all storage operations ✓.

### `lib/share.ts` — Fragile Decoding

No schema validation on decoded JSON. Malformed share links could inject unexpected data into state.

### `lib/export-pack.ts` — Well Done ✓

Clean ZIP generation. Good README generation. Minor: `bulletize` and `slugify` should be imported from a shared utility.

### `lib/prompt-pack.ts` — Well Done ✓

Clever deterministic prompt generation without LLM. Good category coverage. Same utility duplication issue.

---

## Summary

The Agent Spec Builder has **excellent domain logic** — the spec generator, linter, quality scorer, eval rubric, export pack, and prompt pack are all well-designed and useful. The main issues are **architectural** (monolith, duplication) and **UX-level** (no persistence, broken examples page, accessibility gaps). The Tier 1 fixes (delete duplicates, add auto-save, fix examples, add `beforeunload`) can be done in under 2 hours and would dramatically improve the tool's reliability and polish.
