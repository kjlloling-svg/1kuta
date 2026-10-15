# KUTA · Knowledge Ignites

Implemented on `codex/knowledge-ignites` in `C:/Users/KurtJohn/.codex/worktrees/bokeh-favicon/1KUTA`. This work is local, uncommitted, and not deployed. The older unfinished main checkout was preserved.

The standalone deliverable is `knowledge-ignites.html` beside this report. It includes its CSS and JavaScript and works without a build step. The website implementation uses the same background CSS and supernova renderer.

## Agreed decisions

- Preserve existing functional JavaScript and the independent color-vision script; replace the old ambient canvas with CSS.
- Gold is the normal accent. Existing color-vision settings override it, and the new decorative palette follows those settings.
- Keep the specified translucent bloom. The theme swap is atomic and softened; it is not completely concealed by an opaque screen.
- Keep existing foreground, muted, surface, program, typography and spacing tokens. The existing `--ink` is the foreground token, so no duplicate `--fg` token was introduced.
- Keep current search, navigation, authentication, roles, records, photos and logos. No new dependencies or saved environment changes.

## File-by-file changes

| File | Change |
|---|---|
| `lib/supernova.ts` | Framework-independent Canvas 2D renderer; precomputed gradients/Path2D/particle buffers; one animation loop; guarded swap and cleanup. |
| `components/theme-toggle.tsx` | Native button, centroid origin, `aria-pressed`, external-store subscription to the existing attribute, keyboard behavior, route/unmount cleanup. |
| `lib/theme.mjs` | Blocking local-storage-first resolution, system fallback, guarded storage access, same-tick attribute/ARIA sync, cross-tab/system preference updates. Legacy theme cookies no longer control the theme. |
| `app/layout.tsx` | Remove cookie-driven theme markup and the old ambient canvas. Keep blocking scripts and `suppressHydrationWarning`. |
| `components/site-shell.tsx` | Remove the obsolete initial-theme prop. Keep header structure and footprint. |
| `components/space-background.tsx` | Pure server-rendered decorative component: starfield, planet/ring, six bokeh orbs, three thesis sheets. No props or client hooks. |
| `components/space-background.css` | Namespaced tokens, dark/no-script fallback, color-vision palettes, glass/neumorphic hero treatment, reduced motion, mobile reductions, parent containment for reuse. |
| `app/page.tsx` | Place the background inside the existing hero; retain KUTA, search and links; set the exact tagline “A space for curious minds.” |
| `app/globals.css` | Gold accent/focus, explicit light and system-dark fallback, native-button styles and pre-paint icon state. Remove superseded background selectors. |
| `app/green-bokeh.css` | Preserve color-vision token overrides; remove ambient canvas styles; match the static page plane to the hero fade; exclude the hero from color transitions. |
| `app/design-refresh.css` | Remove the replaced atmosphere rules and use 500ms transitions for unmasked page surfaces. |
| `components/ambient-background.tsx`, `components/home-background.tsx` | Removed: replaced by the requested CSS component, rather than retained as duplicate backgrounds. |
| `scripts/test-knowledge-ignites.mjs` | Focused tests for persistence, hydration-safe sync, reduced motion, one canvas/swap, rapid inputs, DPR, allocation setup and cleanup. |
| `scripts/test-theme-access.mjs` | Align existing theme expectations with local-storage precedence and native button markup. The database-writing auth suite was not run against live data. |

## Tokens

Normal-vision values are below. Program accents and existing accessibility palettes remain independent.

| Global token | Light | Dark |
|---|---|---|
| `--bg` | `#F5FBF7` | `#0B1A12` |
| `--surface` | `#FFFFFF` | `#12291D` |
| `--soft` | `#E8F7EE` | `#1B3828` |
| `--ink` | `#163526` | `#F2FAF5` |
| `--muted` | `#496354` | `#B5CCBE` |
| `--gold` | `#805900` | `#F5C451` |
| `--accent` | `var(--gold)` | `var(--gold)` |
| `--on-accent` | `#FFFFFF` | `#0B1A12` |
| `--focus` | `#805900` | `#F5C451` |
| `--green` (retained institutional color) | `#137A3B` | `#72E29B` |
| `--green-deep` | `#0F5132` | `#A1EDBB` |
| `--line` | `#648371` | `#799B86` |
| `--shadow-light` | `rgba(255,255,255,.60)` | `rgba(242,250,245,.04)` |
| `--shadow-dark` | `rgba(15,51,32,.10)` | `rgba(0,0,0,.30)` |
| `--theme-duration` | `500ms` | `500ms` |

| Hero token | Light | Dark |
|---|---|---|
| `--sb-bg1` | `#eef1fb` | `#0a0d24` |
| `--sb-bg2` | `#dfe5f7` | `#161a45` |
| `--sb-ink` | `var(--ink)` | `var(--ink)` |
| `--sb-muted` | `var(--muted)` | `var(--muted)` |
| `--sb-glass` | `rgba(255,255,255,.45)` | `rgba(255,255,255,.07)` |
| `--sb-glass-b` | `rgba(255,255,255,.65)` | `rgba(255,255,255,.18)` |
| `--sb-n-hi` | `rgba(255,255,255,.9)` | `rgba(255,255,255,.065)` |
| `--sb-n-lo` | `rgba(31,40,76,.16)` | `rgba(0,0,0,.4)` |
| `--sb-base` | `#e9edf8` | `#181e38` |
| `--sb-b1` (indigo) | `#7671cf` | `#514b9e` |
| `--sb-b2` (magenta) | `#ce8cb7` | `#71385f` |
| `--sb-b3` (cyan) | `#6cb6c6` | `#28617b` |
| `--sb-b4` (amber) | `#d4b46e` | `#775e31` |
| `--sb-fallback` | `#edf0f9` | `#151a35` |
| `--sb-line` | `#657187` | `#99a7bd` |
| `--sb-star` | `#536581` | `#ced9f6` |
| `--sb-orb-opacity` | `.3` | `.4` |
| `--sb-twinkle-duration` | `9s` | `9s` |

Color-vision bokeh overrides, in b1/b2/b3/b4 order:

- Red-green light: `#5e78ac / #8e76ae / #5988a9 / #ac9253`; dark: `#3f537e / #5f4d7c / #3d637c / #786637`.
- Blue-yellow light: `#688b86 / #b87091 / #5d9b89 / #ac7783`; dark: `#49625e / #7b4c65 / #406b60 / #77525e`.
- Global accent/focus overrides remain the existing blue and teal accessibility palettes. The canvas never writes `data-cvd`, its storage key, filters or those palettes.

Existing hard-coded theme values changed: `--gold` from `#137A3B / #72E29B` to `#805900 / #F5C451`; `--focus` from `#0F5132 / #A1EDBB` to the gold pair; `--accent` now aliases gold instead of green; page transition duration from 300ms to 500ms. Institutional greens and program colors were retained. The old full-page mesh expression became `var(--bg)` so the hero fade has a matching endpoint.

## Tunables and reuse

At the top of `lib/supernova.ts`: total duration 1200ms, swap 270ms, bloom growth 500ms, hold 280ms, fade endpoint 750ms, alpha cap .85, 70 particles, palettes, and precomputed gradient sampling interval. Particle paths, seeded random values, gradients and buffers are prepared before the draw loop. No per-frame JavaScript arrays, objects, paths or gradients are created.

Background color tokens live at the top of `components/space-background.css`. Each orb has `--size`, `--orb`, `--blur`, and `--duration`; motion lasts 11–26 seconds. The CSS wrapper and parent isolation keep decoration behind content. Import `SpaceBackground` into another page and place `<SpaceBackground/>` directly inside its hero. Its stylesheet travels with the component; a zero-specificity parent rule establishes positioning/isolation while preserving an existing positioned host. No new page script is needed. The foreground hero styles are scoped to the existing `.kuta-welcome` rather than restyling other pages.

The canvas is appended to `body`, outside the header/backdrop-filter stacking context. No root/body filter or transform was found. Where supported, a manual popover places the non-interactive canvas in the top layer so it can render above dialogs; fixed positioning is the fallback. It cancels on unmount, pathname change, page hide, document hiding or resize. If reduced motion becomes enabled mid-transition, it completes the swap immediately and removes the canvas.

## Verification and limits

Production build (including TypeScript), changed-file lint, focused regression tests and `git diff --check` passed. Browser checks used the production build at localhost with an isolated SQLite database and a process-only session secret; no live records or saved environment settings were changed.

| Acceptance item | Result and evidence |
|---|---|
| Nova originates at toggle centroid | PASS: origin is derived from the current button rectangle; exercised desktop/mobile, with DPR capped at 2. |
| Atomic theme swap, no intermediate theme | PASS with agreed translucency limitation: one root attribute change, same-tick ARIA/storage sync; hero transition duration measured as `0s`. |
| Reload persistence without flash | PASS for ordinary reload and no hydration warnings. Throttled-CPU/no-cache filmstrip verification is NOT VERIFIED. |
| Rapid repeat clicks | PASS: one canvas, one swap, zero canvases after completion. |
| Reduced motion | PASS in renderer tests: instant swap, no canvas or rAF. CSS disables background animations. Actual OS reduced-motion browser run is NOT VERIFIED. |
| Keyboard and focus | PASS: Enter and Space activation; focus retained on the button. |
| Color-vision adjustment | PASS: all six combinations checked; settings survive swaps; root/body filters and body transforms remain `none`. |
| Text/control contrast | PASS for calculated individual-orb worst-case samples, including glass opacity and 140% saturation: small text minimum 4.91:1; control borders 3.68:1; focus 4.71:1; solid CTA text 6.27:1. Exhaustive composited-pixel testing of every overlapping layer is NOT VERIFIED, so this is not a full-site WCAG certification. |
| Reading hierarchy and both themes | PASS by visual review: H1 and search remain foreground; decorative sheets are subdued and mobile layers reduced. |
| Responsive layout | PASS: no horizontal page overflow at 320, 375, 768, 1024, 1280 and 1440px in both themes; toggle and hero stay inside the viewport. |
| Layout stability / performance | PASS for identical before/after hero and toggle rectangles and absolute/fixed layers. Full-page measured CLS, LCP attribution, real mid-tier mobile 60fps and long-task budgets are NOT VERIFIED. |
| No hydration warnings or console errors | PASS on final production preview; the early button synchronization issue was fixed. |
| Existing routes | PASS for home, research papers, programs, about, FAQ, login and browse-by-year smoke checks. Light mobile and dark desktop routes loaded without overflow or console errors. Signed-in Google flows and contextual login dialogs were not exercised. |
| Reusable component | CSS/markup is self-contained, with host containment and no client hook; an independent host check is recorded separately. |
| Lighthouse accessibility does not regress | NOT VERIFIED: no Lighthouse baseline or runner was available; no score is claimed. |

The background CSS + component total **8,027 bytes** (8.03 KB), below 20 KB. The supernova module is **5,535 bytes** (5.54 KB). The independent host and control section both measured 182.4px tall; background stacking was -1 and pointer events were disabled. Full evidence is in `knowledge-ignites-verification.json` beside this report. Sizes are uncompressed source bytes, not whole Next.js chunk sizes.

## Out of scope, left unchanged

- The existing shortcut/context-menu deterrent remains in the head script; it affects familiar browser actions and merits a separate accessibility review.
- Existing unrelated JavaScript (authentication, account menus, color-vision controls, scroll progress, section reveals) remains functional and separate from the new background.
- The repository already contains `next-themes` for a UI helper. This implementation does not use it or add a provider/dependency.
- Next.js generated `AGENTS.md` and `CLAUDE.md` during development; these are separate from the application changes.
- The older main checkout's unfinished work, all database/schema/auth code and the deployed website were left untouched.

Before production rollout, complete the explicitly unverified device, performance, Lighthouse and composited-pixel checks above. No deployment is claimed by this report.
