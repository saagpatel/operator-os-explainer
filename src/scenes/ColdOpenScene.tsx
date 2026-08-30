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
			<section
				aria-labelledby="first-visit-briefing-title"
				data-testid="first-visit-briefing"
				className="mb-4 rounded-sm border border-deck-line bg-deck-raised/40"
			>
				<div className="border-b border-deck-line px-3 py-2.5 sm:px-4 sm:py-3">
					<h2
						id="first-visit-briefing-title"
						className="font-instrument text-[11px] uppercase tracking-[0.2em] text-accent-deck"
					>
						First-visit briefing
					</h2>
				</div>

				<dl className="grid divide-y divide-deck-line md:grid-cols-3 md:divide-x md:divide-y-0">
					<div className="p-3 sm:p-4">
						<dt className="font-instrument text-[10px] uppercase tracking-[0.18em] text-ink-deck-muted">
							What it is
						</dt>
						<dd className="mt-2 text-sm leading-relaxed text-ink-deck">
							A personal multi-agent Operator OS routes work to specialist
							systems through shared state and closes the loop.
						</dd>
					</div>

					<div className="p-3 sm:p-4">
						<dt className="font-instrument text-[10px] uppercase tracking-[0.18em] text-ink-deck-muted">
							Why it matters
						</dt>
						<dd className="mt-2 text-sm leading-relaxed text-ink-deck">
							This console maps real architecture with deterministic synthetic
							data. Evidence defines what is proven; authority defines what the
							system may do. Separating them prevents invented proof or permission.
						</dd>
					</div>

					<div className="flex flex-col items-start p-3 sm:p-4">
						<dt className="font-instrument text-[10px] uppercase tracking-[0.18em] text-ink-deck-muted">
							Do next
						</dt>
						<dd className="mt-2 flex flex-1 flex-col items-start text-sm leading-relaxed text-ink-deck">
							<span>Follow the system from routing to its outbound airlock.</span>
							<NavLink
								to="/fleet"
								data-testid="explore-invite"
								className="mt-3 inline-flex min-h-11 items-center rounded-sm border border-accent-deck px-4 py-2 font-instrument text-[11px] uppercase tracking-[0.16em] text-accent-deck hover:bg-deck sm:min-h-0"
							>
								Start with routing -&gt;
							</NavLink>
						</dd>
					</div>
				</dl>
			</section>

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
						<span className="font-instrument text-[10px] uppercase tracking-[0.14em] text-accent-deck">
							Replay complete · next stop: routing
						</span>
					) : null}
				</div>
			</div>
		</SceneFrame>
	);
}
