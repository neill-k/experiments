
## 2024-04-29 - Conditionally Hidden Text on Mobile Breaks Accessibility
**Learning:** When using responsive utility classes (like `hidden sm:inline`) to hide descriptive text on small viewports, the element may lose its accessible name for mobile screen reader users if no alternative is provided.
**Action:** Always provide an explicit `aria-label` on interactive elements (e.g., buttons, links) where the main descriptive text is conditionally hidden by responsive utility classes.
