# KUTA motion and interaction polish

Date: 18 October 2026 (Asia/Manila). Implemented in the active `bokeh-favicon/1KUTA` worktree, based on commit `8d3c7d0`. Not committed, pushed, or deployed. No new dependencies. Sync watcher remains stopped.

## Files changed

| File | Reason |
|---|---|
| `app/motion.css` (new) | Shared timing, easing, glass, shadow, reveal, spotlight, touch, and reduced-preference rules. |
| `lib/motion-effects.ts` (new) | Observer-driven once-only reveals, dynamic-list discovery, delegated pointer spotlight, and cleanup. |
| `components/design-motion.tsx` | Mount the shared effects on every route. |
| `app/layout.tsx` | Load shared motion CSS and mount the observer at the root. |
| `app/page.tsx` | Remove the homepage-only observer mount. |
| `app/globals.css` | Replace disparate motion values with tokens, remove header height animation, and retire large-surface neumorphism. |
| `app/design-refresh.css` | Tokenize existing marquee, shimmer, and interactions; remove competing reveal/hover rules. |
| `app/green-bokeh.css` | Remove the remaining competing hover-shadow behavior while preserving accessibility palettes. |
| `app/dashboard-favorites.css` | Tokenize favorite loading and interactions; remove the obsolete pressed transform. |
| `app/paper-cards.css` | Align action feedback and preserve two-line title clamping with larger paper/favorite title hit areas. |
| `components/space-background.css` | Keep backgrounds, make hero text solid, and remove persistent layer hints and competing hero interaction rules. |
| `components/space-background.tsx` | Use a 24px IntersectionObserver sentinel for header glass; read pointer range from tokens and honor preference gates. |
| `components/scroll-progress.tsx` | Cache geometry outside scroll events and label/measure paper reading progress. |
| `app/about/about-navigation.tsx` | Replace repeated scroll-time section measurements with an intersection observer. |
| `components/year-bento.tsx` | Remove its separate inline stagger so the shared observer owns entry timing. |
| `components/favorite-button.tsx` | Use pointer entry instead of mouse-only entry for its existing tooltip. |
| `lib/supernova.ts` | Replace the 1.2-second full-screen canvas with a token-driven CSS bloom and complete cleanup. |
| `scripts/test-motion-effects.mjs` (new) | Test dynamic reveals, focus, pointer coalescing, touch cancellation, preferences, and teardown. |
| `scripts/test-bokeh-pointer.mjs` | Update the existing test for observer-based header behavior and token-based pointer movement. |
| `scripts/test-knowledge-ignites.mjs` | Test the CSS bloom lifecycle while retaining theme-storage and hydration checks. |
| `verification/MOTION-POLISH.md` (new) | Record audit, decisions, verification, and remaining limits. |

## Audit before implementation

| Component / source | Existing effect | Finding |
|---|---|---|
| DesignMotion / homepage | Six-section observer reveal, 240ms / 8px | Limited to the homepage; did not cover dynamically loaded cards. |
| YearBento / year styles | Separate 500ms reveal and 40ms inline stagger | Inconsistent timing and a second reveal system. |
| Header / SpaceBackground | Passive scroll listener and 24/8px hysteresis; animated header height | Height animation conflicts with the requested compositor-only approach. |
| About navigation | Scroll listener repeatedly measured section rectangles | Avoidable geometry work during scrolling. |
| ScrollProgress | rAF scaleX progress, scroll-time document measurements | Transform was appropriate; measurements needed caching. |
| Theme supernova | 1.2-second full-screen canvas and particles | Too long and more drawing work than needed for a theme change. |
| Hero, search, floating panels | Several blur/tint recipes; glass text plane plus search | Nested effects and inconsistent surfaces; text planes needed to be solid. |
| Cards, controls, tags | Broad raised/inset shadows and shadow-changing transitions | Neumorphism spread to large content panels; shadow animation required replacement. |
| Program accents / marquee | Opacity border pulse, shadow halo pulse, transform marquee | Keep opacity/transform loops; remove shadow-size animation. |
| Cursor, spinners, skeletons | Fine-pointer rAF, permanent will-change, several timings | Reuse behavior; tokenize timing, remove unnecessary layer hints. |
| Unmounted YearMotion and unused UI primitives | Count-up and assorted width/position transitions | Audited but not mounted on current routes; left unchanged to avoid unrelated edits. |

The raw source inventory is saved in the task's `outputs/motion-polish/audit-inventory.txt` artifact directory.

## Step outcomes

- **A:** Audited active CSS, React effects, scroll listeners, and dormant helpers before editing.
- **B:** Shared 150ms / 250ms / 500ms timings, two easings, and 70ms stagger; mobile stagger is 35ms. Continuous effects retain separate shared loop tokens.
- **C:** Once-only 20px reveals (12px below 640px), dynamic records, observer-based header glass, and cached paper reading progress. Native scrolling remains intact.
- **D:** Glass uses 12px blur (8px mobile), 97% tint, a thin border, and a soft shadow. It is limited to floating layers and hero search; text/card planes remain solid.
- **E:** Compact controls share top-left light / bottom-right dark shadows. Hover/inset shadows crossfade pseudo-element opacity; borders, icons, focus rings, and disabled styles remain distinct.
- **F:** Program and paper cards share a radial spotlight, rAF pointer coordinates, 4px desktop lift, touch press/release, and a centered keyboard-focus highlight.
- **G:** Pointer events, 44px target minimums, immediate outline feedback, 150ms press transitions, touch-action, and scroll-snap on existing horizontal groups. Small screens use press-only spotlight behavior.
- **H:** Active animation changes are transform/opacity; reveal will-change is released on completion. Preference changes cancel effects; no-JavaScript content remains visible.

## Contrast checks

WCAG relative-luminance calculations used the existing theme tokens. Glass was tested conservatively over black in light mode and white in dark mode at 97% tint. Approximate composited backgrounds are rounded below; ratios used unrounded channels.

| Text | Glass background | Ratio |
|---|---|---|
| Light primary `#163526` | approximately `#F7F7F7` | 12.51:1 |
| Light muted `#496354` | approximately `#F7F7F7` | 6.15:1 |
| Dark primary `#F2FAF5` | approximately `#192F24` | 13.36:1 |
| Dark muted `#B5CCBE` | approximately `#192F24` | 8.34:1 |

Across the normal, red-green, and blue-yellow palettes: the conservative program-tint plus maximum-spotlight check was at least **4.95:1 light / 6.54:1 dark**. Primary/accent button text was at least **5.42:1 light / 10.10:1 dark**. Names and labels remain present independently of color. Detailed numbers are in `outputs/motion-polish/contrast.json` in the active worktree.

## Verification

- PASS: `npm run build`.
- PASS: `npx tsc --noEmit`.
- PASS: `npm run lint`.
- PASS: `npm run test:layout`, `npm run test:ui`, `npm run test:access` using an isolated local SQLite fixture; live data was not touched.
- PASS: `node scripts/test-motion-effects.mjs`, `node scripts/test-bokeh-pointer.mjs`, `node scripts/test-knowledge-ignites.mjs`.
- PASS: homepage at 375, 768, and 1280px in both themes with red-green mode enabled; both color-vision menu options were exercised.
- PASS: additional public-page layout smoke checks on Programs, Research Papers, Browse by Year, About, FAQ, Login, and a paper detail. No horizontal page overflow or undersized rendered link/button targets in measured views.
- PASS: visible 4px card lift and pointer coordinates changing between two positions; keyboard focus ring and spotlight; a program-card click preserved its program filter.
- PASS: asynchronous paper cards received spotlight decoration and finished their reveal after scrolling into view.
- PASS: paper reading progress changed from 0 to 100 on mobile; header glass changed without changing the 80px mobile / 88px desktop footprint. The progress rail is hidden when the reading area fits without scrolling.
- PASS: mobile menu alignment; 8px mobile / 12px desktop computed glass blur; no captured site console warnings or errors.
- PASS: preference/cancellation behavior in focused tests, plus reduced-motion, reduced-transparency, and forced-color CSS inspection.
- **NOT VERIFIED:** actual 4x CPU/performance-panel recording or a 60fps mid-range-phone claim. The available browser exposes viewport and visibility controls, but not CPU throttling or performance recording.
- **NOT VERIFIED:** real-device touch, OS-level reduced-transparency/forced-color rendering, and a full signed-in browser matrix. Touch/preference event paths were tested in fixtures; signed-in data boundaries were checked by the regression suites.

Screenshots and browser measurements are saved in `C:/Users/KurtJohn/Desktop/1KUTA/outputs/motion-polish/`.

## Decisions and skipped work

- Kept the header visible and at a stable height. Its glass layer fades after 24px instead of animating height or hiding navigation on mobile.
- Kept the existing site-wide progress rail; paper detail pages receive reading-specific measurement and labeling.
- Reused CSS and the existing lightweight React effects. No animation library or dependency was added.
- Kept the established marquee and accent glow, using opacity/transform loops and static shadows.
- The CSS optimizer dropped the unprefixed backdrop-filter when the prefixed declaration came last. The shared glass rules now put the standard declaration last; computed blur was verified in the production build.
- No alternative interactive element was built. No new design decision is needed from the owner; the performance/device checks above remain manual acceptance items.
- Production CSS also normalizes duration tokens to seconds; the theme bloom explicitly converts both seconds and milliseconds, with regression coverage.
- No deployment was performed for this request.

## Unrelated issue left unchanged

The existing root-layout script blocks the browser context menu and several developer-tool shortcuts. This is not a security boundary and can interfere with normal browser workflows. Its behavior was outside this motion task and was not changed.
