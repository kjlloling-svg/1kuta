# Final theme contrast

Values calculated using WCAG relative luminance. All text pairs meet 4.5:1; borders/focus/progress meet 3:1. Disabled controls retain full contrast (no opacity reduction).

## Light

| Role | Foreground | Background | Ratio |
|---|---|---|---|
| --ink on --bg | #293630 | #eee9df | 10.43:1 |
| --ink on --surface | #293630 | #f7f3eb | 11.40:1 |
| --ink on --soft | #293630 | #e2e5dc | 9.90:1 |
| --muted on --bg | #526057 | #eee9df | 5.48:1 |
| --muted on --surface | #526057 | #f7f3eb | 5.99:1 |
| --muted on --soft | #526057 | #e2e5dc | 5.20:1 |
| --green on --bg | #355b49 | #eee9df | 6.33:1 |
| --green on --surface | #355b49 | #f7f3eb | 6.91:1 |
| --green on --soft | #355b49 | #e2e5dc | 6.00:1 |
| --line on --bg | #737b70 | #eee9df | 3.62:1 |
| --line on --surface | #737b70 | #f7f3eb | 3.96:1 |
| --line on --soft | #737b70 | #e2e5dc | 3.44:1 |
| --focus on --bg | #875317 | #eee9df | 5.29:1 |
| --focus on --surface | #875317 | #f7f3eb | 5.79:1 |
| --focus on --soft | #875317 | #e2e5dc | 5.02:1 |
| --on-accent on --green | #f7f3eb | #355b49 | 6.91:1 |
| --on-accent on --green-deep | #f7f3eb | #294a3b | 8.88:1 |
| --error on --error-bg | #8d342b | #f2e2dc | 6.28:1 |

## Dark

| Role | Foreground | Background | Ratio |
|---|---|---|---|
| --ink on --bg | #e7e5dc | #19221f | 12.90:1 |
| --ink on --surface | #e7e5dc | #232e29 | 11.14:1 |
| --ink on --soft | #e7e5dc | #303f37 | 8.80:1 |
| --muted on --bg | #c0c7be | #19221f | 9.42:1 |
| --muted on --surface | #c0c7be | #232e29 | 8.13:1 |
| --muted on --soft | #c0c7be | #303f37 | 6.42:1 |
| --green on --bg | #a6c6b1 | #19221f | 8.79:1 |
| --green on --surface | #a6c6b1 | #232e29 | 7.58:1 |
| --green on --soft | #a6c6b1 | #303f37 | 5.99:1 |
| --line on --bg | #8c9c8f | #19221f | 5.63:1 |
| --line on --surface | #8c9c8f | #232e29 | 4.86:1 |
| --line on --soft | #8c9c8f | #303f37 | 3.84:1 |
| --focus on --bg | #e3ba73 | #19221f | 8.94:1 |
| --focus on --surface | #e3ba73 | #232e29 | 7.72:1 |
| --focus on --soft | #e3ba73 | #303f37 | 6.10:1 |
| --on-accent on --green | #19221f | #a6c6b1 | 8.79:1 |
| --on-accent on --green-deep | #19221f | #b9d4c2 | 10.28:1 |
| --error on --error-bg | #f1ad9d | #382b27 | 7.26:1 |

Text/input/card/dialog: ink or muted on surface. Chips/disabled/footer: ink or muted on soft. Primary buttons: on-accent on green; hover green-deep. Links/progress: green. Focus ring: focus against each neutral layer. Error: error on error-bg. Logo canvas is white solely to retain the supplied image appearance. Decorative shadows, bokeh and backdrop scrim carry no text. Header and mobile menu are opaque. Dialog glass uses a light 6px blur and a near-solid surface.

Sources: [W3C text contrast](https://www.w3.org/WAI/WCAG22/Understanding/contrast-minimum.html), [W3C non-text contrast](https://www.w3.org/WAI/WCAG22/Understanding/non-text-contrast.html).
