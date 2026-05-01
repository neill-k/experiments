## 2024-05-18 - Explicitly associate labels in React
**Learning:** In React apps, explicitly associating `<label>` elements with their `<input>` using the `htmlFor` and `id` attributes should use the `useId()` hook to avoid hardcoded IDs that may collide.
**Action:** Use `useId()` for all explicit label-input associations to ensure screen reader accessibility without risk of ID collisions across multiple instances of a component.
