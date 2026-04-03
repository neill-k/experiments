## 2026-04-03 - Responsive Text Accessibility
**Learning:** Interactive elements using responsive display utilities (like `hidden sm:inline`) lose their accessible text on small viewports because screen readers ignore hidden text. Additionally, disabling buttons during async operations without `aria-busy` leaves assistive technologies unaware of the loading state.
**Action:** Always provide an explicit `aria-label` on buttons where text content is conditionally hidden via responsive CSS classes, and pair `disabled` attributes with `aria-busy` for loading buttons.
