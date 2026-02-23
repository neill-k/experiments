# Palette's Journal

This journal records critical UX/accessibility learnings, patterns, and insights.

## 2026-02-23 - Command Palette Accessibility Gap
**Learning:** Custom interactive components like `CommandPalette` often implement keyboard navigation (Arrow keys, Enter) but lack the semantic ARIA attributes (`role="combobox"`, `aria-activedescendant`) needed for screen reader accessibility. This makes the UI usable for sighted keyboard users but broken for blind users.
**Action:** Audit all custom input-driven navigation components for ARIA Combobox pattern compliance.
