# KUTA liquid glass

The glass styles reuse KUTA’s existing text, accent, department, and color-vision palettes. The same components, layouts, and controls render in both themes.

| Token | Value |
| --- | --- |
| Light glass | White reading surface at 79% opacity, 94% on navigation and overlays, with a white top highlight |
| Dark glass | Deep green reading surface at 83% opacity, 96% on overlays, with a 10% white top highlight and an 18% inset rim |
| Text | Existing ink and muted colors. The default light values are `#163526` and `#496354`. The default dark values are `#F2FAF5` and `#B5CCBE`. |
| Blur | 16 px for navigation and floating controls, 24 px for open dialogs, with 140% saturation. On small screens these drop to 12 px and 16 px. |
| Corners | 24 px panels, 20 px small-screen panels and floating overlays, 16 px fields and buttons |
| Depth | 1 px inset highlight, a close contact shadow, and a wider soft shadow. Fields use an inset shadow to distinguish them from buttons. |
| Motion | 250–400 ms interactions with `cubic-bezier(0.22, 1, 0.36, 1)`; 280–380 ms once-per-element reveals; 24 and 31 second background drifts |

Repeated cards and controls use tinted gradients and inset highlights. Live blur is limited to shared navigation, open overlays, and the hero and footer on wide screens. Background shapes are feathered gradients, and their movement and card sheen use transform and opacity. Touch screens keep the background still. The reveal observer never hides content waiting to enter the viewport.

Reading panels have stronger tints than decorative surfaces to keep text legible as the background moves. Keyboard focus gets a three-pixel ring in the current palette. Reduced motion stops the drift, sheen, and reveals. Reduced transparency, forced colors, and unsupported backdrop filtering use solid surfaces.

Chrome checks covered 390 px and 1440 px viewports, keyboard focus, open dialogs, and accessibility preferences. Across 474 rendered text samples in both themes and all three color-vision modes, the lowest measured contrast was 4.98:1. Mobile sizing was verified in Chrome’s emulator, so these checks do not measure frame rate on physical phones.
