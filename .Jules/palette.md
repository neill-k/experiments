## 2024-11-20 - Responsive Hidden Text Accessibility
**Learning:** Found a recurring pattern where interactive elements (like the account menu trigger button) use responsive utility classes (e.g., `hidden sm:inline`) to hide text on smaller screens. This causes screen readers to have no accessible name for the element when the text is hidden.
**Action:** When creating or modifying buttons/interactive elements that rely on responsive hidden text, always provide an explicit `aria-label` to ensure a consistent accessible name across all viewport sizes.
