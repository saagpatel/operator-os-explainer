# Scene Storyboards (choreography specs, Fable-ready)

Beat-by-beat interaction choreography for all scenes, grounded in `prep/sample-timeline.json` (events cited as `[ev#<id> @<at>ms]`). These pin the interaction BEATS and states; Fable owns exact motion curves, easing, and pixel layout. Every scene honors the deck-dominant aesthetic (SPEC 4.4), the cumulative `at<=t` render rule, and the reduced-motion spec (SPEC 2.5). No em dashes in shipped copy (convert to hyphen).

---

### Scene 0 — Cold open (`/`, interaction: none)
- **Reads:** `events.filter(e => e.missionId === meta.heroMissionId)` (Corveth, missionId 1), all kinds. Window 0..18000.
- **Choreography:** a ~15s autoplay assembled from the finished primitives, playing Corveth's whole trip in miniature: route to cc `[ev1]` -> handoff `[ev2..ev4]` -> fanout `[ev10..ev16]` -> guard fires and adapts `[ev17]` -> converge `[ev20..ev22]` -> verify block-then-pass `[ev23, ev25]` -> ship + Notion ripple `[ev26, ev27]`. Then it settles and invites the scroll ("explore each layer" -> Scene 1).
- **Autoplay + reduced motion:** always-visible Pause (SC 2.2.2). Under reduced motion the cold open does NOT autoplay; it shows its final composed state statically, and the "explore" invite is immediate.
- **Copy note:** the dropped instruction reads "Ship the export pipeline for Corveth."

---

### Scene 1 — The Fleet (`/fleet`, interaction: taskChipRoute)
- **Reads:** `dispatch`, `activity` events; static `ROUTING`/`WHY_HERE` maps (DATA-MODEL §5). Exactly 4 rendered nodes: `cc`, `codex`, `claude_ai`, `autonomous` (`notion_os`/`personal_ops` never appear as nodes).
- **Clock window:** 0..90000 (full-session ambient pulse; the hero drag is reader-triggered).
- **Rest state:** four fleet nodes fixed as an instrument constellation, hairline connectors + an implicit dispatch gravity field. A task-chip tray with 4 chips: `feature`, `sweep`, `essay`, `audit`. A dim ambient dispatch-pulse replays real fixture dispatches as the clock advances. Mono node labels.
- **The trigger:** the reader drags a task chip onto the deck (tap in reduced-motion / non-pointer mode).
- **Beat sequence:**
  1. Ambient corroboration: past 800ms the background pulse fires `[ev#1 @800ms]` (feature -> cc), a faint line lights claude_ai-origin -> cc. Proof the routing is real.
  2. Reader drags `feature` -> `cc`; an ephemeral event is created at release; chip snaps onto `cc`.
  3. `cc` pulses `--accent-deck`; WHY_HERE annotation in mono: "live filesystem + test runner."
  4. `sweep` -> `codex`; corroboration `[ev#7 @5000ms]`; "parallelism beats reasoning depth."
  5. `essay` -> `claude_ai`; corroboration `[ev#34 @30000ms]`; "no filesystem; writes and dispatches."
  6. `audit` -> `autonomous`; corroboration `[ev#43 @60000ms]`; "scheduled, read-only, night shift." Node renders as a `cc` sub-mode.
- **Success / end state:** all 4 chips resolved, annotations settled. Takeaway (mono): "Routing is by gravity, not by hand."
- **Deep-panel hook:** the full `ROUTING` table for all 8 task classes + the model-tier-by-role rule (SPEC 1.1).
- **Reduced-motion variant:** no drag-trail/glow; chip cuts instantly tray -> node on tap; ambient pulse renders as a static lit connector or mono log line; annotation full-text immediately. Scrubber/step still work; tap replaces drag.
- **Copy notes:** WHY_HERE verbatim from the closed set.

---

### Scene 2 — The Spine (`/spine`, interaction: handoffRun over 5 stages)
- **Reads:** `handoff` stages for `handoffId=1` (Corveth, claude_ai -> cc); `activity` reveals for the BridgeFeed; `cost` feed rows; Snapshot/Section in the untimed schema inspector (DATA-MODEL §5).
- **Clock window:** 0..90000 for the feed; the hero handoff's 5 stages span `at` 1500..19000, reached by reader `stageIndex` steps (0..4).
- **Rest state:** `SpineBus` threads the 4 nodes; a Corveth handoff lane with 5 unlit ticks (dispatch/snapshot/pickup/receipt/clear); BridgeFeed ticker empty at t=0; schema-inspector toggle closed.
- **The trigger:** reader presses Step to advance the handoff one stage at a time.
- **Beat sequence:**
  1. dispatch `[ev#2 @1500ms]`: baton appears at claude_ai; tick 1 lights. "Corveth dispatched, phase: implement, roadmap PLAN.md."
  2. snapshot `[ev#3 @2200ms]`: baton pauses; snapshot icon flashes; references the "snapshot before takeover" pattern.
  3. pickup `[ev#4 @3000ms]`: baton reaches cc. Feed reveals `[ev#5 @3500ms -> activity 201]` "scaffolded the export pipeline" + cost tick `[ev#6 @4500ms +$0.03]`.
  4. receipt `[ev#28 @18500ms]`: call out the real 15.5s gap on-deck: "15s of mission work happened here - see it in Scene 4." Feed already shows ship `[ev#26 @17400ms -> activity 202]` SHIPPED.
  5. clear `[ev#29 @19000ms]`: final tick; lane reads cleared end to end.
- **Success / end state:** all 5 ticks lit, lane cleared, feed shows the Corveth trail. Takeaway (mono): "A handoff is a lease with a receipt, not a fire-and-forget."
- **Deep-panel hook:** the schema inspector reveals the 5 entity row shapes as inspectable synthetic JSON (synthetic content only).
- **Reduced-motion variant:** baton cuts node-to-node per step; ticks light instantly; feed rows appear without scroll/typewriter; particles off. Stepping is fully manual.
- **Copy notes:** snapshot beat may draw "snapshot before takeover" from the closed LESSONS/PATTERNS pool.

---

### Scene 3 — The Safety Layers (`/safety`, interaction: guardTrigger)
- **Reads:** `guard` events + closed `GUARD_MAP`. Fixture guard: `[ev#17 @11000ms, hard-deny, push-to-main, blocked, opened-a-branch]` (DATA-MODEL §5).
- **Clock window:** 0..90000. Only `push-to-main` has a real fixture event; the other 5 rule concepts resolve via the static `GUARD_MAP` lookup (labeled on-deck as menu-derived, not timeline-replayed).
- **Rest state:** concentric shield rings outer -> inner using the 7 `GUARD_LAYERS` (permission-mode, deny-list, pretooluse-hook, hard-deny, confidence-gate, verify-gate, integrity-floor); an acting-agent icon at center; a safe fabricated trigger menu (6 `RULE_CONCEPTS`) tucked aside.
- **The trigger:** reader opens the menu and picks a rule concept; default highlight is `push-to-main` (the fixture-grounded one).
- **Beat sequence:**
  1. Reader selects `push-to-main`.
  2. An ephemeral action indicator (matching `[ev#17]`) moves outward from center, inert through permission-mode, deny-list, pretooluse-hook.
  3. It hits `hard-deny`, which lights and holds. Mono label: "BLOCKED." Does not proceed.
  4. The agent adapts (not escalates): `opened-a-branch` renders as the agent rerouting to a branch glyph. "opened a branch." No privilege-escalation visual.
  5. Other concepts (e.g. `credential-read` -> deny-list / escalated-to-operator) replay via `GUARD_MAP`, labeled menu-derived.
- **Success / end state:** triggered ring settles held-lit; agent on its adapted path. Takeaway (mono): "Guards fire. The agent adapts. It never fights the wall."
- **Deep-panel hook:** all 7 layers in plain architectural language (SPEC 1.4) + the independence through-line.
- **Reduced-motion variant:** hard-deny ring is a static highlighted outline, not a strobe (well under SC 2.3.1 <=3-flash cap); reroute cuts instantly; menu is keyboard-operable; no autoplay.
- **Copy notes:** strictly descriptive, never exploit-flavored. Labels are the closed-vocabulary concept terms, never literal commands or bypass steps.

---

### Scene 4 — The Finale / fleet in motion (`/finale`, interaction: missionRun)
- **Reads:** `fanout`, `verify`, `ship`, `cost` for `missionId=1` + supporting `activity [ev26]` and `handoff [ev28,ev29]` (DATA-MODEL §5).
- **Clock window:** 6000..19000 (tEnd extended to 19000 so the handoff receipt/clear at 18500/19000 are included as the epilogue tail).
- **Rest state (at 6000ms):** cumulative render means the mission is already underway: dispatched to cc, handoff through pickup, `[ev5 @3500 -> activity 201]` "scaffolded the export pipeline" glows untagged, CostLedger already reads **$0.03** `[ev6]`. Three worktree lane slots sit dashed/empty; VerifyGate closed/neutral.
- **The trigger:** reader presses Play on the mission transport (`missionRun`, `playing false -> true`) - the scene's LOCAL play control, not the global scrubber - running the remaining arc (8000ms on).
- **Beat sequence:**
  1. **Fanout spawn** `[ev10 lane0 Sonnet, ev11 lane1 Sonnet @8000ms; ev12 lane2 mechanical @8200ms]`: three lanes snap open (`wt/corveth-0/1/2`), mono labels.
  2. **Run** `[ev14, ev15 @10000ms; ev16 @10200ms]`: all three lanes flip to active/pulsing.
  3. **Guard fires mid-run** `[ev17 @11000ms hard-deny/push-to-main -> opened-a-branch]`: shield flashes red then resolves to a branch icon. The mission rerouted, did not stop.
  4. **Cost during block-and-adapt** `[ev18 @11500 Sonnet +0.14; ev19 @12000 mechanical +0.01]`: ledger climbs to $0.18.
  5. **Converge** `[ev20, ev21 @14000ms; ev22 @14200ms]`: three lanes collapse into one commit line feeding the gate.
  6. **Verify attempt 1: BLOCK** `[ev23 @15000ms]`: gate slams red, bounces the commit back.
  7. **Cost from re-run** `[ev24 @15500 Sonnet +0.09]`: ledger to $0.27.
  8. **Verify attempt 2: PASS** `[ev25 @17000ms]`: gate flips green, opens.
  9. **SHIPPED reveal** `[ev26 @17400ms -> activity 202]`: "shipped the export pipeline" drops in with SHIPPED tag lit.
  10. **Ship ripple** `[ev27 @18000ms -> buildlog/corveth]`: ripple travels to a Notion glyph.
  11. **Epilogue: handoff resolves** `[ev28 @18500 receipt; ev29 @19000 clear]`: the lease from Scene 2 flips active -> cleared.
- **Success / end state:** one merged commit, SHIPPED glowing, ripple docked at Notion, lease cleared, CostLedger settled at **$0.27** (Sonnet $0.26 / mechanical $0.01, reconciles to `sc-1`). Mono: `SHIPPED -> buildlog/corveth · $0.27 TOTAL`.
- **Deep-panel hook:** Tier 2/3 fan-out mechanics - isolated worktrees per lane, a verify-before-done gate that can legitimately block and re-run, and why the mechanical (Codex) lane costs $0.01 against $0.26 of Sonnet reasoning on the same mission.
- **Reduced-motion variant:** lanes/commit line appear as discrete cut states; guard + gate communicate red/green by icon + mono text swap, not door-slam; autoplay off (mission sits paused until Play, also steppable); every state fully rendered as text.
- **Copy notes:** `LANE 0 · SONNET`, `LANE 2 · MECHANICAL`, `GUARD: HARD-DENY / PUSH-TO-MAIN -> OPENED A BRANCH`, `VERIFY ATTEMPT 1: BLOCK`, `VERIFY ATTEMPT 2: PASS`, `SESSION COST: $0.27 (MECHANICAL: $0.01)`.

---

### Scene 5 — The Hub (`/hub`, interaction: airlockStep over 3 stages)
- **Reads:** `hubflow` (artifact `draft-71`) + `freshness` (5 closed `SPOKES`) (DATA-MODEL §5).
- **Clock window:** 0..90000 (ambient, full-session).
- **Rest state (at 0ms):** honest empty state - all 5 freshness lights neutral pre-tick `unavailable` (mono label, no color guess); airlock at stage 0, empty.
- **The trigger:** two independent things. Ambient: the freshness rail ticks as the global clock advances. Reader-driven: click Step on the airlock (`airlockStep`, `stageIndex 0->1->2`) to walk the `draft-71` flow one stage per click.
- **Beat sequence:**
  - *Freshness rail (ambient):* `[ev13 @10000 bridge->fresh]`, `[ev30 @20000 event-bus->fresh]`, `[ev36 @35000 auditor->aging]`, `[ev41 @50000 overlay->stale]` (does not recover), `[ev45 @65000 evals-ledger->fresh]`, `[ev46 @70000 auditor->fresh]`.
  - *Airlock (reader-driven):*
    1. stage 0 draft `[ev37 @40000ms]`: a sealed `DRAFT-71` capsule appears in chamber 1.
    2. stage 1 approval `[ev38 @42000ms]`: capsule to chamber 2; an approval placard lights with a token-gate affordance (a locked slot the reader "inserts" a token into; UI affordance, not a real token).
    3. stage 2 send `[ev39 @44000ms]`: a send-window status chip shows open/closed; only with both satisfied does the capsule release outward, `draft-71` marked sent.
- **Success / end state:** `draft-71` cleared through all 3 chambers; rail reads bridge/event-bus/evals-ledger/auditor **fresh**, overlay still **stale** (deliberate honest imperfect end). Mono: `DRAFT -> APPROVAL -> SEND. NOTHING LEAVES WITHOUT A TOKEN.` + `ALERTS FIRE ONLY FROM FRESH DATA - OVERLAY STAYS DARK.`
- **Deep-panel hook:** the hub-and-spoke model - personal-ops never calls external APIs directly, each spoke is its own system of record read through an adapter, and the freshness state machine is why alerts only fire from fresh data (an aging/stale spoke goes quiet rather than lying).
- **Reduced-motion variant:** capsule cuts between chambers; freshness lights swap color instantly (state also always printed as mono text, never color-only); no ambient particles; airlock stepping requires an explicit click; rail advances only via the transport, paused by default.
- **Copy notes:** `DRAFT-71`, `APPROVAL PENDING - TOKEN REQUIRED`, `SEND WINDOW OPEN`, `BRIDGE: FRESH`, `AUDITOR: AGING` / `AUDITOR: FRESH`, `OVERLAY: STALE`.

---

### Coda (`/coda`, interaction: none)
- Short prose on paper. The claim (almost nobody has built a personal multi-agent operator OS at this depth) + the honesty note made explicit (everything shown is synthetic by construction) with a link to the guarantee. No timeline.

---

## Cross-scene coherence notes (preserve these)
- The 15.5s gap between the Scene-2 handoff pickup (`ev4 @3000`) and receipt (`ev28 @18500`) IS the Scene-4 mission. The two scenes share `handoffId 1` / `missionId 1`; do not "tidy" the gap away.
- Scene-4 cost math is numerically reconciled in the fixture: `0.03+0.14+0.01+0.09 = 0.27`, Sonnet `0.26` / mechanical `0.01` = `sessionCosts["sc-1"].modelBreakdown`. Preserve the asymmetry (the mechanical lane really is a fraction).
- Scene-5 `overlay` has no recovery tick after stale@50000 through 90000. The "stays dark" ending is a real fixture property, not a flourish; do not fix it to all-green.
