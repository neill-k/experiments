## 2024-05-19 - Accessibility: Missing ID on form labels
**Learning:** React inputs rendered manually need matching `id` attributes that correspond to the `htmlFor` attribute on the associated `<label>` to be accessible to screen readers, or use `useId()` when possible to avoid duplicate IDs.
**Action:** Always link labels and inputs explicitly, even for simple text fields like the Agent Name in AccountContent.
