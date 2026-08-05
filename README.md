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
4. **Closure test.** `src/data/closure.test.ts` fails the build if any
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

## Accessibility

Always-visible Pause on the global transport (WCAG SC 2.2.2), keyboard
transport (Space, arrows, Home/End), reduced motion honored via the OS
preference and an in-UI toggle (cuts instead of glides, particles off, no
autoplay, scrubber always works), and every text role contrast-checked
against its real background by a standing test.

## Stack

Vite + React 19 + TypeScript strict, react-router v7 (SPA), motion, D3
math submodules, Canvas for dense flow layers, Tailwind, Vitest.

## Develop

```sh
pnpm install
pnpm dev        # local console
pnpm test       # unit + closure + property + contrast gates
pnpm generate   # re-emit src/data/dataset.json from the seeded generator
pnpm guard      # forbidden-pattern scan (add --git for history)
pnpm build      # production bundle (sourcemaps off)
```

## License

MIT
