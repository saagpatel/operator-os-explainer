import { useEffect, useMemo, useState } from "react";
import { useSessionClock } from "../clock/SessionClockProvider.tsx";
import { useAutoSeek } from "../clock/useAutoSeek.ts";
import { ProseCard } from "../components/shell/ProseCard";
import { SceneFrame } from "../components/shell/SceneFrame";
import { CostLedger } from "../components/viz/CostLedger";
import { VerifyGate } from "../components/viz/VerifyGate";
import { WorktreeSwarm } from "../components/viz/WorktreeSwarm";
import { SCENES } from "./index.ts";

const MISSION_END = 19_000;
const MISSION_START = 6_000;

/** The mission narration, keyed by clock position (storyboard beats). */
function beat(t: number): string {
	if (t < 8_000)
		return "The lead is scoping lanes. Handoff picked up, first activity logged, ledger already ticking.";
	if (t < 10_000)
		return "Fan-out: three worktrees snap open, one per scoped lane. No two writers share a tree.";
	if (t < 11_000) return "All three lanes running in parallel.";
	if (t < 14_000)
		return "A guard fired mid-run: push-to-main hit the hard-deny floor. The agent opened a branch and the mission never stopped.";
	if (t < 15_000)
		return "Converge: three lanes collapse into one mission commit.";
	if (t < 17_000)
		return "Verify attempt 1: BLOCK. The gate bounced the commit back. That is the gate doing its job.";
	if (t < 17_400) return "Verify attempt 2: PASS. The gate opens.";
	if (t < 18_000) return "SHIPPED: the tagged activity drops into the feed.";
	if (t < 18_500)
		return "The SHIPPED tag carries a sync obligation: rippling out to the external build log.";
	return "Receipt acknowledged, lease cleared. Mission complete at $0.27.";
}

/**
 * Scene 4, the finale: the whole system orchestrating one mission. The
 * RUN MISSION control is the scene's local missionRun interaction: it
 * drives the global clock through the 6s..19s arc and pauses at mission
 * end. Never autoplays; fully steppable; deterministic under scrubbing.
 */
export function FinaleScene() {
	const config = SCENES.finale;
	const clock = useSessionClock();
	useAutoSeek(config.tStart);

	const [missionRunning, setMissionRunning] = useState(false);
	useEffect(() => {
		if (missionRunning && clock.t >= MISSION_END) {
			clock.pause();
			setMissionRunning(false);
		}
	}, [clock, clock.t, missionRunning]);

	const events = useMemo(
		() => clock.missionEvents(1, Math.min(clock.t, MISSION_END)),
		[clock, clock.t],
	);

	const complete = clock.t >= MISSION_END;
	const runMission = () => {
		if (clock.playing) {
			clock.pause();
			setMissionRunning(false);
			return;
		}
		if (complete) clock.scrub(MISSION_START);
		setMissionRunning(true);
		clock.play();
	};

	const vizProps = {
		events,
		t: clock.t,
		interaction: { kind: "missionRun", playing: missionRunning } as const,
		reducedMotion: clock.reducedMotion,
		dataset: clock.dataset,
	};

	return (
		<SceneFrame config={config}>
			<div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_300px] lg:items-start">
				<div className="rounded-sm border border-deck-line bg-deck-raised/40 p-2">
					<div className="flex flex-col md:flex-row">
						<div className="min-w-0 flex-[3]">
							<WorktreeSwarm {...vizProps} />
						</div>
						<div className="min-w-0 flex-[2] border-t border-deck-line md:border-l md:border-t-0">
							<VerifyGate {...vizProps} />
						</div>
					</div>

					<div className="flex flex-wrap items-center gap-3 border-t border-deck-line px-3 py-3">
						<button
							type="button"
							onClick={runMission}
							aria-label={
								clock.playing
									? "Pause the mission"
									: complete
										? "Replay the mission"
										: "Run the mission"
							}
							className="rounded-sm border border-accent-deck px-4 py-1.5 font-instrument text-[11px] uppercase tracking-[0.14em] text-accent-deck hover:bg-deck"
						>
							{clock.playing
								? "Pause"
								: complete
									? "Replay mission"
									: "Run mission"}
						</button>
						<span
							data-testid="mission-beat"
							aria-live="polite"
							className="min-w-0 flex-1 font-instrument text-[11px] leading-snug text-ink-deck-muted"
						>
							{beat(clock.t)}
						</span>
					</div>
				</div>

				<div className="flex flex-col gap-4">
					<ProseCard label="scene 04 · the fleet in motion">
						<p>{config.hook}</p>
						<p className="mt-2">
							Everything the last three scenes taught, happening at once. Run
							it, or step through event by event.
						</p>
					</ProseCard>

					<CostLedger {...vizProps} />

					{complete ? (
						<p
							data-testid="finale-takeaway"
							className="rounded-sm border border-deck-line p-4 font-instrument text-[11px] uppercase tracking-[0.14em] text-accent-deck"
						>
							Shipped -&gt; buildlog/corveth · $0.27 total · mechanical $0.01
						</p>
					) : null}
				</div>
			</div>
		</SceneFrame>
	);
}
