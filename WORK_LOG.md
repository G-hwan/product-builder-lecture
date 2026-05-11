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
