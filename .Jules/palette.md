
## 2024-04-01 - Command Palette Accessibility & Auto-Scroll
**Learning:** Custom interactive components like Command Palettes require manual implementation of the ARIA Combobox pattern (roles combobox, listbox, option; attributes aria-expanded, aria-controls, aria-activedescendant, aria-selected) to be usable by screen readers. Furthermore, keyboard navigation must manually keep the active item in view, especially when the listbox overflows.
**Action:** When creating or modifying scrollable dropdowns or typeahead components, always implement the Combobox pattern using unique generated IDs (`useId()`), and ensure `element.scrollIntoView({ block: 'nearest' })` is triggered when keyboard navigation changes the active descendant.
