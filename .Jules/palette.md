## 2024-04-06 - Command Palette Combobox ARIA & Scrolling
**Learning:** Custom command palettes with keyboard navigation need specific ARIA combobox patterns (`aria-activedescendant`) for screen readers to announce options properly. Also, users expect active items to scroll into view when using arrow keys in long lists.
**Action:** When building interactive lists with arrow key navigation, implement the ARIA combobox pattern and use `scrollIntoView({ block: 'nearest' })` dependent on the selected index.
