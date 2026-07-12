# Anatomy of an AI Operator OS — Creative + Technical Spec

> **Status:** Mapping / spec only, **v2 (hardened)**. No code in this session. Claude Fable 5 executes the build against this spec in a later session, with Opus for gnarly architecture and Codex for mechanical volume.
> **v2 changelog (hardening pass):** (1) stack reversed Next.js 14 static-export to **Vite + React 19 SPA** (4.1); (2) synthetic-data guarantee rebuilt from regex-denylist to **default-deny closed-vocabulary construction** (3.3), and the example codename pool purged of real names (3.2); (3) deck accessibility now carries **computed contrast ratios** and a required `--ink-deck-muted` fix (4.4); (4) added a **reduced-motion + autoplay behavior spec** against WCAG SC 2.2.2 / 2.3.1 / 2.3.3 (2.5); (5) phases updated to match (5).
> **v2.1 changelog (prep pass):** authored the run-and-go prep package under `prep/` — frozen audited codename pool (`codenames.md`), DATA-MODEL v2 with a `missionId` correlation key + `activity` reveal events (`DATA-MODEL.md`), the `SceneConfig`/`VizProps` contract (`scene-contract.ts`), the validated `sample-timeline.json` golden fixture, build pins (`STACK.md`), and the launch brief (`FABLE-KICKOFF.md`). Hero mission codename **Corveth** replaces the banned "Meridian". Read `prep/FABLE-KICKOFF.md` first.
> **Working title:** *Anatomy of an AI Operator OS*
> **Home:** standalone repo `~/Projects/operator-os-explainer`, standalone Vercel project first, surfaced into saagarpatel.dev later.
> **One-line pitch:** an interactive, data-driven instrument that makes a real personal multi-agent operator OS legible: the fleet, the spine, the hub, the guardrails, all shown in motion, every number on screen fabricated-but-realistic by construction.

---

## 0. The three locked decisions (design constraints, not choices)

1. **Real architecture, synthetic data.** The system *design* is faithful to what actually runs. Every *value* on screen (project names, summaries, costs, timestamps, handoff payloads, guard events) is invented. Public-safe by construction: the app never reads bridge-db, personal-ops, or any real store. It ships a bundled synthetic dataset produced by a seeded generator, and a build-time guard fails the build if a real-data pattern leaks in.
2. **Live data tool-explainer.** Interactive and data-driven, not a static essay. The fleet is shown *in motion*: agents dispatching, handoffs flowing across the spine, guards firing, work shipping. "Live" means a deterministic replay of synthetic events on a timeline the reader controls (play / pause / scrub), plus direct-manipulation moments where the reader triggers events themselves. The interactivity is real; the data underneath it is fake.
3. **Fable builds later.** This document is written for a senior-engineer model to execute autonomously with per-phase verification gates.

### 0.1 Locked in this mapping session (operator decisions, do not re-litigate)

- **Aesthetic: deck-dominant console.** The piece is a dark instrument console; prose floats as overlay cards on the console rather than sitting in a paper column. This is an intentional, sanctioned *inversion* of The Bench's usual paper-dominance while staying in the same design family: same three type registers (Instrument Serif titles, Newsreader prose, Space Mono telemetry), the same coral accent, graphite deck as the *dominant* surface. Paper is reserved for overlay prose cards. Cinematic, dense, "this is a real system running." See 4.4 for the adjusted material rules and the accessibility floor this creates.
- **Every layer is a hero.** No single hero scene; the Fleet, the Spine, the Safety layers, and the Finale each get full build polish. The cold open (Scene 0) is the connective tour that threads all four in one 15-second trip, then the scroll lets the reader dwell on each. Budget build effort roughly evenly across the four, not lopsided toward one.
- **Depth: layered (both).** Accessible surface anyone technical-adjacent can follow, with optional "go deeper" panels for practitioners. The `SceneConfig` contract carries a `deepPanel` slot (see 4.2).
- **Scope: full six scenes tonight.** Scenes 0-5 plus the coda all ship. The Hub scene is no longer optional. Mitigate the ambition by build order, not by cutting: shared primitives first, cold open assembled last (see 5).
- **Live model: reader-scrubbed replay.** A single global synthetic session clock; every scene is a lens on the same advancing timeline; the reader controls play/pause/scrub. This is the interaction spine (see 2.2, 4.3).

---

## 1. Faithful, public-safe map of the real operator OS

This is the subject matter the piece teaches. Everything here is architectural (roles, flows, guarantees). Nothing here is operational secret, exploit recipe, or private detail.

### 1.1 The Fleet — four cooperating systems

Routing is by **gravity**: each system owns the class of work it is best at; work is not forced into the wrong system.

| System | Role in one line | Owns / attracts | Spine identity |
|---|---|---|---|
| **Claude Code (CC)** | The careful engineer with hands on the filesystem | Feature branches, multi-file refactors, evals, auth/payments/migrations, debugging, toolchain config. Anything needing a live filesystem and test runner. | `cc` |
| **Codex** | The cheap, fast, mechanical swarm | Multi-repo sweeps, repetitive infra edits, PR hygiene, dependency bumps, CI fixes. Work where parallelism beats reasoning depth. Crisp specs only. | `codex` |
| **Claude.ai** | The writer/strategist with no filesystem of its own | Long-form writing, research, career/speaking context, brainstorming, cross-project synthesis, dispatching work into CC/Codex. | `claude_ai` |
| **Autonomous jobs** | The night-shift auditor that only looks, never touches | Scheduled read-only audits: portfolio maintenance, cost reporting, harness safety. Runs as CC headless via a scheduler. | `cc` |

**Model routing (by role, not by system):**
- **Lead / coordinator** runs on the session model (Opus-tier or Sonnet-tier). Keeps context clean by delegating.
- **Implementation** is Sonnet-tier by default, Opus-tier for architecture / auth / payments / migrations or after repeated failure. Never silently downgraded below Sonnet.
- **Research / exploration** is Haiku-tier first for read-only single-pass gathering, escalating on quality failure.
- **Validator / reviewer** is Haiku-tier for advisory/UI, Sonnet-tier for security/correctness reviewers.
- **Cost play:** mechanical work is pushed down to Codex (materially cheaper) so the expensive budget is spent only where taste and judgment are required. The Claude model stays the orchestrator: scope, prompt, dispatch, verify.

**Auto-team scaling tiers (how CC scales itself):** Tier 1 solo (1-3 files), Tier 2 parallel subagents in isolated worktrees (4-7 files), Tier 3 coordinated agent team (8+ files), Tier 4 dynamic workflows (fan-out to many subagents, always with a verify stage).

### 1.2 The Spine — bridge-db as shared nervous system

A single SQLite+FTS5 store every system reads and writes under its fixed caller identity. What flows across it:

- **activity_log** — session activity per system, full-text searchable.
- **handoffs** — dispatched units of work moving between systems.
- **snapshots** — point-in-time system state, saved on completion, read on takeover.
- **cost_records / session_costs** — cost telemetry piped from all systems so the cost play is measured.
- **sections** — long-lived context (career, capabilities, research, speaking, portfolio).

**Handoff mechanics:** Claude.ai's only write path into CC/Codex is a handoff (it has no filesystem). A completed unit is closed by logging activity and saving a snapshot; the next system reads the latest snapshot first ("snapshot-first takeover"). The doctrine governing the exchange: branch-as-lease (a branch acts as a lease on the work), symmetric receipts (both sides acknowledge), and write-conflict receipts that surface stale writes and raced claims.

**Shipped-event sync obligation:** activity can carry two retention-protected tags. `SHIPPED` means a feature reached a durable, usable state and creates a downstream sync obligation: a shipped-sync guard propagates it to an external Build Log and reconciles it exactly once. `LEDGER` is an operator-directed durable record with no sync obligation. Untagged rows are pruned to a recent window; tagged rows are retained permanently.

### 1.3 The Hub — personal-ops as hub-and-spoke control plane

A local control plane, the operating system for the operator's work-life surface. It governs mail/inbox, review queue, approval queue, worklist, day/status views, calendar/meeting briefs, contacts, tasks, planning recommendations, and portfolio/career snapshots.

**Hub-and-spoke substrate (decided architecture):** personal-ops is the hub; every producer keeps its own store as system of record and is a spoke. The hub reads spokes through adapters and a freshness state machine (fresh / aging / stale / unavailable) and alerts only from fresh data. A read-only federation layer sits on top for cross-spoke queries. The hub never calls external APIs directly and its only cross-system write is fire-and-forget activity logging into the spine.

**The draft → approval → send airlock:** outbound actions are never sent directly. Create a draft artifact, raise an approval request, the operator approves with a confirmation token, then send, gated by a timed send-window. Every externally-visible action becomes a reviewed, token-gated event. Read-only tools (status, worklists, digests, readiness) are safe to call freely; mutating tools (draft/approval/send, task creation) require explicit instruction and a token.

### 1.4 The Safety Layers — the defense story

The system runs fully autonomous *because* it is wrapped in independent, overlapping guards. Design philosophy: **"guards fire, agent adapts."** A blocked action is a signal to reroute, not a wall to route around. Present this as architecture and defense posture, never as an exploit recipe.

Layered model, outer intent to inner floor:
1. **Permission modes** chosen at launch (auto / acceptEdits / devcontainer / bypass-in-worktree) — intent levels.
2. **permissions.deny** — a denylist of forbidden patterns; a parallel allowlist of pre-approved safe ones.
3. **PreToolUse hooks** — deterministic gates firing before a tool runs: dangerous-command blocking, DB-mutation guards, git-safety, secret detection on edits, protected-file guards, and a dispatch-contract guard for delegated mechanical work.
4. **Hard-deny rules** — a small set of structurally forbidden operations that instruction cannot override (touching credential stores, pushing to main, destructive DB ops on non-local hosts, self-mutation of the harness config, broad destructive deletes near home root).
5. **Carve-outs** — a narrow, reviewed exception surface that cannot weaken the safety posture itself.
6. **Confidence-gating** — clear a confidence threshold before acting autonomously; below it, escalate instead of guess.
7. **Verify-before-done gate** — compile + test must pass before a task can be marked complete. "Done, tests pass" is a claim to be re-verified on bytes.
8. **Integrity floor + self-heal** — verifies the guard set is present and wired, restores a missing guard from a blessed baseline, alerts on tampering. Guards the guards.

The through-line: every layer is independent, so no single bypass unlocks the system, and each guard makes the agent *adapt* rather than escalate privilege.

### 1.5 The Division of Labor

Decision table (work type to owner), handoff conventions (who dispatches to whom, how), activity-tag vocabulary (`SHIPPED` with sync obligation, `LEDGER` without). Codex sharpeners: crisp/self-contained/parallelizable/high-volume with a machine-checkable return contract; no ambiguous or taste-heavy work; an economic floor below which work is done inline; no auto-rescue of twice-failed tasks.

---

## 2. Narrative + experience design

### 2.1 Framing: the piece is itself an instrument

The whole artifact reads as a **console for a system you are being shown around**. Per the locked aesthetic (0.1), it is *deck-dominant*: the dark graphite console is the primary surface, live instrument panels fill it, and prose rides as paper overlay cards on top. A single coral accent, serif titles, mono telemetry. The prose frames; the interactivity *is* the argument. See 4.4 for the adjusted material rules.

The reader's mental model on arrival: "I keep hearing about multi-agent systems. Show me one that actually runs, and let me poke it." The piece answers by letting them watch and touch a fleet in motion, layer by layer, then see the whole thing orchestrate one mission end to end.

### 2.2 The spine of the experience: a synthetic session clock

One unifying device ties every scene together: a **synthetic session clock**. The bundled synthetic dataset is a timeline of events (dispatches, handoffs, guard firings, ships, cost records). A global transport (play / pause / scrub / speed) advances the clock; each scene is a different lens onto the same advancing timeline. Scrub back and every scene rewinds in sync. This is the HowMoneyMoves `useScene` idea promoted to a system-wide clock, and it is what makes "live" honest: real motion, deterministic replay, synthetic data.

A persistent, quiet **SYNTHETIC DATA** badge lives in the chrome so no viewer ever mistakes the feed for real telemetry.

### 2.3 Scene sequence

Each scene teaches one layer of the system and carries one hero interactive moment. Ordered as a guided scroll with deep-linkable routes, but each scene is also independently reachable.

**Scene 0 — Cold open: "Watch one task travel the whole OS."**
The hero shot. The full system laid out as a dim constellation at rest. A single fabricated operator instruction drops in ("Ship the export pipeline for Corveth", the frozen hero codename). The viewer watches it ripple: routed to a system, dispatched, a subagent fan-out, a guard fire and adapt, a verify gate, a ship, a sync ripple outward. Fast, cinematic, ~15 seconds autoplay, then "explore each layer" invites the scroll. This is the trailer for everything that follows.

**Scene 1 — The Fleet: routing by gravity.**
Four systems as nodes with distinct personalities. Hero interaction: the reader grabs a task chip (feature / sweep / essay / nightly audit) and it flies to the system that owns it, with a one-line "why here" annotation. Teaches gravity-based routing and each system's identity. Live layer: the synthetic dispatch feed pulses in the background.

**Scene 2 — The Spine: the shared nervous system.**
bridge-db as a horizontal bus threading all four systems. Hero interaction: a handoff flows Claude.ai to CC. The reader sees the baton-with-a-lease motion, the snapshot-first takeover, the receipt. A live "bridge feed" ticker shows activity_log rows scrolling in mono, each tagged. Toggle to reveal the five row shapes (activity / handoff / snapshot / cost / section) as an inspectable schema without exposing any real content.

**Scene 3 — The Safety Layers: guards fire, agent adapts.**
The defense story as concentric shields around an acting agent. Hero interaction: the reader triggers a would-be-dangerous action (push to main, read a credential dir, delete near home root) from a safe fabricated menu; the matching guard lights up, blocks it, and the agent visibly *reroutes*. Teaches layered independence and the adapt-not-escalate behavior. Strictly descriptive, no real command strings, no bypass technique. This is the differentiator scene: it shows the system is safe *because* it is autonomous under guards.

**Scene 4 — The Fleet in Motion: the finale.**
The whole system orchestrating one mission. A Tier 2/3 fan-out: the lead splits a mission into lanes, subagents spawn into isolated worktrees, run in parallel, converge into one mission commit, hit the verify gate (which can block and bounce back red before going green), ship with a `SHIPPED` tag, and ripple a sync outward to the external Build Log. The grand "everything at once" moment. Cost ledger tallies synthetic spend as it runs, showing the Codex cost play (mechanical lanes cost a fraction).

**Scene 5 — The Hub: the airlock.**
personal-ops as hub-and-spoke. Hero interaction: the draft → approval → send airlock as a literal three-stage airlock the reader steps a message through, plus a panel of spoke freshness lights breathing fresh/aging/stale/unavailable. Teaches the token-gated outbound discipline. In scope for tonight (0.1).

**Scene 6 — Coda: what this is and why it is rare.**
Short prose. The claim: almost nobody has built a personal multi-agent operator OS at this depth. The honesty note made explicit: everything you just watched is synthetic by construction, and here is exactly how that guarantee holds (link to the guard). Ends on the reader-facing "this is real practice, not a demo" beat.

### 2.4 What "the fleet in motion" looks and feels like

- **Structural layer (SVG):** the constellation of systems and the spine bus, drawn as an instrument schematic with hairline connectors, laid out with a D3 force or fixed layout.
- **Flow layer (Canvas for density):** particles/batons moving along connectors representing dispatches, handoffs, ships. Canvas when element counts get high (the finale swarm, the bridge feed), SVG when structural.
- **Telemetry layer (DOM/mono):** live-updating counters, the bridge-feed ticker, the cost ledger, guard-event log, all rendered in Space Mono against the graphite deck.
- **Motion sensibility:** restrained and legible, not flashy. `motion` (Framer Motion's successor) for scene transitions and reveal pacing; the reader controls the transport. Airy paper prose cards punctuated by dense graphite instrument panels.

### 2.5 Motion, autoplay, and reduced-motion (accessibility, load-bearing)

The dark animated console triggers three WCAG Level-A concerns; the behavior below is required, not optional (Phase 9 verifies both states).

- **SC 2.2.2 Pause/Stop/Hide (Level A):** auto-moving content over 5s presented alongside other content needs a persistent, keyboard-operable pause. The transport's Pause satisfies this and must be **visible at all times**. The Scene 0 cold open (a ~15s autoplay) triggers this and is allowed ONLY with that persistent pause present.
- **Reduced motion is NOT freeze.** Under `prefers-reduced-motion: reduce` (checked via CSS AND a `matchMedia` JS gate AND an in-UI toggle): autoplay OFF (instrument starts paused; the cold open shows its final composed state statically), all state transitions instantaneous (panels **cut** instead of glide, `transition-duration: 0.01ms`), all ambient motion OFF (particles, parallax, glows). The **scrubber and step controls stay fully functional** and every synthetic state stays reachable and fully rendered. The information is the state values; the tween and the particles are decoration and must be removable. Gate the rAF loop in JS (CSS alone will not stop a JS-driven autoplay).
- **SC 2.3.1 Three Flashes (Level A):** cap particle flashing at <= 3/sec, small area, low contrast, below the general and red flash thresholds. The reduced-motion switch kills them entirely.

The default experience keeps all the drama; reduced-motion keeps all the information. Both are required.

---

## 3. Synthetic data model + generator + guarantee

The generator mirrors the **shape** of bridge-db (schemas below are transcribed from the real DDL) with fully invented contents. The app reads only the generated bundle.

### 3.1 Entity schemas (shape-faithful, content-invented)

TypeScript interfaces mirror these columns. (Field names in this section are illustrative, transcribed snake_case from the source DDL; the AUTHORITATIVE types are camelCase per `prep/DATA-MODEL.md` and `prep/scene-contract.ts`.)

**Activity** (`activity_log`): `id:int`, `source: 'cc'|'codex'|'claude_ai'|'notion_os'|'personal_ops'`, `timestamp:iso`, `project_name:string` (from invented codename pool), `summary:string`, `branch:string|null`, `tags:string[]` (subset of `SHIPPED`,`LEDGER`, free-form), `source_trust:'operator'|'agent'|'ingested'`.

**Handoff** (`pending_handoffs`): `id:int`, `project_name`, `project_path:string|null` (fabricated, non-real), `roadmap_file:string|null`, `phase:string|null`, `dispatched_from:'claude_ai'`, `dispatched_at:iso`, `picked_up_at:iso|null`, `cleared_at:iso|null`, `status:'pending'|'active'|'cleared'`, `claimed_by:string|null`, `source_trust`.

**Snapshot** (`system_snapshots`): `id:int`, `system:'cc'|'codex'`, `snapshot_date:date`, `data:json` (invented `{active_projects, lessons, patterns}`), `created_at:iso`, `source_trust`.

**CostRecord** (`cost_records`): `id:int`, `system:'cc'|'codex'|'notion_os'|'personal_ops'`, `month:'YYYY-MM'`, `amount:number` (fabricated, rounded, obviously synthetic), `notes:string|null`. Plus **SessionCost** (`session_costs`): `session_id`, `project_name`, `started_at`, `cost_usd`, `model_breakdown:json`, `source`.

**Section** (`context_sections`): `section_name:string`, `owner:'claude_ai'|'cc'|'codex'`, `content:string` (invented prose), `updated_at:iso`, `version:int`.

**Derived event types (not bridge-db tables, needed for the visuals):**
- **DispatchEvent:** `{from, to, taskClass, model, at, durationMs}` — powers routing + finale.
- **GuardEvent:** `{layer, ruleConcept, action, outcome:'blocked', adaptation:string, at}` — powers Scene 3. Rule concepts are described, never real command strings.
- **FreshnessTick:** `{spoke, state:'fresh'|'aging'|'stale'|'unavailable', at}` — powers the Hub scene.

All events carry an `at` on the shared synthetic clock so scenes stay in sync.

### 3.2 The invented namespace

A curated **codename pool** provides all project names. WARNING (hardening finding): "cool-sounding" words are frequently real products. *Meridian*, *Northwind*, and *Halyard* are all real software projects and MUST NOT be used. The pool must be **audited once at authoring time** against npm / PyPI / crates and GitHub search, then frozen; prefer provably-fictional coinages (pronounceable nonsense) over real-sounding words. Model labels use in-world tier names only (Opus / Sonnet / Haiku / a generic "mechanical" model for the Codex slot). Fable is the BUILDER of this piece, not a fleet model, so it never appears in shipped data. Summaries are **templated from closed word lists** (see 3.3), never model-authored free text. Paths, if shown, use a fake root like `~/workspace/<codename>`, never `/Users/...`, and the scanner normalizes `~`, `%USERPROFILE%`, and `C:\Users\` too.

### 3.3 The guarantee: public-safe by construction (default-DENY, not scan)

Hardening verdict: a regex *denylist* is default-allow and cannot prove absence of unknown reals (a hallucinated real lesson, a colliding codename). "By construction" requires **default-deny: every shipped value is provably drawn from an audited finite set.** Six mechanisms; the load-bearing one is closure, not scanning.

1. **No live wiring (primary).** The app has zero connection to bridge-db, personal-ops, or any real store. No MCP, no fetch. It imports one static generated JSON bundle.
2. **Closed-vocabulary generation.** Every identity-bearing field is typed to a closed, audited enum: `project ∈ FROZEN_CODENAME_POOL` (audited per 3.2), `model ∈ {Opus, Sonnet, Haiku, mechanical}`, `source ∈ {cc, codex, claude_ai, notion_os, personal_ops}`, `event_type ∈ FIXED_ENUM`, `section ∈ FIXED_SET`. The generator can only emit set members.
3. **No model-authored free text in shipped data.** Prose fields (summaries, lessons, patterns) are **templated** from closed word lists (`${verb} ${codename} ${artifact}`) or drawn from a hand-authored, reviewed string pool. Numbers are deterministic formulas over the seed within fixed ranges, never sampled from real distributions (real cost ratios across model tiers are otherwise reconstructable from proportional fake volumes).
4. **Closure assertion + property test (the real guarantee).** A build-time test asserts **every emitted value across the whole dataset is a member of its field's allowlist** (set membership), plus a property test treating the generator as a pure function `seed -> data`, enumerating/heavily-sampling the output space to assert closure. This is a construction proof, not a hope. Seeded determinism makes two runs byte-identical.
5. **Regex scanner as backstop, correctly scoped.** Keep a forbidden-pattern scan (emails; `/Users/` plus `~`, `%USERPROFILE%`, `C:\Users\` normalized via NFKC+lowercase; dollar precision) as belt-and-suspenders to catch mistakes in the allowlists themselves. Scope it to **the generator source, the emitted dataset, AND `dist/` including `.js` and `.map`** (bundlers bake absolute build-machine paths into source maps). Set `build.sourcemap: false` for production.
6. **Repo + publication hygiene (out-of-tree leaks the scan cannot see).** The scanner's denylist of KNOWN real names is itself a real-names leak if shipped: keep it **private / CI-only or store SHA-256 of lowercased tokens** and match hashed. Publish from an **orphan or squashed branch with a neutral author identity** (commit metadata leaks real email/paths; working-tree-clean is not history-clean); scan `git log -p`, not just the tree. Build with a neutral `$HOME`; no `file:` deps; scrub public build logs. A visible **SYNTHETIC DATA** watermark stays in the UI chrome, and the README states the contract.

Prove it in Phase 1: the closure test fails if any value escapes its allowlist, plus a plant-and-fail check (inject a `/Users/` string, watch the build fail, remove it).

---

## 4. Technical architecture

### 4.1 Stack (the site's OTHER precedent: Vite SPA, not Next)

Hardening reversed the v1 Next.js choice. This app is one client-side rAF/Canvas instrument with zero server components, zero data fetching, and no prerenderable content (no equations, no server-rendered prose). Next.js static export would prerender every client component to HTML at build time and impose a `window`/Canvas/rAF prerender-guard tax for zero payoff, and pinning Next 14 is two majors stale (locks React 18). The sibling explainer HowMoneyMoves already proves the correct pattern on this exact site: a Vite SPA with one Vercel catch-all rewrite. Deep-linkable per-scene routes are a solved SPA problem. So this piece uses the site's Vite lineage, not its Next lineage.

- **Vite** (latest stable major, >= 7), **React 19**, **TypeScript strict**. Pure client bundle, no prerender surface, so the entire Next static-export failure class does not exist. Exact pins in `prep/STACK.md`.
- **react-router-dom v7** in SPA / data-router mode (`createBrowserRouter`), NOT framework mode (no SSR/loaders). Deep-linkable scene routes.
- **`motion` ^12** (the renamed Framer Motion; import from `motion/react`). NOT `framer-motion@11`, which is incompatible/stale on React 19.
- **D3 v7** for math, scales, and force/graph layout only. **React owns all SVG/DOM** (the load-bearing anti-D3-DOM-conflict rule).
- **Canvas** for dense flow layers (bridge feed, finale swarm) at high element counts, targeting 60fps. Drive per-frame updates through **refs, not `setState`** (a 60fps `setState` thrashes React 19's concurrent renderer).
- **Tailwind** + The Bench design tokens. **pnpm**. Co-located `*.test.ts`, typecheck + build gate. Node >= 20.

**Critical architecture rule (the session clock):** hoist the single global `requestAnimationFrame` loop into a context provider ABOVE the `<Routes>` outlet, so scrubbing and scene-switching read shared clock state instead of remounting and restarting the loop. Cancel with `cancelAnimationFrame` on unmount; make rAF/Canvas setup idempotent (React 19 StrictMode double-invokes effects in dev, or you get two overlapping loops).

**Deploy rewrite:** ship a root `vercel.json` with the SPA catch-all `{"rewrites":[{"source":"/(.*)","destination":"/index.html"}]}`, mirroring HowMoneyMoves, so deep links resolve on refresh/direct-nav.

**Tripwire that would flip back to Next 16 (never 14):** only if scenes later need SEO-indexable prose, MDX/KaTeX chapters, or OG-image generation. Nothing in this spec does.

### 4.2 The content-as-data contract

Follow the S&N/HMM spine: one typed contract, pure data/content files, a registry with an explicit order array, one driver hook, presentational components that never own domain logic.

- `types/scene.ts` — a central `SceneConfig` interface: `slug`, `number`, `title`, `subtitle`, `hook`, the lens type, the event selector (which synthetic streams this scene reads), per-scene interaction config, and a `deepPanel` slot carrying the optional practitioner-depth content (per the layered-depth decision, 0.1) so every scene exposes an accessible surface plus a "go deeper" drawer from one contract. Changing this interface updates all scene configs in one commit (S&N house rule).
- `scenes/*.ts` — one file per scene, `export default` a `SceneConfig`; `scenes/index.ts` is the registry + `SCENE_ORDER`.
- `src/data/` — the generator (`generate.ts`), `vocab.ts` (closed vocabularies + frozen codename pool), the emitted `dataset.json`, and the guard/closure tests. All source lives under `src/` (types at `src/types/`, hooks at `src/hooks/`).
- `hooks/useSessionClock.ts` — the single driver hook: advances the synthetic clock, exposes `play/pause/scrub/setSpeed`, and yields the events active at time `t`. Analogous to S&N `useChapterModel` and HMM `useScene`, promoted to a global transport.
- `components/viz/` — one component per hero visualization: `FleetGraph`, `SpineBus`, `BridgeFeed`, `GuardShields`, `WorktreeSwarm`, `VerifyGate`, `CostLedger`, `AirlockFlow`, `FreshnessPanel`.
- `components/scene/` — shells, transport bar, nav, annotation, synthetic badge.
- `components/scene/content/` — per-scene prose.
- `lib/` — pure helpers (layout math, event selectors), each with an inline known-value assertion per the S&N math rule.

### 4.3 How the live interactivity works

`useSessionClock` holds a monotonically increasing synthetic time `t` and lives in a context provider ABOVE the react-router outlet, so it survives scene navigation. `dataset.json` is a sorted event array. **Canonical render rule: a scene renders all events with `at <= t` (cumulative, monotonic)**; "window" language applies only to decorative particle fade, never to what data is visible. On route entry the clock auto-seeks `t` to the scene's `tStart` (unless a `?t=` param overrides), so a deep-linked scene never opens empty. Scenes are pure functions of `(events, t, interaction, reducedMotion)`.

**Interaction-state ownership:** each scene owns its interaction state as local React state (a dragged chip, a triggered guard). Direct-manipulation moments inject an ephemeral synthetic event carrying an `at`; it is visible only while `t >= at` and is dropped when the reader scrubs back before it. Interaction state resets on scene unmount by design (navigating away and back is a clean slate). The bundled dataset is never mutated. Deterministic, reproducible, offline.

### 4.4 The Bench design language (from the live site)

Same design family as the site, but with the **material balance inverted** per the locked deck-dominant decision (0.1). The site is normally paper-dominant; this piece makes the graphite deck the dominant surface and reserves paper for overlay prose cards.
- **Materials:** dark instrument **deck** is the primary field (`--deck #15191e` cool graphite never pure black, `--ink-deck #e9e7df`, oscilloscope-hairline `--deck-line`). Warm **paper** (`--paper #f4efe4`, ink `--ink #1a1c20`, muted `#6b6457`) is reserved for floating prose cards that sit on the deck.
- **Accent:** coral-sienna. On the dominant deck use the brighter `--accent-deck #ff7a4d`; on paper overlay cards use `--accent #b0451d`. Single accent, used sparingly.
- **Accessibility floor (computed, not assumed).** Contrast ratios computed for the deck-dominant pairs (WCAG 2.1 relative luminance; AA = 4.5 normal / 3.0 large-UI):
  - ink-deck `#e9e7df` on deck `#15191e` = **14.26:1** PASS (primary body on dark)
  - accent-deck `#ff7a4d` on deck `#15191e` = **6.84:1** PASS (coral on dark)
  - paper card `#f4efe4` on deck `#15191e` = **15.39:1** PASS (prose reads AA on the card)
  - on paper: ink `#1a1c20` = 14.88, accent `#b0451d` = 4.93, ink-muted `#6b6457` = 5.11 — all PASS
  - **ink-muted `#6b6457` on deck `#15191e` = 3.01:1 — FAILS AA normal text** (passes only large / non-text UI).
  **Required fix:** do NOT use `--ink-muted` for body-size secondary text on the deck (the natural instinct for telemetry labels). Define a deck-specific **`--ink-deck-muted`** that clears >= 4.5:1 on `#15191e` (lighten toward ~`#a8a293` or brighter, re-verified by the contrast script), and restrict any 3:1 token to large text / non-text UI only. This is a Phase 9 gate.
- **Type registers:** display serif **Instrument Serif** (titles only), prose serif **Newsreader** (body/overlay cards), mono **Space Mono** (labels/telemetry/values). The chrome reads as an instrument: serif titles, serif prose, mono numbers/controls/units.
- **Motion:** dense and dramatic is the brief, but keep it legible and honor `prefers-reduced-motion` (critical given the dark, animated console). Hairline framing; real-looking mono telemetry; the deck breathes, the prose cards stay calm.

### 4.5 Integration path (standalone-first, integrate later)

1. **Own Vercel project.** Own repo, own `vercel.json`, own alias/subdomain. Vite build to `dist/`, `buildCommand: pnpm build`, plus the SPA catch-all rewrite `{"source":"/(.*)","destination":"/index.html"}` exactly as the sibling HowMoneyMoves runs. Copy the shared security-headers block verbatim from `signal-noise/vercel.json` (`X-Content-Type-Options: nosniff`, `Referrer-Policy: strict-origin-when-cross-origin`, `Permissions-Policy: camera=(), microphone=(), geolocation=()`). Standalone avoids the site's commit-author fence entirely.
2. **Surface into the site later** by being a public GitHub repo the portfolio auditor scans; it regenerates `projects-data.json` and lists the piece under "interactive explainers" alongside Signal & Noise and HowMoneyMoves. No hand-editing the site.
3. **Public-safe hygiene:** MIT, fully static, no persistence, no PII/secrets/real-paths, privacy-respecting analytics only.

---

### 4.6 Build specifics (pinned in `prep/STACK.md`)

The mechanical build decisions are pre-decided in `prep/STACK.md` so Fable does not improvise them: the exact `package.json` dependency block (resolving the Vite / react-router / motion version forks against the HowMoneyMoves precedent), `tsconfig`, `tailwind.config`, `vite.config` (`build.sourcemap: false`), `vercel.json`, the Vitest setup, `@fontsource` self-hosting, and the guard/contrast scripts. **Route table** (`createBrowserRouter`, clock provider mounted ABOVE the outlet): `/` cold open, `/fleet`, `/spine`, `/safety`, `/finale`, `/hub`, `/coda`. **Transport:** continuous scrubber bound to `t ∈ [0, 90000]`, always-visible Play/Pause (SC 2.2.2), speed 1/1.5/2x, step-to-event boundary, keyboard (Space, arrows, Home/End); autoplay starts on scroll-into-view, never under reduced motion.

## 5. Phased build plan (with verification gates)

Each phase names an owner model and a gate producing **visual + functional evidence**. Fable executes the design-coherent build; Opus handles gnarly architecture; Codex handles mechanical volume via `codex exec` (profile `delegated`, effort **High** and never Ultra per operator discipline, timeout-wrapped, verified on bytes). Greenfield repo in `~/Projects` is GREEN under all guardrails: normal branch/code/test/commit.

**Scope is full six scenes plus coda (0.1).** The ambition is managed by *order*, not by cutting: Phases 0-2 build the shared primitives (design system, synthetic data, session clock) that every scene reuses, Phases 3-6 and 8 build the four hero layers plus the Hub with **even polish budget** (no lopsided hero), and Phase 7 assembles the cold open *last* from finished primitives. If a night runs short, the correct fallback is to ship fewer scenes at full polish rather than all scenes rushed, because design coherence is the value prop.

**Phase 0 — Scaffold + design system (Fable).**
FIRST action: `git init` with a LOCAL neutral author identity (3.3 mechanism 6), then provision + link the standalone Vercel project (so Phase 3 can deploy). Vite + React 19 + TS-strict skeleton, react-router-dom v7 SPA (`createBrowserRouter`, route table per 4.6), Tailwind, Bench tokens + three `@fontsource` self-hosted fonts + the new `--ink-deck-muted` token, the deck-dominant app shell (graphite console + prose overlay cards + transport bar with an always-visible Pause + synthetic-data badge), one placeholder scene route, root `vercel.json` (SPA rewrite + headers, `outputDirectory: dist`), Vitest wired with `src/lib/contrast.ts` + its contrast test committed now (a standing gate, not an end-of-build scramble).
*Gate:* `pnpm build` emits `dist/`; `pnpm test` green including the contrast test (all deck pairs pass, `--ink-muted`-on-deck is rejected); a deep link resolves on refresh via `vite preview`; a PNG of the shell shows the deck palette and all three type registers.

**Phase 1 — Synthetic data contract + guarantee (Opus designs, Codex fills).**
Opus writes `src/types/*`, the **closed-vocabulary** generator contract (3.3), the closure-assertion test, and the property test; imports the frozen, pre-audited `prep/codenames.md` and the `prep/sample-timeline.json` golden fixture (no build-time network audit). Codex generates the volume from closed word lists (no model-authored free text): templated summaries and the full seeded timeline across all entity + event types, matching the fixture's shape.
*Gate:* `pnpm test` green including (a) the **closure assertion** (every emitted value is a member of its field's allowlist), (b) the property test over sampled seeds, and (c) the plant-and-fail regex backstop (inject a `/Users/` string, watch the build fail, remove it). Dataset byte-identical across two runs. Codename-pool audit recorded. No `/Users/` or `~`/`%USERPROFILE%` variant in source, dataset, or `dist/`.

**Phase 2 — Session clock + transport (Opus/Fable).**
`useSessionClock`, the global transport (play/pause/scrub/speed), event-selector helpers.
*Gate:* a test scene renders event counts that change monotonically with `t`; scrubbing forward/back is deterministic; unit tests on the selector. Screen recording or frame PNGs at t0/t1/t2.

**Phase 3 — Scene 1 The Fleet (Fable). REFERENCE SCENE / vertical proof.**
Build this scene *fully* before fanning out the others: it proves the whole primitive-to-scene-to-gate pipeline once. `FleetGraph`, task-chip routing interaction, per-system identity + "why here" annotations, background dispatch pulse, the `deepPanel` drawer, AND the reduced-motion behavior (2.5). Do not start Phases 4-8 until this scene passes.
*Gate:* PNG of the four systems; a capture of a chip routing correctly for each task class; the deep panel opens; **reduced-motion verified** (autoplay off, cuts instead of glides, particles gone, scrubber still works); interaction unit test; the scene deploys to a Vercel preview. This is the go/no-go for the remaining scenes.

**Phase 4 — Scene 2 The Spine (Fable).**
`SpineBus` + `BridgeFeed` ticker + the Claude.ai to CC handoff animation with snapshot-first takeover; schema-shape inspector.
*Gate:* PNG of the bus + feed; capture of one handoff completing; the inspector shows the five row shapes with only synthetic content.

**Phase 5 — Scene 3 The Safety Layers (Fable, Opus reviews the framing).**
`GuardShields` concentric layers; the safe fabricated trigger menu; guard-fires-then-agent-adapts animation. Strictly descriptive, no real command strings, AUP-safe.
*Gate:* PNG of the shields; capture of a trigger being blocked and the agent rerouting; review that copy is descriptive/architectural, not exploit-flavored.

**Phase 6 — Scene 4 The Finale, fleet in motion (Fable, Opus for orchestration logic).**
`WorktreeSwarm` fan-out, converge-to-one-commit, `VerifyGate` with a red-then-green bounce, `SHIPPED` ripple to the external Build Log, `CostLedger` tallying the Codex cost play.
*Gate:* capture of a full mission running end to end including a verify-gate block-then-pass; cost ledger reconciles to the synthetic total; 60fps check on the swarm (Canvas).

**Phase 7 — Scene 0 Cold open (Fable).**
The cinematic ~15s autoplay hero assembled from the now-built primitives, then hands off to the scroll.
*Gate:* capture of the full cold-open sequence; "explore" invite wired to Scene 1.

**Phase 8 — Scene 5 The Hub (Fable).**
Full Hub scene (not optional, per 0.1): the draft to approval to send airlock as a three-stage airlock the reader steps a message through, plus the spoke freshness panel breathing fresh/aging/stale/unavailable.
*Gate:* PNG of the airlock + freshness panel; capture of a message stepping through all three airlock stages; the freshness lights cycle correctly off the synthetic `FreshnessTick` stream.

**Phase 9 — Coda + polish + deploy (Fable).**
The coda prose (what this is, why it's rare, the synthetic-by-construction honesty note linking the guard); full accessibility pass (WCAG AA verified on the deck-dominant surfaces per 4.4 including the `--ink-deck-muted` fix, `prefers-reduced-motion` honored per 2.5, keyboard transport, SC 2.2.2 pause present); Vite `dist/` build; publish from a clean/orphan branch with a neutral identity (3.3 mechanism 6); preview deploy.
*Gate:* Lighthouse (perf + a11y); the contrast script passes for every text/background pair including `--ink-deck-muted`; reduced-motion verified across the whole console (autoplay off, cuts, particles gone, scrubber works); the guarantee scan is clean over source + `dataset.json` + `dist/` (incl. `.map`) + `git log -p`; `pnpm build` deploys to a Vercel **preview** that renders. Final PNG set across all six scenes + coda.

> Codex-eligible slices across phases: the synthetic generator volume (Phase 1), repetitive scene-config scaffolds, test scaffolding, the forbidden-pattern guard script. Everything taste-heavy (motion, layout, prose, the Bench dressing) stays with Fable.

---

## 6. Risks + open design questions

**Risks**
- **Scope sprawl (heightened: full six scenes locked for one night).** Mitigation is order, not cutting: shared primitives first (Phases 0-2), then even-polish hero scenes, cold open assembled last. The *only* sanctioned fallback if time runs out is fewer scenes at full polish, never all six rushed, because coherence is the value prop. Each scene is deep-linkable and independently shippable, so a partial night still yields a real artifact.
- **Deck-dominant accessibility.** Making the dark console the dominant surface puts most text on graphite, raising the contrast burden. Mitigation: explicit WCAG AA verification of every text role against its true background, paper overlay cards backed enough to hold AA, a Phase 9 gate.
- **AUP sensitivity on Scene 3.** The safety scene must stay descriptive/architectural so Fable stays comfortable building it. Mitigation: no real command strings, no bypass techniques, framing is "defense posture," reviewed by Opus.
- **Perf on dense flow layers.** The finale swarm and bridge feed can tank frame rate if done in SVG. Mitigation: Canvas for high-count layers, SVG for structure, 60fps gate in Phase 6.
- **"Live but fake" legibility.** A viewer could mistake synthetic telemetry for real data. Mitigation: the persistent watermark + the coda honesty note.
- **Design coherence is the value prop.** This is the one axis where Fable's premium shows up, so a muddy visual direction wastes the whole premise. Mitigation: aesthetic locked (0.1); Phase 3 reference scene sets the bar before fan-out.
- **Guarantee was default-allow (hardening).** The v1 regex denylist could not prove absence of unknown reals, and the example codenames were real products. Likelihood high, impact severe (public leak). Mitigation applied: default-deny closed-vocabulary construction + closure test + audited frozen pool (3.3, 3.2).
- **Out-of-tree data leaks (git history, source maps, denylist file).** A clean working tree still ships real author email/paths in commit metadata and `/Users/` in `.map` files, and a plaintext real-names denylist is itself a leak. Likelihood medium, impact severe. Mitigation: orphan/neutral publish, `sourcemap:false`, scan `dist/`+`git log -p`, hashed/private denylist (3.3 mechanisms 5-6).
- **Muted-on-deck contrast fail.** `--ink-muted` on the deck is 3.01:1 (fails AA normal). Likelihood high (instinctive misuse), impact a11y violation. Mitigation: new `--ink-deck-muted` token, contrast script gate (4.4, Phase 9).
- **Autoplay without pause (SC 2.2.2).** The cold-open autoplay fails Level A without a persistent pause. Likelihood medium, impact a11y violation. Mitigation: always-visible Pause from Phase 0; reduced-motion starts paused (2.5).
- **Stack reversal churn.** Flipping Next to Vite after v1. Likelihood low impact now (spec-only change, no code written), and Vite is already a proven site precedent (HowMoneyMoves). Mitigation: none needed; flagged for operator veto in the readiness note.

**Open questions — RESOLVED this session (see 0.1).**
- Depth: layered (accessible surface + deep panels).
- Hero: all four layers are heroes, cold open threads them; even polish budget.
- Aesthetic: deck-dominant console, same design family, inverted material balance.
- Scope: full six scenes plus coda tonight, managed by build order.
- Live model: reader-scrubbed replay on a global synthetic session clock.

**Remaining smaller forks (safe for Fable to decide at build time, or raise if blocked):**
- Codename pool final wordlist (any pool of clearly-fictional names works).
- Exact transport affordance (scrubber vs. timeline vs. play-head) and whether autoplay starts on load or on scroll-into-view.
- Whether the deep panels are inline drawers or a side rail.

---

## 7. Handoff notes for the Fable build session

- This spec is the contract. Build on a feature branch in `~/Projects/operator-os-explainer` (greenfield, GREEN). Conventional commits, small logical units, verify-before-done per phase.
- The five-mechanism guarantee in 3.3 is non-negotiable: the app never wires real data in, and the forbidden-pattern build guard must exist and be proven (plant-and-fail test) in Phase 1.
- Keep Scene 3 descriptive. Keep the Bench dressing faithful. Keep the interactivity real and the data synthetic.
