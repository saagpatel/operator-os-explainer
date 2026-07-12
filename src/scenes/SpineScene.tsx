import { useMemo } from "react";
import { useSessionClock } from "../clock/SessionClockProvider.tsx";
import { useAutoSeek } from "../clock/useAutoSeek.ts";
import { ProseCard } from "../components/shell/ProseCard";
import { SceneFrame } from "../components/shell/SceneFrame";
import { BridgeFeed } from "../components/viz/BridgeFeed";
import { HERO_STAGES, SpineBus } from "../components/viz/SpineBus";
import { formatClock } from "../lib/format";
import { SCENES } from "./index.ts";

/** The hero handoff's stage times in the fixture (handoffId 1, Corveth). */
const STAGE_AT = [1_500, 2_200, 3_000, 18_500, 19_000] as const;

const STAGE_NOTES = [
	"The Corveth handoff waits at claude_ai. Claude.ai has no filesystem; a handoff row is its only write path into the fleet.",
	"Dispatched: phase implement, roadmap PLAN.md. The row is on the bus, visible to every system.",
	"Snapshot saved before takeover. The next system reads state first, then acts: snapshot before takeover.",
	"Claude Code claims the lease. The branch is the lease; the handoff row records who holds it.",
	"Receipt acknowledged. 15 seconds of mission work happened inside this gap - watch it run in Scene 04.",
	"Cleared end to end. Both sides acknowledged; the lease is closed where it was opened.",
] as const;

/**
 * Scene 2: the spine. Stepping the handoff SCRUBS THE GLOBAL CLOCK to each
 * stage's event time, so the stage ticks, the bridge feed, and manual
 * scrubbing can never disagree: stageIndex is DERIVED from t, not stored.
 */
export function SpineScene() {
	const config = SCENES.spine;
	const clock = useSessionClock();
	useAutoSeek(config.tStart);

	const events = useMemo(
		() =>
			clock
				.eventsUpTo(clock.t)
				.filter((e) => config.eventKinds.includes(e.kind)),
		[clock, clock.t, config.eventKinds],
	);

	const litCount = STAGE_AT.filter((at) => at <= clock.t).length;
	const complete = litCount === STAGE_AT.length;
	const note = STAGE_NOTES[litCount];

	const step = () => {
		if (litCount < STAGE_AT.length) clock.scrub(STAGE_AT[litCount]);
	};

	return (
		<SceneFrame
			config={config}
			deepPanelExtra={
				<div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
					{(
						[
							["activity", clock.dataset.activity[0]],
							["handoff", clock.dataset.handoffs[0]],
							["snapshot", clock.dataset.snapshots[0]],
							["cost", clock.dataset.sessionCosts[0]],
							["section", clock.dataset.sections[0]],
						] as const
					).map(([label, sample]) => (
						<div key={label} className="min-w-0">
							<p className="mb-1 font-instrument text-[10px] uppercase tracking-[0.18em] text-accent-deck">
								{label}
							</p>
							<pre className="overflow-x-auto rounded-sm border border-deck-line bg-deck-raised/60 p-2 font-instrument text-[10px] leading-relaxed text-ink-deck-muted">
								{JSON.stringify(sample, null, 2)}
							</pre>
						</div>
					))}
				</div>
			}
		>
			<div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_320px] lg:items-start">
				<div className="rounded-sm border border-deck-line bg-deck-raised/40 p-2">
					<SpineBus
						events={events}
						t={clock.t}
						interaction={{ kind: "handoffRun", stageIndex: litCount }}
						reducedMotion={clock.reducedMotion}
						dataset={clock.dataset}
					/>

					<div className="flex flex-wrap items-center gap-3 border-t border-deck-line px-3 py-3">
						<button
							type="button"
							onClick={step}
							disabled={complete}
							aria-label="Step the handoff to its next stage"
							className={`rounded-sm border px-3 py-1.5 font-instrument text-[11px] uppercase tracking-[0.12em] ${
								complete
									? "border-deck-line text-ink-deck-muted opacity-40"
									: "border-ink-deck-muted text-ink-deck hover:border-accent-deck hover:text-accent-deck"
							}`}
						>
							Step handoff {litCount}/{HERO_STAGES.length}
						</button>
						<span className="font-instrument text-[10px] tabular-nums text-ink-deck-muted">
							{litCount < STAGE_AT.length
								? `next stage lands at T+${formatClock(STAGE_AT[litCount])}`
								: "lease cleared"}
						</span>
					</div>
				</div>

				<div className="flex flex-col gap-4">
					<ProseCard label="scene 02 · the spine">
						<p>{config.hook}</p>
						<p className="mt-2">
							Watch one handoff cross it: dispatched, snapshotted, claimed,
							receipted, cleared. Step it stage by stage; the whole console
							follows the same clock.
						</p>
					</ProseCard>

					<div
						aria-live="polite"
						data-testid="stage-note"
						className="rounded-sm border border-deck-line p-4 font-instrument text-[12px] leading-relaxed text-ink-deck"
					>
						{note}
						{complete ? (
							<p
								data-testid="spine-takeaway"
								className="mt-3 border-t border-deck-line pt-2 uppercase tracking-[0.14em] text-accent-deck"
							>
								A handoff is a lease with a receipt, not a fire-and-forget.
							</p>
						) : null}
					</div>

					<div className="rounded-sm border border-deck-line p-3">
						<p className="mb-2 font-instrument text-[10px] uppercase tracking-[0.2em] text-ink-deck-muted">
							Bridge feed · live
						</p>
						<BridgeFeed
							events={events}
							t={clock.t}
							interaction={{ kind: "handoffRun", stageIndex: litCount }}
							reducedMotion={clock.reducedMotion}
							dataset={clock.dataset}
						/>
					</div>
				</div>
			</div>
		</SceneFrame>
	);
}
