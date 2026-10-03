# Anatomy of an AI Operator OS

An interactive explainer of a personal multi-agent AI operator OS: the fleet
of cooperating systems, the shared spine they read and write, the layered
guards that make full autonomy safe, and the airlock on everything outbound.
Built as a dark instrument console: one synthetic session clock drives every
scene, and the reader owns the transport (play, pause, scrub, step).

## The contract: real architecture, synthetic data

The system design shown here is faithful to a real running setup. Every
VALUE on screen is invented, and invented **by construction, not by
redaction**:

1. **No live wiring.** The app imports one committed JSON artifact
   (`src/data/dataset.json`). No network, no external store, no telemetry.
2. **Closed vocabularies.** Every identity-bearing field is typed to a
   closed, audited set (`src/data/vocab.ts`); the generator can only emit
   members. Project names come from a frozen pool of audited fictional
   coinages.
3. **No model-authored free text.** Summaries are templates over closed word
   lists; numbers are hand-set and deterministic.
4. **Closure test.** `src/data/closure.test.ts` fails `pnpm test` if any
   emitted value escapes its field's allowlist, and a property test holds
   that closed across sampled seeds. Two generator runs are byte-identical.
5. **Pattern scanner.** `scripts/guard-scan.ts` backstops the allowlists
   over source, dataset, and the built bundle (source maps are disabled),
   with a self-test proving the scanner catches plants before any pass.
6. **Publication hygiene.** Published from a clean branch under a neutral
   identity; the history is scanned, not just the tree.

The persistent SYNTHETIC DATA badge in the chrome is this contract, visible.

Architecture claims are separately enumerated in
[`PublicArchitectureManifestV1`](public/architecture-manifest-v1.json). Every
scene declares the claim IDs it presents, and CI verifies that each reference
resolves, every manifest claim is used, public evidence is revision-pinned,
and private or operator-attested evidence is labeled without pretending it is
publicly verifiable.

## Mechanism diagrams

Six static diagrams of the mechanisms (closure, handoff lease, airlock,
freshness, spine rows, guard layers) live in each scene's "go deeper" panel and
in [`docs/mechanisms.md`](docs/mechanisms.md). They are rendered from
`src/diagrams/`, print only values computed from the dataset and vocabularies,
wear the manifest's assurance level, and are regenerated with `pnpm diagrams`;
CI fails if a committed file drifts from a fresh render.

## Accessibility

Always-visible Play/Pause control on the global transport (WCAG SC 2.2.2), keyboard
transport (Space, arrows, Home/End), reduced motion honored via the OS
preference and an in-UI toggle (cuts instead of glides, particles off, no
autoplay, scrubber always works), and the contrast ledger's text-color pairs
checked against stylesheet background tokens by a standing test.

## Stack

Vite + React 19 + TypeScript strict, react-router v8 (SPA), motion,
Canvas for dense flow layers, Tailwind, Vitest.

## Develop

Run from the repository root with Node `^22.22.0` or `^24.0.0` and
`pnpm@11.15.0`, as pinned in `package.json` and CI.

```sh
pnpm install --frozen-lockfile
pnpm dev        # local console with committed synthetic data
pnpm exec vitest run src/data/closure.test.ts  # example focused fixture test
```

The complete local gate is in [AGENTS.md](AGENTS.md) and mirrors
[CI](.github/workflows/ci.yml): typecheck, tests, a fresh build, then the guard
scan and both generator-drift checks. Build before scanning so `dist/` is
current. Generator commands write committed artifacts; inspect any drift before
committing it. There is no separate lint/format script.

For changed browser behavior, run `pnpm test:e2e` after installing dependencies.
[Playwright](playwright.config.ts) uses installed Google Chrome and a local dev
server on `127.0.0.1:4173`; keep that port free rather than reusing an unrelated
server. Tests use synthetic application data. No browser run is needed for a
pure documentation change. `pnpm verify:live` is a separate hosted-deployment
check with provider prerequisites in [RELEASE.md](RELEASE.md), not a local test.
Preserve the release/dev lineage separation described there.

## License

MIT
