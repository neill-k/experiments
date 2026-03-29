## 2024-06-18 - Missing aria-labels on inputs
**Learning:** Found several input fields in `src/app/e/prompt-library` missing proper `aria-label` or `id`+`label` associations for screen readers. In forms without visible labels or where labels don't use `htmlFor`, this breaks screen reader accessibility.
**Action:** Add `aria-label` to these input fields to improve accessibility, specifically the Search Bar, New Prompt Modal, and Variable Panel.
