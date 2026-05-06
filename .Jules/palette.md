## 2026-05-06 - Responsive Button Text Accessibility
**Learning:** Buttons that hide their descriptive text using responsive utility classes (like `hidden sm:inline`) become completely inaccessible to screen reader users on mobile viewports.
**Action:** Always provide an explicit `aria-label` on interactive elements where the main text may be hidden conditionally.
