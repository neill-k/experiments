## 2026-04-19 - Responsive Element Accessibility
**Learning:** Buttons relying on conditionally hidden text (e.g. `hidden sm:inline`) for their descriptive label will become completely unlabelled for screen reader users on small viewports.
**Action:** Always provide an explicit `aria-label` on interactive elements where the main descriptive text is conditionally hidden by responsive utility classes to ensure an accessible name is present across all viewports.
