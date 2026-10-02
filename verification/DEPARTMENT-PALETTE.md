# Department palette and contrast

WCAG relative luminance; text/tint minimum 4.5:1; edge/surface minimum 3:1. Department names remain visible alongside every accent.

| Department slug | Theme | Text | Tint | Edge | Bright accent | Text/tint | Edge/surface |
|---|---|---|---|---|---|---|---|
| bsba-hrdm | Light | #76531c | #f1e7ce | #8a6b32 | #bf8a2d | 5.64:1 | 4.49:1 |
| bs-nursing-midwifery | Light | #794b67 | #eee1e8 | #8c5d77 | #b06690 | 5.50:1 | 4.81:1 |
| bsit-computer-technology | Light | #345d7c | #dde7ee | #557991 | #498bc0 | 5.57:1 | 4.19:1 |
| bsed-social-studies | Light | #824d3f | #f0e2da | #956757 | #b97059 | 5.38:1 | 4.36:1 |
| bsed-mathematics | Light | #346658 | #dfeae1 | #577a68 | #438978 | 5.33:1 | 4.32:1 |
| bsba-hrdm | Dark | #dec48c | #3d3425 | #c3a36c | #f3c76e | 7.21:1 | 5.87:1 |
| bs-nursing-midwifery | Dark | #e0b7cf | #392d35 | #bd93ab | #ecadd4 | 7.40:1 | 5.30:1 |
| bsit-computer-technology | Dark | #add1e6 | #263845 | #85abc2 | #8dd0f8 | 7.52:1 | 5.76:1 |
| bsed-social-studies | Dark | #e4bdad | #3e302c | #c99e8c | #edac94 | 7.32:1 | 5.86:1 |
| bsed-mathematics | Dark | #b4d4c0 | #293d32 | #92b49f | #82d5b8 | 7.26:1 | 6.19:1 |

Approximate severity-1 linear-sRGB Machado simulations (screening, not an accessibility certification):

| Simulation | Minimum text/tint ratio across both themes |
|---|---|
| protanopia | 5.09:1 |
| deuteranopia | 5.10:1 |
| tritanopia | 5.34:1 |

Hue differences can converge under these simulations. Department names and program-card numbers preserve identification without color. [Machado primary-source thesis, Appendix A](https://www.inf.ufrgs.br/~oliveira/students_dissertations/Masters/Gustavo_Machado_Masters_thesis_UFRGS_2010.pdf).

Unknown department fallback: muted text, soft tint, line edge; its displayed name is retained. See THEME-CONTRAST.md for neutral fallback measurements.

Common color-vision deficiencies: color is never the only identifier; program names and program-card numbers remain visible. Physical-device testing is listed separately in HEADER-UPDATE.md.

[W3C text contrast](https://www.w3.org/WAI/WCAG22/Understanding/contrast-minimum.html), [W3C non-text contrast](https://www.w3.org/WAI/WCAG22/Understanding/non-text-contrast.html).
