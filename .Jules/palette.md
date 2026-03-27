## 2024-05-18 - Accessibility: Disabled vs aria-busy
**Learning:** Buttons that trigger asynchronous actions should include the `aria-busy={loading}` attribute alongside `disabled` states to properly signal the loading state to assistive technologies like screen readers.
**Action:** When adding `disabled={loading}` to a button, always pair it with `aria-busy={loading}`.
