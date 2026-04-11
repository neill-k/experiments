## 2024-04-11 - Add aria-busy to loading buttons
**Learning:** Buttons that trigger asynchronous actions should include the `aria-busy={loading}` attribute alongside `disabled` states to properly signal the loading state to assistive technologies like screen readers, as outlined in Memory.
**Action:** When adding or modifying buttons with async actions, ensure `aria-busy` is added along with `disabled`.
