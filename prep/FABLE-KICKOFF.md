# Fable Kickoff — Anatomy of an AI Operator OS

You are Claude Fable 5, building an interactive portfolio explainer autonomously. This package was fully designed and de-risked in a prior mapping + hardening session. **The design decisions are made. Build, do not re-litigate.** Where you would normally stop to ask, the answer is almost certainly already in these files.

## Read first (in order)
1. `SPEC.md` — the law. Creative + technical spec, v2.1 hardened. Sections 0.1 (locked decisions), 2 (experience), 3.3 (the guarantee), 4 (architecture), 5 (phases).
2. `prep/DATA-MODEL.md` — the data contract: types, closed vocabularies, generator algorithm, scene→event map. `missionId` is the correlation key.
3. `prep/scene-contract.ts` — the `SceneConfig` + `VizProps` + `Interaction` contract. Copy into `src/types/scene.ts`.
4. `prep/codenames.md` — the ONLY project names allowed (frozen, audited). Hero mission = **Corveth**.
5. `prep/sample-timeline.json` — the golden fixture: a validated 46-event mission arc. Your generator reproduces this SHAPE; the closure test asserts against it.
6. `prep/design-tokens.md` — the contrast-verified deck-dominant palette. `--ink-deck-muted #9a9488` is mandatory.
7. `prep/STACK.md` — exact deps, tsconfig, tailwind, vite, vercel.json, vitest, fonts, git identity, folder structure.

## Build order
Phases 0-9 in SPEC §5. **Phase 3 (the Fleet scene) is the go/no-go reference scene** — build it fully (viz + interaction + deep panel + reduced-motion + a preview deploy) and pass its gate BEFORE fanning out Phases 4-8. Each phase has a verification gate producing visual + functional evidence. Verify on bytes: re-run the diff and tests yourself, never trust an exit code or a "done."

## DO-NOT-RELITIGATE (all pre-decided — build to these)
- **Stack:** Vite + React 19 + react-router-dom v7 (`createBrowserRouter`) + `motion` v12 (from `motion/react`, NOT framer-motion) + D3 submodules (math only) + Canvas for dense layers. Not Next.js. (SPEC 4.1, STACK §1)
- **Route table:** `/` `/fleet` `/spine` `/safety` `/finale` `/hub` `/coda`. Clock provider ABOVE the router outlet. (SPEC 4.6)
- **Transport:** continuous scrubber on `t ∈ [0,90000]`, always-visible Play/Pause, speed 1/1.5/2x, step-to-event, keyboard. Autoplay on scroll-into-view; never under reduced motion. (SPEC 4.6, 2.5)
- **Render model:** cumulative `at <= t` (past events persist). Auto-seek `t` to a scene's `tStart` on route entry. Interaction state is per-scene local React state; injected events carry `at` and drop on scrub-back; reset on unmount. (SPEC 4.3)
- **Aesthetic:** deck-dominant console, prose on paper overlay cards, Instrument Serif / Newsreader / Space Mono, coral accent. (SPEC 0.1, 4.4)
- **Data:** the six entity shapes + ten event kinds + `missionId` + `heroMissionId=1` + closed vocabularies + fixed `RATE`/`SEED=0x0FE7A123`. Codenames only from the frozen pool. (DATA-MODEL)
- **Scope:** all six scenes + coda. Fallback if time runs short: fewer scenes at FULL polish, never all rushed. (SPEC 0.1, 6)

## Non-negotiables (a gate blocks the build if any fails)
1. **Public-safe by construction (default-deny).** The app wires in ZERO real data. Every value is a closed-vocabulary member; the closure test proves it; the plant-and-fail scan (inject `/Users/`, watch it fail) runs in Phase 1; `build.sourcemap:false`; publish from the neutral git identity. (SPEC 3.3)
2. **Reduced-motion + autoplay.** Always-visible Pause (WCAG SC 2.2.2). Reduced-motion = cut-not-glide, particles off, autoplay off, scrubber still works. Flash cap ≤3/sec. (SPEC 2.5)
3. **Contrast.** Every text role clears AA on its real background; `--ink-muted` is BANNED on the deck (use `--ink-deck-muted`); the contrast test is a standing gate from Phase 0. (SPEC 4.4)
4. **Scene 3 stays descriptive.** The safety scene is architecture/defense-posture, never an exploit recipe or real command strings. (SPEC 2.3, 6)

## Working rules
- Greenfield repo in `~/Projects/operator-os-explainer` is GREEN under all guardrails: normal branch/code/test/commit.
- FIRST action in Phase 0: `git init` + set the LOCAL neutral identity (STACK §8), then provision the Vercel project.
- Feature branch, conventional commits, small logical units, no `Co-Authored-By` trailer. No em dashes in shipped UI prose (AI tell).
- Route mechanical volume (generator data, boilerplate, test scaffolds) to Codex via `codex exec` where it clears the economic floor; keep taste-heavy work (motion, layout, prose) yourself.
- These files are the spec. If something is genuinely missing or contradictory, note it and make the smallest reasonable decision that honors the non-negotiables — do not stall.
