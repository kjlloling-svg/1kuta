# Department palette and contrast

WCAG relative luminance; text/tint minimum 4.5:1; edge/surface minimum 3:1. Department names remain visible alongside every accent.

| Department slug | Theme | Text | Tint | Edge | Bright accent | Text/tint | Edge/surface |
|---|---|---|---|---|---|---|---|
| bsba-hrdm | Light | #715000 | #FFF7D6 | #947000 | #E5B700 | 6.85:1 | 4.59:1 |
| bs-nursing-midwifery | Light | #9D245D | #FCEAF3 | #AD3972 | #E65398 | 6.40:1 | 5.83:1 |
| bsit-computer-technology | Light | #17539A | #E9F2FF | #2A6EB8 | #347DE0 | 6.79:1 | 5.22:1 |
| bsed-social-studies | Light | #791B37 | #FBEAF0 | #A13D5D | #8C183E | 8.95:1 | 6.29:1 |
| bsed-mathematics | Light | #0F5132 | #E8F7EE | #648371 | #137A3B | 8.46:1 | 4.18:1 |
| dit-computer-technology | Light | #17539A | #E9F2FF | #2A6EB8 | #347DE0 | 6.79:1 | 5.22:1 |
| dit-mechanical-technology | Light | #17539A | #E9F2FF | #2A6EB8 | #347DE0 | 6.79:1 | 5.22:1 |
| bsba-hrdm | Dark | #F8DB7A | #352C12 | #B59B50 | #F1CC4D | 10.13:1 | 5.71:1 |
| bs-nursing-midwifery | Dark | #FFBBDA | #3C1C30 | #C9769D | #F080B6 | 9.55:1 | 4.82:1 |
| bsit-computer-technology | Dark | #B8D9FF | #122B48 | #6A9BD5 | #73ACF5 | 9.84:1 | 5.34:1 |
| bsed-social-studies | Dark | #F5B5C9 | #371724 | #C36A89 | #BC426B | 9.41:1 | 4.22:1 |
| bsed-mathematics | Dark | #A1EDBB | #1B3828 | #799B86 | #72E29B | 9.34:1 | 5.03:1 |
| dit-computer-technology | Dark | #B8D9FF | #122B48 | #6A9BD5 | #73ACF5 | 9.84:1 | 5.34:1 |
| dit-mechanical-technology | Dark | #B8D9FF | #122B48 | #6A9BD5 | #73ACF5 | 9.84:1 | 5.34:1 |

Approximate severity-1 linear-sRGB Machado simulations (screening, not an accessibility certification):

| Simulation | Minimum text/tint ratio across both themes |
|---|---|
| protanopia | 6.19:1 |
| deuteranopia | 5.69:1 |
| tritanopia | 6.11:1 |

Hue differences can converge under these simulations. Department names and program-card numbers preserve identification without color. [Machado primary-source thesis, Appendix A](https://www.inf.ufrgs.br/~oliveira/students_dissertations/Masters/Gustavo_Machado_Masters_thesis_UFRGS_2010.pdf).

Unknown department fallback: muted text, soft tint, line edge; its displayed name is retained. See THEME-CONTRAST.md for neutral fallback measurements.

Common color-vision deficiencies: color is never the only identifier; program names and program-card numbers remain visible. Physical-device testing is listed separately in HEADER-UPDATE.md.

[W3C text contrast](https://www.w3.org/WAI/WCAG22/Understanding/contrast-minimum.html), [W3C non-text contrast](https://www.w3.org/WAI/WCAG22/Understanding/non-text-contrast.html).
