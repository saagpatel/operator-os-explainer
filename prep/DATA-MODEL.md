# Synthetic Data Model (Fable-ready, v2 post-review)

The app renders ONE bundled artifact: `src/data/dataset.json`, produced by a deterministic generator (`src/data/generate.ts`) run once at authoring time and committed. The app never imports the generator at runtime, only the JSON. This file is the contract: types, closed vocabularies, the generator algorithm, and which streams each scene reads. A fully-worked example instance lives in `prep/sample-timeline.json` (golden fixture + storyboard target).

Guarantee reminder (SPEC 3.3): every identity-bearing value is a member of a closed, audited set; no model-authored free text ships; a closure test proves it.

All paths are rooted at `src/` (SPEC layout reconciled to this): `src/data/`, `src/types/`, `src/hooks/`, `src/components/`, `src/lib/`.

---

## 1. The synthetic clock (canonical render model)

- One timeline. `at` = integer milliseconds from session start (0). Session length `T = 90_000` (90s).
- **CANONICAL RENDER RULE (cumulative):** a scene at clock `t` renders **all events with `at <= t`** (monotonic; past events stay on screen). "Window" language is reserved ONLY for decorative particle fade, never for what data is visible. This is what the Phase 2 monotonic gate checks.
- **Entity visibility:** entities carry no `at`; an entity becomes visible when a timeline event references it. The BridgeFeed orders rows by the `at` of their reveal event. Every Activity that must appear in the feed has a `kind:'activity'` reveal event. Snapshots/Sections appear only in the Scene 2 schema inspector (untimed), so they need no reveal event.
- Logical DB timestamps (`timestamp`, `snapshotDate`, `month`, `dispatchedAt`, ...) are ISO strings anchored to one fabricated window (`2026-03-16T00:00:00Z` .. `2026-03-16T00:01:30Z`), derived from `at`, never from `Date.now()`.

---

## 2. Types (`src/types/data.ts`)

```ts
export type Caller = 'cc' | 'codex' | 'claude_ai' | 'notion_os' | 'personal_ops';
export type FleetNode = 'cc' | 'codex' | 'claude_ai' | 'autonomous'; // the 4 rendered nodes
export type SnapSystem = 'cc' | 'codex';
export type CostSystem = 'cc' | 'codex' | 'notion_os' | 'personal_ops';
export type SectionOwner = 'claude_ai' | 'cc' | 'codex';
export type SourceTrust = 'operator' | 'agent' | 'ingested';
export type ModelTier = 'Opus' | 'Sonnet' | 'Haiku' | 'mechanical'; // Fable is the BUILDER, never in-world data
export type ActivityTag = 'SHIPPED' | 'LEDGER';

// ---- Entity mirror (bridge-db shapes, invented contents) ----
export interface Activity {
  id: number; source: Caller; timestamp: string; projectName: Codename;
  summary: string;             // TEMPLATED `${verb} ${artifact}`, never free text
  branch: string | null;       // `feat/<slug>` | `fix/<slug>` | null
  tags: ActivityTag[]; sourceTrust: SourceTrust; missionId: number | null;
}
export interface Handoff {
  id: number; projectName: Codename; projectPath: string | null; // `~/workspace/<slug>` only
  roadmapFile: string | null; phase: Phase | null;
  dispatchedFrom: 'claude_ai'; dispatchedAt: string;
  pickedUpAt: string | null; clearedAt: string | null;
  status: 'pending' | 'active' | 'cleared'; claimedBy: Caller | null; sourceTrust: SourceTrust;
}
export interface Snapshot {
  id: number; system: SnapSystem; snapshotDate: string;
  data: { activeProjects: Codename[]; lessons: Lesson[]; patterns: Pattern[] };
  createdAt: string; sourceTrust: SourceTrust;
}
export interface CostRecord { id: number; system: CostSystem; month: string; amount: number; notes: string | null; }
export interface SessionCost {
  sessionId: string; projectName: Codename; startedAt: string; costUsd: number;
  modelBreakdown: Partial<Record<ModelTier, number>>; source: Caller; missionId: number | null;
}
export interface Section { sectionName: SectionKey; owner: SectionOwner; content: string; updatedAt: string; version: number; }
export type SectionKey = 'career' | 'capabilities' | 'research' | 'speaking' | 'portfolio';

// ---- Timeline events (drive the visuals). EVERY arc-bearing event carries `missionId`. ----
export type SyntheticEvent =
  | { kind: 'dispatch';  id: number; at: number; missionId: number; from: Caller; to: FleetNode; taskClass: TaskClass; model: ModelTier; durationMs: number; status: 'ok' | 'failed' }
  | { kind: 'activity';  id: number; at: number; missionId: number | null; activityId: number } // reveals an Activity into the feed
  | { kind: 'handoff';   id: number; at: number; missionId: number; handoffId: number; stage: 'dispatch' | 'snapshot' | 'pickup' | 'receipt' | 'clear' }
  | { kind: 'guard';     id: number; at: number; missionId: number; layer: GuardLayer; ruleConcept: RuleConcept; outcome: 'blocked'; adaptation: Adaptation }
  | { kind: 'fanout';    id: number; at: number; missionId: number; lane: number; worktree: string; model: ModelTier; phase: 'spawn' | 'run' | 'converge' }
  | { kind: 'verify';    id: number; at: number; missionId: number; attempt: number; result: 'block' | 'pass' }
  | { kind: 'ship';      id: number; at: number; missionId: number; activityId: number; downstreamSystem: 'notion'; downstreamRef: string }
  | { kind: 'freshness'; id: number; at: number; spoke: Spoke; state: 'fresh' | 'aging' | 'stale' | 'unavailable' }
  | { kind: 'hubflow';   id: number; at: number; stage: 'draft' | 'approval' | 'send'; artifactId: string }
  | { kind: 'cost';      id: number; at: number; missionId: number; sessionCostId: string; model: ModelTier; deltaUsd: number };

export interface Dataset {
  meta: { seed: number; version: string; sessionLengthMs: number; heroMissionId: number; synthetic: true };
  activity: Activity[]; handoffs: Handoff[]; snapshots: Snapshot[];
  costRecords: CostRecord[]; sessionCosts: SessionCost[]; sections: Section[];
  events: SyntheticEvent[]; // sorted ascending by `at`
}
```

---

## 3. Closed vocabularies (`src/data/vocab.ts`) — the allowlists

`Codename` is imported from the frozen pool (`prep/codenames.md`). Everything below is a `const` tuple; the generator may ONLY emit members. The closure test asserts every shipped string is a member (or a template over members).

```ts
export const TASK_CLASSES = ['feature','bugfix','sweep','depbump','ci-fix','essay','handoff','audit'] as const;
export const PHASES = ['scope','scaffold','implement','verify','ship'] as const;
export const GUARD_LAYERS = ['permission-mode','deny-list','pretooluse-hook','hard-deny','confidence-gate','verify-gate','integrity-floor'] as const;
export const RULE_CONCEPTS = ['push-to-main','credential-read','non-local-db-write','harness-self-mutate','deep-home-delete','unverified-complete'] as const;
export const ADAPTATIONS = ['rerouted','reworded','escalated-to-operator','opened-a-branch','ran-verify-first'] as const;
export const SPOKES = ['bridge','event-bus','overlay','auditor','evals-ledger'] as const;
type Phase = typeof PHASES[number]; type TaskClass = typeof TASK_CLASSES[number];
type GuardLayer = typeof GUARD_LAYERS[number]; type RuleConcept = typeof RULE_CONCEPTS[number];
type Adaptation = typeof ADAPTATIONS[number]; type Spoke = typeof SPOKES[number];

// ---- Derived maps the scenes need (also closed) ----
export const ROUTING: Record<TaskClass, FleetNode> = {
  feature:'cc', bugfix:'cc', sweep:'codex', depbump:'codex', 'ci-fix':'codex',
  essay:'claude_ai', handoff:'claude_ai', audit:'autonomous',
};
export const WHY_HERE: Record<TaskClass, string> = { // hand-authored, reviewed closed set
  feature:'live filesystem + test runner', bugfix:'needs the repo and a repro',
  sweep:'parallelism beats reasoning depth', depbump:'mechanical, high-volume, self-contained',
  'ci-fix':'scripted, parallelizable', essay:'no filesystem; writes and dispatches',
  handoff:'the only write path into CC/Codex', audit:'scheduled, read-only, night shift',
};
export const GUARD_MAP: Record<RuleConcept, { layer: GuardLayer; adaptation: Adaptation }> = {
  'push-to-main':      { layer:'hard-deny',       adaptation:'opened-a-branch' },
  'credential-read':   { layer:'deny-list',       adaptation:'escalated-to-operator' },
  'non-local-db-write':{ layer:'pretooluse-hook', adaptation:'reworded' },
  'harness-self-mutate':{layer:'hard-deny',       adaptation:'escalated-to-operator' },
  'deep-home-delete':  { layer:'pretooluse-hook', adaptation:'rerouted' },
  'unverified-complete':{layer:'verify-gate',     adaptation:'ran-verify-first' },
};

// Templated summary word lists. summary = `${VERB} ${ARTIFACT}`.
export const VERBS = ['shipped','hardened','refactored','migrated','patched','benchmarked','wired','gated','audited','scaffolded','deduplicated','backfilled','instrumented','pruned','reconciled','pinned'] as const;
export const ARTIFACTS = ['the export pipeline','the auth adapter','the retry budget','the cache layer','the schema migration','the ingest worker','the rate limiter','the token gate','the sync guard','the config loader','the diff viewer','the event bus','the freshness poller','the cost ledger','the replay engine'] as const;
export const LESSONS = ['verify on bytes, not on exit code','guards fire, agent adapts','snapshot before takeover','dispatch clears the economic floor first','one scoped task per lane'] as const;
export const PATTERNS = ['branch-as-lease','builder plus read-only validator','closed-vocabulary generation','pipeline over barrier','deterministic seed'] as const;
type Lesson = typeof LESSONS[number]; type Pattern = typeof PATTERNS[number];
```

**Fleet nodes:** exactly 4 rendered nodes — `cc`, `codex`, `claude_ai`, `autonomous`. `autonomous` renders as a `cc` sub-mode (its activity `source` is `cc`). `notion_os` and `personal_ops` are callers that appear ONLY in the bridge feed and cost ledger, never as fleet nodes. A dragged `audit` chip flies to the `autonomous` node.

---

## 4. Generator algorithm (`src/data/generate.ts`) — deterministic, pure

1. **Seeded PRNG:** mulberry32 with `const SEED = 0x0FE7A123;` (valid uint32), used ONLY at generate-time. No `Date.now()` / `Math.random()`.
2. **Author the timeline as a script, not a random walk.** The 90s session is a hand-shaped sequence (46 events) telling one coherent hero mission (`missionId = meta.heroMissionId = 1`, codename **Corveth**) threading Fleet -> Spine -> Safety -> Finale, plus ambient events (a Codex sweep, a second handoff, a night audit, freshness ticks, hub airlock, costs) for the other scenes' feeds. The PRNG only fills low-stakes variety (verb/artifact index, `durationMs` jitter) within fixed ranges. `prep/sample-timeline.json` IS this authored instance.
3. **Numbers are deterministic and hand-set to the fixture, never sampled from real distributions.** The cost `deltaUsd` values ARE the fixture values ($0.03, $0.14, $0.01, $0.09, ...); treat `RATE` (Opus:0.09, Sonnet:0.03, Haiku:0.004, mechanical:0.01) as illustrative and `UNITS` as possibly fractional. Do NOT derive deltas from integer units (that cannot reproduce $0.14). The load-bearing property is the reconciliation invariant (item 5), not the formula.
4. **Strings are templates over closed lists.** `summary = pick(VERBS)+' '+pick(ARTIFACTS)`; branch `feat/${slug}`; path `~/workspace/${slug}`.
5. **Reconciliation invariant (closure test asserts):** for each mission `m` that has a `SessionCost`, `sum(cost.deltaUsd where missionId===m) === round2(sessionCost.costUsd)`. The finale CostLedger relies on this.
6. **Emit `Dataset`, sort `events` ascending by `at`, write `dataset.json`.** Run twice in CI, assert byte-identical.

---

## 5. Scene -> event-selector map

| Scene | Route | Reads (event kinds / entities) | tStart..tEnd | Hero interaction |
|---|---|---|---|---|
| 0 Cold open | `/` | `events.filter(e => e.missionId === meta.heroMissionId)` across all kinds | 0..18000 | 15s autoplay of Corveth's whole trip |
| 1 Fleet | `/fleet` | `dispatch`, `activity` + the 4 nodes + `ROUTING`/`WHY_HERE` | 0..90000 | drag a task chip -> routes to its node |
| 2 Spine | `/spine` | `activity`, `handoff`, `cost` (feed) + Snapshot/Section (inspector) | 0..90000 | run a claude_ai->cc handoff (dispatch/snapshot/pickup/receipt/clear) |
| 3 Safety | `/safety` | `guard` + `GUARD_MAP` | 0..90000 | trigger a fabricated risky action -> guard blocks -> adapt |
| 4 Finale | `/finale` | `fanout`, `verify`, `ship`, `cost` (mission `missionId=1`) | 6000..19000 | watch the mission: swarm -> verify block/pass -> ship/sync, ledger tallies (tEnd 19000 includes the handoff receipt/clear epilogue) |
| 5 Hub | `/hub` | `hubflow`, `freshness` | 0..90000 | step a message through draft->approval->send airlock |
| Coda | `/coda` | none (prose) | n/a | the honesty note + guard link |

`useSessionClock` exposes `eventsUpTo(t)`, `eventsOfKind(kind, t)`, `missionEvents(id, t)`. On route entry the clock **auto-seeks `t` to the scene's `tStart`** (unless a `?t=` query param overrides), so deep-links never open an empty scene. Scenes are pure functions of `(events/entities, t, interaction, reducedMotion)`.

---

## 6. Ownership / what Fable must NOT decide (pre-decided here)

- Six entity shapes, ten event kinds (incl. `activity` reveal), the `missionId` correlation key, the Dataset envelope with `heroMissionId`: fixed above.
- Closed vocabularies + ROUTING/WHY_HERE/GUARD_MAP: fixed above (extend only by adding members, never by opening a field to free text).
- Number formulas, fixed `RATE`, the reconciliation invariant, `SEED = 0x0FE7A123`: fixed above.
- Codename pool: frozen in `prep/codenames.md` (audited); hero mission = Corveth.
- Clock length (90s), date window, cumulative `at<=t` render rule, per-scene `tStart/tEnd` + auto-seek: fixed above.
- The `SceneConfig` + `VizProps` + interaction contract: `prep/scene-contract.ts`.
- **Opus** writes `src/types/*`, the generator CONTRACT, and the closure/property tests. **Fable/Codex** write `src/data/generate.ts` and the viz/motion/layout. Data contract is not Fable's to change.
