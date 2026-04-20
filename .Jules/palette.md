## 2024-05-19 - Added active item tracking for CommandPalette
**Learning:** Command palette navigation wasn't keeping active elements in view when navigating the list with the keyboard arrow keys.
**Action:** Used a ref array to store references to list item elements and `scrollIntoView({ block: 'nearest' })` triggered by a `useEffect` on `selectedIndex` to keep the active element in view during keyboard navigation.
