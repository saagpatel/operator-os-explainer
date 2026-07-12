# Design Tokens — deck-dominant Bench (Fable-ready, contrast-verified)

Drop these straight into `:root`. Every text pairing below was computed with WCAG 2.1 relative luminance (script in the repo). `color-scheme: light` is fixed; this is NOT an OS light/dark toggle.

```css
:root {
  /* ---- Materials ---- */
  --paper:        #f4efe4; /* warm paper: prose overlay cards */
  --ink:          #1a1c20; /* prose ink on paper */
  --ink-muted:    #6b6457; /* muted ink on PAPER only (5.11:1 on paper) */

  --deck:         #15191e; /* dominant graphite console surface, never pure black */
  --deck-raised:  #1b2027; /* slightly raised panel fill on the deck (decorative) */
  --deck-line:    #2a2f36; /* oscilloscope hairline / borders on deck (decorative, non-text) */
  --ink-deck:     #e9e7df; /* primary text on deck        -> 14.26:1 PASS */
  --ink-deck-muted:#9a9488;/* muted/secondary text on deck ->  5.85:1 PASS (use THIS, never --ink-muted, on deck) */

  /* ---- Accent (single coral-sienna, used sparingly) ---- */
  --accent:       #b0451d; /* coral on paper cards         ->  4.93:1 PASS */
  --accent-deck:  #ff7a4d; /* brighter coral on the deck   ->  6.84:1 PASS */

  /* ---- Type registers ---- */
  --font-display:    'Instrument Serif', Georgia, serif; /* titles ONLY */
  --font-prose:      'Newsreader', Georgia, serif;       /* body / overlay-card prose */
  --font-instrument: 'Space Mono', ui-monospace, monospace; /* labels, telemetry, values, units */
}
```

## Contrast ledger (recompute as a Phase 9 gate)

| Foreground | Background | Ratio | AA normal | Use |
|---|---|---|---|---|
| `--ink-deck` #e9e7df | `--deck` #15191e | 14.26:1 | PASS | primary body on deck |
| `--ink-deck-muted` #9a9488 | `--deck` #15191e | 5.85:1 | PASS | secondary/telemetry labels on deck |
| `--accent-deck` #ff7a4d | `--deck` #15191e | 6.84:1 | PASS | coral accent on deck |
| `--paper` card #f4efe4 | `--deck` #15191e | 15.39:1 | PASS | overlay-card background |
| `--ink` #1a1c20 | `--paper` #f4efe4 | 14.88:1 | PASS | prose on paper card |
| `--ink-muted` #6b6457 | `--paper` #f4efe4 | 5.11:1 | PASS | muted prose on paper card |
| `--accent` #b0451d | `--paper` #f4efe4 | 4.93:1 | PASS | coral on paper card |
| ~~`--ink-muted` #6b6457~~ | ~~`--deck` #15191e~~ | 3.01:1 | **FAIL** | BANNED on deck — this is the trap; use `--ink-deck-muted` |

**Rule for Fable:** any text on the deck uses `--ink-deck` or `--ink-deck-muted` or `--accent-deck`. `--ink-muted` and `--accent` are PAPER-ONLY. `--deck-line` / `--deck-raised` are decorative (no text-contrast requirement, but keep any text off them or re-verify).

## Fonts

Match the site: Instrument Serif (display), Newsreader (prose, variable), Space Mono (400/700). Self-host via `@fontsource` packages imported in the app entry (no Google CDN link — a runtime fetch would violate "zero network"); preload the display + mono. Reduced-motion and print stylesheets inherit these.
