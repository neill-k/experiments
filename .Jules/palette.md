## 2024-05-24 - [CommandPalette scrollIntoView]
**Learning:** CommandPalette lists don't auto-scroll to show the selected item when navigating with arrow keys, causing the selected item to fall out of view.
**Action:** Add `scrollIntoView({ block: 'nearest' })` when selecting items with the keyboard so that the selected item stays in view.
