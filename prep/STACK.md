# Build Stack + Config Pins (Fable-ready)

Pre-decided mechanical decisions so Phase 0 is copy-and-go, not improvise. Where a value is proven by the site precedent, copy it; where the spec deliberately reverses the precedent, the override is called out.

## 1. Dependencies (`package.json`)

**Strategy:** start from the proven site precedent, apply three deliberate overrides.

1. Read `~/Projects/HowMoneyMoves/package.json`. Copy its **majors** for: `postcss`, `autoprefixer`, `typescript`, `@testing-library/react`, `@testing-library/jest-dom`, `jsdom`, `lucide-react`, `react`, `react-dom`. HMM is the validated Vite-SPA-on-this-Vercel precedent, so its majors are known-good.
1b. **Pin these explicitly (do NOT infer from HMM, to avoid version drift):** `vite@^7` (or newer stable; matches SPEC 4.1), `tailwindcss@^3.4` (the §3 config snippet is v3-style — do NOT adopt Tailwind v4's CSS-first config), `vitest@^3` (or newer stable). If HMM ships different majors for these three, our pins win.
2. **Deliberate overrides (SPEC 4.1 rationale, do NOT copy HMM here):**
   - `react-router-dom@^7` (HMM ships v6). Use `createBrowserRouter` data-router, SPA mode, NOT framework mode.
   - `motion@^12`, import from `motion/react` (HMM ships `framer-motion@11`). Do NOT install `framer-motion`.
   - Keep `react@19` / `react-dom@19` (do not downgrade).
3. **Add:** `d3-force`, `d3-scale`, `d3-shape` + `@types/d3-force`, `@types/d3-scale`, `@types/d3-shape` (submodules only, math/layout; no `d3-selection`). `@fontsource/instrument-serif`, `@fontsource/newsreader`, `@fontsource/space-mono`.
4. `"engines": { "node": ">=20.19" }` (Vite needs 20.19+/22.12+). `pnpm`.

## 2. TypeScript

Copy HMM's strict `tsconfig.json` / `tsconfig.app.json` / `tsconfig.node.json` verbatim. Do NOT loosen `strict`, `noUnusedLocals`, `noUnusedParameters`, `noUncheckedSideEffectImports`. Source root `src/`.

## 3. Tailwind (`tailwind.config.ts`)

Map the Bench tokens (from `prep/design-tokens.md`) to Tailwind names via `var(--x)` (HMM's pattern):

```ts
theme: { extend: {
  colors: {
    paper:'var(--paper)', ink:'var(--ink)', 'ink-muted':'var(--ink-muted)',
    deck:'var(--deck)', 'deck-raised':'var(--deck-raised)', 'deck-line':'var(--deck-line)',
    'ink-deck':'var(--ink-deck)', 'ink-deck-muted':'var(--ink-deck-muted)',
    accent:'var(--accent)', 'accent-deck':'var(--accent-deck)',
  },
  fontFamily: { display:'var(--font-display)', prose:'var(--font-prose)', instrument:'var(--font-instrument)' },
}}
```

## 4. Vite (`vite.config.ts`)

```ts
export default defineConfig({
  plugins: [react()],
  build: { sourcemap: false }, // NON-NEGOTIABLE: source maps bake /Users/ build paths (SPEC 3.3 #5)
  test: { environment: 'jsdom', setupFiles: ['./src/test/setup.ts'] }, // vitest
});
```
Generator/closure tests override to `environment: 'node'` via a per-file `// @vitest-environment node` docblock.

## 5. `vercel.json` (repo root)

Rewrites from HMM (SPA), headers from signal-noise. Take `outputDirectory: "dist"` (HMM), NOT `out`.

```json
{
  "$schema": "https://openapi.vercel.sh/vercel.json",
  "buildCommand": "pnpm build",
  "outputDirectory": "dist",
  "rewrites": [{ "source": "/(.*)", "destination": "/index.html" }],
  "headers": [{ "source": "/(.*)", "headers": [
    { "key": "X-Content-Type-Options", "value": "nosniff" },
    { "key": "Referrer-Policy", "value": "strict-origin-when-cross-origin" },
    { "key": "Permissions-Policy", "value": "camera=(), microphone=(), geolocation=()" }
  ]}]
}
```

## 6. Fonts

Self-host via `@fontsource` (no Google CDN link — a runtime fetch would violate "zero network"). Import `@fontsource/instrument-serif`, `@fontsource/newsreader` (variable), `@fontsource/space-mono` (400+700) in the app entry; preload display + mono.

## 7. Testing (Vitest)

- `src/lib/contrast.ts` (WCAG 2.1 relative luminance) + `contrast.test.ts`: assert the 8 pairs in `design-tokens.md` to their known ratios; assert `--ink-muted`-on-deck is REJECTED (< 4.5). Ships Phase 0 as a standing gate.
- `src/data/closure.test.ts`: assert every shipped string value is a member of its field allowlist; assert the reconciliation invariant (per mission, `sum(cost.deltaUsd) === sessionCost.costUsd`); assert byte-identical output across two generator runs.
- `src/data/property.test.ts`: run `generate(seed)` over sampled seeds, assert closure holds for all.
- `scripts/guard-scan.ts` (plant-and-fail backstop): scan `src/**`, `dist/**` (incl `.map`), `dataset.json`, and `git log -p` for normalized (`~`, `%USERPROFILE%`, `C:\Users\`, `/Users/`) paths, emails, real-precision dollars. The KNOWN-real-names denylist is SHA-256-of-lowercased-token, matched hashed (never ship plaintext reals). **Allowlist the neutral commit email `noreply@operator-os-explainer.local`** so the email regex does not flag its own blessing commits. CI gate.
- Component tests: jsdom + Testing Library for the transport + one scene interaction.

## 8. Git identity (Phase 0, first action)

`git init` then set LOCAL identity (neutral, not the global real one):
```
git config user.name "operator-os-explainer"
git config user.email "noreply@operator-os-explainer.local"
```
Publish from this clean history (SPEC 3.3 #6). Feature branch `feat/...`, conventional commits, no `Co-Authored-By` trailer.

## 9. Folder structure

```
src/
  main.tsx, App.tsx
  router.tsx            # createBrowserRouter, route table (SPEC 4.6)
  clock/                # useSessionClock provider (ABOVE the router outlet)
  types/                # data.ts (Phase 1), scene.ts (from prep/scene-contract.ts)
  data/                 # vocab.ts, generate.ts, dataset.json, *.test.ts
  scenes/               # index.ts (registry+order), <slug>.ts SceneConfigs, content/
  components/
    shell/              # console shell, transport bar, synthetic badge, deep-panel drawer
    viz/                # FleetGraph, SpineBus, BridgeFeed, GuardShields, WorktreeSwarm,
                        # VerifyGate, CostLedger, AirlockFlow, FreshnessPanel
  lib/                  # contrast.ts, layout math, event selectors
  test/                 # setup.ts
scripts/                # guard-scan.ts
```

Every `viz/*` component takes `VizProps` (`prep/scene-contract.ts`) and is a pure function of it.
