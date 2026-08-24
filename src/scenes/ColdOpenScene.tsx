import { useEffect, useMemo, useRef, useState } from "react";
import { NavLink } from "react-router";
import { useSessionClock } from "../clock/SessionClockProvider.tsx";
import { useAutoSeek } from "../clock/useAutoSeek.ts";
import { SceneFrame } from "../components/shell/SceneFrame";
import { ColdOpen } from "../components/viz/ColdOpen";
import { SCENES } from "./index.ts";

const OPEN_END = 18_000;

function caption(t: number): string {
	if (t < 800) return "An operator instruction drops in.";
	if (t < 3_500)
		return "Routed by gravity to Claude Code. The handoff crosses the spine: dispatched, snapshotted, claimed.";
	if (t < 8_000)
		return "Claude Code scopes the mission. The ledger is already ticking.";
	if (t < 10_000) return "Fan-out: three isolated worktrees snap open.";
	if (t < 11_000) return "Lanes run in parallel.";
	if (t < 14_000)
		return "A guard fires mid-run. The agent adapts and keeps going.";
	if (t < 15_000) return "Converge: one mission commit.";
	if (t < 17_000) return "Verify says no. The commit bounces back.";
	if (t < 17_400) return "Verify passes on attempt two.";
	if (t < 18_000) return "SHIPPED.";
	return "Synced to the build log. That was the whole OS in fifteen seconds.";
}

/**
 * Scene 0: the trailer. Autoplays the Corveth arc once on load with the
 * always-visible Pause in the transport (SC 2.2.2), settles at 18s, and
 * invites the scroll. Under reduced motion it never autoplays: it seeks to
 * the final composed state and offers the explore invite immediately.
 */
export function ColdOpenScene() {
	const config = SCENES[""];
	const clock = useSessionClock();
	useAutoSeek(config.tStart);

	const started = useRef(false);
	const [opening, setOpening] = useState(false);
	useEffect(() => {
		if (started.current) return;
		started.current = true;
		if (clock.reducedMotion) {
			clock.scrub(OPEN_END); // final composed state, statically
		} else {
			setOpening(true);
			clock.play();
		}
	}, [clock.play, clock.reducedMotion, clock.scrub]);
	useEffect(() => {
		if (opening && clock.t >= OPEN_END) {
			clock.pause();
			setOpening(false);
		}
	}, [clock.pause, clock.t, opening]);

	const events = useMemo(
		() => clock.missionEvents(1, Math.min(clock.t, OPEN_END)),
		[clock, clock.t],
	);
	const settled = clock.t >= OPEN_END;

	return (
		<SceneFrame config={config}>
			<div className="rounded-sm border border-deck-line bg-deck-raised/40 p-2">
				<div className="relative">
					<ColdOpen
						events={events}
						t={clock.t}
						interaction={{ kind: "none" }}
						reducedMotion={clock.reducedMotion}
						dataset={clock.dataset}
					/>

					{/* the dropped operator instruction */}
					<div className="pointer-events-none absolute left-4 top-3 rounded-sm border border-deck-line bg-deck px-3 py-2 font-instrument text-[11px] text-ink-deck">
						<span className="text-accent-deck">&gt;</span> {config.hook}
					</div>
				</div>

				<div className="flex min-h-[58px] flex-wrap items-center gap-4 border-t border-deck-line px-3 py-3">
					<p
						data-testid="open-caption"
						aria-live="polite"
						className="min-w-0 flex-1 font-instrument text-[12px] leading-snug text-ink-deck"
					>
						{caption(clock.t)}
					</p>
					{settled ? (
						<NavLink
							to="/fleet"
							data-testid="explore-invite"
							className="rounded-sm border border-accent-deck px-4 py-2 font-instrument text-[11px] uppercase tracking-[0.16em] text-accent-deck hover:bg-deck"
						>
							Explore each layer -&gt;
						</NavLink>
					) : null}
				</div>
			</div>
		</SceneFrame>
	);
}
