## 2024-04-28 - Missing ARIA busy states on submit buttons
**Learning:** Found several async action buttons (like post comment, generate link) that disable during loading but do not provide screen-reader feedback about their busy state.
**Action:** Add aria-busy={loading} to buttons performing async actions to improve accessibility.
