
## 2024-05-05 - AuthButtons accessibility and loading feedback
**Learning:** It's important to provide `aria-label` on buttons where the text is conditionally hidden by responsive utility classes (like `hidden sm:inline`) to ensure they remain accessible to screen readers on smaller screens. Also, when asynchronous operations happen, updating button text explicitly (e.g. "Signing in...") and using `aria-busy` provides helpful visual and semantic feedback.
**Action:** Always include an explicit `aria-label` when inner descriptive text might be hidden via CSS breakpoints. Communicate asynchronous states on action buttons with `aria-busy` and explicit loading text.
