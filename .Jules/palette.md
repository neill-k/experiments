## 2026-04-25 - Explicit ARIA Labels for Responsive Text
**Learning:** Text hidden on small screens via Tailwind's `hidden sm:inline` class makes interactive elements like buttons empty for screen readers on mobile devices, breaking accessibility.
**Action:** Always provide an explicit `aria-label` on buttons or interactive elements where the main descriptive text is conditionally hidden by responsive utility classes.
