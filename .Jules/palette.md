## 2024-04-12 - Missing ARIA Labels on Responsive Content
**Learning:** Text content visually hidden on small viewports (e.g., using `hidden sm:inline`) renders the interactive element (like a button) effectively an icon-only button to screen reader users or keyboard users on small devices.
**Action:** Always provide an explicit `aria-label` on interactive elements where the main descriptive text is conditionally hidden by responsive utility classes.
