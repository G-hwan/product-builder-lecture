# Work Log

## 2026-05-11

- Project reviewed and ready for follow-up work.
- Current site is a static GitHub Pages site for `행운번호공방`.
- Main files:
  - `index.html`: main page, generator UI, guide, FAQ, winning-number sections.
  - `main.js`: theme toggle, lotto combination generation, filters, copy action, budget comparison, winning-number API loading.
  - `style.css`: layout, responsive styles, dark theme, number-ball animations.
  - `privacy.html`, `terms.html`: policy pages for site and AdSense readiness.
  - `ads.txt`, `robots.txt`, `sitemap.xml`: advertising and search metadata.
- Git status at review time: clean on `main`, tracking `origin/main`.
- Recent completed work: Google AdSense site connection.
- Note for future work: `main.js` includes fallback winning-number data up to draw `1223` on `2026-05-09`; update it manually if relying on fallback data later.

### Generator Initial State Update

- Changed the first-page generator behavior so lotto combinations are not generated automatically on page load.
- Added an empty result message telling the user to press the generation button.
- The combination stats and match summary now stay blank until the user clicks `조합 생성`.

### Initial Scroll Position Update

- Added startup scroll handling so the page opens from the top hero section instead of restoring a previous generator-section position.
- Existing in-page navigation still works after the page has loaded.

### Mobile Layout Update

- Improved small-screen spacing for the sticky header, hero, panels, and action buttons.
- Adjusted winning-number and generated-number ball grids so they fit more predictably on narrow screens.
- Added wrapping behavior for stats rows to avoid cramped text on mobile.
- Hid the empty match-summary block until combinations are generated.

### Winning Number Loading Update

- Added a timeout to the external lotto winning-number request.
- If the external request is blocked or times out, the page now switches to the built-in fallback draw data instead of staying on the loading message.
- Future unpublished draw numbers are still skipped while searching for the latest available draw.

### Winning Card Overflow Fix

- Changed winning-number balls from a fixed eight-column grid to a wrapping flex layout.
- Adjusted the winning-card title row so the draw number and date stay inside the card.
- This prevents the bonus ball from spilling outside the latest-draw preview panel.

### Winning Card Ball Layout Update

- Updated the winning-number card to show all six regular numbers on the first row.
- The plus sign and bonus number now appear on the next row.
- Added a narrower mobile rule so this layout still fits on very small screens.

### Winning Card Column Width Update

- Changed the winning-number grid columns to fill the card width evenly on desktop.
- Centered each ball and the plus sign inside its grid column.
- Kept responsive minimum column widths for mobile screens.

### Recent Winning List Spacing Fix

- Restored compact spacing for the recent seven-draw winning-number list.
- Kept the wider evenly spaced layout only for the latest-draw preview card.

### Clear Selection Behavior Update

- Changed `선택 초기화` so it only clears fixed and excluded number selections.
- Existing generated combinations now stay visible instead of being regenerated.
- Added a status message explaining that new numbers are created with the `조합 생성` button.

### Winning Number Perceived Speed Update

- Changed winning-number loading to render built-in fallback draw data immediately.
- Live lottery API data now updates the cards afterward if the request succeeds.
- This avoids showing a loading message while waiting for a slow or blocked external request.

### Copy Button Label Update

- Renamed the copy button from `전체 복사` to `생성 결과 복사`.
- Removed the always-visible copy helper text from the initial generator view.
- Updated the copy success message to explain that copied combinations can be pasted into memo apps, chat, or spreadsheets.

### Button Tooltip And Click Feedback Update

- Added hover/focus tooltip text to the generator action buttons.
- Added a short click pulse animation to buttons so button presses feel responsive.
- Respected reduced-motion preferences by disabling the click animation when requested.
