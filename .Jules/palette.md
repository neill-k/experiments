## 2024-05-18 - Keyboard Navigation in Scrollable Lists
**Learning:** When navigating a custom scrollable list using keyboard arrow keys (like a command palette), the visually active item can quickly move out of the user's viewport, causing disorientation and making the list unusable for keyboard-only users.
**Action:** Always implement programmatic scrolling using `element.scrollIntoView({ block: 'nearest' })` dependent on the selected index in `useEffect` for custom navigable lists to keep the active item visible.
