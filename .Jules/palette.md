## 2026-03-05 - Add ARIA label to icon-only dropdown toggle
**Learning:** Found an icon-only button `NavDropdown.tsx` that relied solely on a `title` attribute for context. `title` attributes are not reliably announced by all screen readers and are primarily for visual hover tooltips.
**Action:** Always include `aria-label` on icon-only interactive elements, even if a `title` attribute is present, to ensure proper accessibility for screen reader users.
