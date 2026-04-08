## 2024-04-08 - Explicit Use of useId for Accessibility Links
**Learning:** Hardcoded IDs or implicit labels on input fields can conflict or be unclear to screen readers.
**Action:** Use `React.useId()` to dynamically associate `<label>` and `<input>` fields across components.

## 2024-04-08 - Hidden Labels on Search Inputs
**Learning:** Search inputs, especially in command palettes, often lack visual labels, making them inaccessible to screen readers without an `aria-label`.
**Action:** Always add an explicit `aria-label` to visually unlabeled `input` elements.
