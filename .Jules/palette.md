
## 2026-04-16 - Accessible Names on Responsive Elements
**Learning:** When using responsive utility classes (like `hidden sm:inline`) to hide text on smaller viewports, the element may lose its accessible name for mobile screen reader users if no `aria-label` is provided. This is particularly common in account dropdown triggers or icon-heavy buttons.
**Action:** Always provide an explicit `aria-label` on interactive elements where the main descriptive text is conditionally hidden by viewport size.
