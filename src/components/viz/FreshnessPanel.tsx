import { SPOKES, type Spoke } from "../../data/vocab.ts";
import { formatClock } from "../../lib/format";
import type { SyntheticEvent } from "../../types/data.ts";
import type { VizProps } from "../../types/scene.ts";

type Freshness = Extract<SyntheticEvent, { kind: "freshness" }>;
type State = Freshness["state"];

const DOT: Record<State, string> = {
	fresh: "bg-ink-deck",
	aging: "bg-ink-deck-muted",
	stale: "bg-accent-deck",
	unavailable: "border border-deck-line bg-transparent",
};

/**
 * Scene 5: the spoke freshness rail. State is the latest freshness event
 * per spoke at t; pre-tick spokes read `unavailable` honestly rather than
 * guessing a color. State is ALWAYS printed as text (never color-only,
 * SPEC 2.5); the fresh dots breathe only when motion is on.
 */
export function FreshnessPanel({ events, reducedMotion }: VizProps) {
	const latest = new Map<Spoke, Freshness>();
	for (const e of events) {
		if (e.kind === "freshness") latest.set(e.spoke, e);
	}

	return (
		<div
			data-testid="freshness-panel"
			className="rounded-sm border border-deck-line p-4 font-instrument text-[11px]"
		>
			<p className="mb-3 text-[10px] uppercase tracking-[0.2em] text-ink-deck-muted">
				Spoke freshness · alerts fire only from fresh
			</p>
			<ul className="space-y-2">
				{SPOKES.map((spoke) => {
					const tick = latest.get(spoke);
					const state: State = tick?.state ?? "unavailable";
					return (
						<li
							key={spoke}
							data-testid={`spoke-${spoke}`}
							data-state={state}
							className="flex items-center gap-3"
						>
							<span
								aria-hidden="true"
								className={`h-2 w-2 rounded-full ${DOT[state]} ${
									state === "fresh" && !reducedMotion ? "animate-pulse" : ""
								}`}
							/>
							<span className="w-28 shrink-0 uppercase tracking-[0.1em] text-ink-deck">
								{spoke}
							</span>
							<span
								className={
									state === "stale" ? "text-accent-deck" : "text-ink-deck-muted"
								}
							>
								{state.toUpperCase()}
								{tick ? ` · T+${formatClock(tick.at)}` : " · no tick yet"}
							</span>
						</li>
					);
				})}
			</ul>
		</div>
	);
}
