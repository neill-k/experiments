
## 2026-04-15 - Adding aria-busy to async action buttons
**Learning:** Found a recurring pattern where async action buttons (like submitting comments, favoriting, or generating links) were lacking `aria-busy` attributes and visible loading indicators, creating an inaccessible experience for screen readers during background tasks.
**Action:** Add `aria-busy={state}` and an inline animated spinner with `aria-hidden="true"` to all buttons triggering async tasks to ensure screen readers explicitly announce processing states.
