# Theme toggle repair — 19 October 2026

Status: implemented and verified locally in the bokeh-favicon worktree, based on production commit 56c325e. Not committed, pushed, or deployed.

Root cause: later motion rules, including high-specificity theme-ready rules in green-bokeh.css, replaced color transitions with transform/opacity-only transitions, while the old bloom delayed the theme swap by 250ms.

## Inspection and decisions

- Initial suppression is released after two animation frames. No stuck theme-switching class, equal light/dark tokens, or browser hydration error was found.
- The supplied context describes an older implementation. The current root does not render a cookie-selected theme: the blocking script uses archive-theme localStorage, then the system preference. kuta-theme is a legacy config key. Persistence selection and storage behavior are unchanged; only the control's ARIA state synchronization changes to aria-checked.
- Replaced the button's pressed-state semantics with role=switch, aria-checked, and the label Dark mode. Native button keyboard behavior handles Space/Enter. The SVG and thumb use the root theme attribute before hydration; the control stays disabled until hydrated.
- Removed the delayed bloom in favor of immediate state changes and scoped 250ms color transitions. No optional View Transitions API was added. Initial suppression remains bounded; toggles do not suppress the requested color animation.
- The switch has a stable 68x44px desktop / 60x44px mobile footprint, a spring-like thumb translation, collapsing sun rays, a crescent mask, and token-colored track and thumb.
- Header is opaque with no backdrop blur. Existing pointer movement, program glows, and color-vision behavior remain active and token-driven.
- The color-vision sentence is the aria-describedby text for its own menu, not stray toggle content, and remains intact.

## Changed files

| File | Reason |
|---|---|
| app/globals.css | Replace text icons with SVG morph styling; remove obsolete suppression and bloom rules. |
| app/motion.css | Scope 250ms color transitions, preserve initial/reduced-motion gates, and restore an opaque header. |
| app/green-bokeh.css | Repair the high-specificity theme-ready transition overrides. |
| components/theme-toggle.tsx | Accessible immediate switch with one inline SVG and a stable thumb. |
| components/space-background.css | Separate the token-colored base from decorative gradients so the base color can transition. |
| lib/theme.mjs | Synchronize aria-checked instead of aria-pressed without changing persistence. |
| lib/supernova.ts (removed) | Remove the unused delayed bloom controller. |
| scripts/test-knowledge-ignites.mjs | Replace obsolete bloom tests with suppression, persistence, and transition-cascade regressions. |
| scripts/test-theme-access.mjs | Check the switch label and checked state while preserving access tests. |
| verification/THEME-TOGGLE.md | Record decisions, verification, and limitations. |

## Verification

- PASS: npm run build (Next.js production build).
- PASS: TypeScript no-emit check (npm exec -- tsc --noEmit).
- PASS: npm run lint.
- PASS: npm run test:access, npm run test:ui, npm run test:layout against isolated local SQLite; no production records changed.
- PASS: test-knowledge-ignites, test-motion-effects, and test-bokeh-pointer focused tests; git diff --check.
- PASS: desktop 1280px and mobile 390px, both themes; no horizontal overflow. Switch transforms settle at 24px desktop / 20px mobile in dark and zero in light; computed transition duration is 250ms. Root theme changes immediately while styles interpolate.
- PASS: Space toggles the focused switch and its visible solid focus ring remains. Browser checked state agrees with the root theme.
- PASS: reload in both themes retains the selected theme; opening a second tab and toggling the first synchronizes theme and checked state. Blocking pre-paint selection and two-frame initial suppression are also tested in a script fixture.
- PASS: cursor gradient, page gradient, and program accent resolve to different theme tokens after switching. A pointer action moved the cursor to 850px/120px and the background to 2.95312px/-6px.
- PASS: opaque header in both themes; computed backdrop-filter is none. No captured browser warnings or errors on either local tab.
- PASS (code/test inspection): reduced-motion disables root, surface, SVG, and thumb transitions; state changes synchronously with no bloom or timer. Browser-level reduced-motion emulation is unavailable in this browser tool, so that visual check remains unverified.
- LIMIT: no high-speed recording of first paint or animation frame-rate measurement. Reload observations and blocking-script tests passed; no claim of frame-perfect capture is made.

## Contrast

No palette values changed from production commit 56c325e. All 18 tested ink/muted/green text pairs against bg/surface/soft are identical before and after. Light minimum 4.90:1 (green on soft); dark minimum 7.51:1 (muted on soft). Department contrast and simulated color-vision checks pass the existing layout suite.

verification/THEME-CONTRAST.md describes an older cream/stone palette and is not the current production baseline. For example, its light green-on-bg is 6.33:1, while the existing green palette is 5.17:1 both before and after this repair. Therefore unchanged current contrast is verified; exceeding every historical table value is not claimed. No unrelated palette restyle was made.

Screenshots: C:/Users/KurtJohn/Desktop/1KUTA/outputs/theme-toggle/ (desktop-dark.png, mobile-light.png, mobile-dark.png).
