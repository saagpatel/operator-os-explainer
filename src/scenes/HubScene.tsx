import { useMemo } from "react";
import { useSessionClock } from "../clock/SessionClockProvider.tsx";
import { useAutoSeek } from "../clock/useAutoSeek.ts";
import { ProseCard } from "../components/shell/ProseCard";
import { SceneFrame } from "../components/shell/SceneFrame";
import { AirlockFlow } from "../components/viz/AirlockFlow";
import { FreshnessPanel } from "../components/viz/FreshnessPanel";
import { formatClock } from "../lib/format";
import { SCENES } from "./index.ts";

/** The draft-71 hubflow stage times in the fixture. */
const STAGE_AT = [40_000, 42_000, 44_000] as const;

const STAGE_NOTES = [
	"The airlock is empty. Outbound work starts life as a draft artifact, never a live send.",
	"DRAFT-71 sealed in chamber one. It is an artifact under review, not a message in flight.",
	"Chamber two: the approval placard lights. The confirmation token is operator-minted, outside the agent's reach. Nothing self-approves.",
	"Send window open, token accepted: DRAFT-71 releases. Every externally visible action was a reviewed, token-gated event.",
] as const;

/**
 * Scene 5: the hub. Same unifying trick as the spine: stepping the airlock
 * scrubs the global clock to each hubflow event, so the freshness rail
 * advances honestly alongside (and the overlay spoke's stale ending is a
 * real fixture property, deliberately never fixed to all-green).
 */
export function HubScene() {
	const config = SCENES.hub;
	const clock = useSessionClock();
	useAutoSeek(config.tStart);

	const events = useMemo(
		() =>
			clock
				.eventsUpTo(clock.t)
				.filter((e) => config.eventKinds.includes(e.kind)),
		[clock, clock.t, config.eventKinds],
	);

	const stageCount = STAGE_AT.filter((at) => at <= clock.t).length;
	const complete = stageCount === STAGE_AT.length;
	const step = () => {
		if (stageCount < STAGE_AT.length) clock.scrub(STAGE_AT[stageCount]);
	};
	const overlayStale = clock
		.eventsOfKind("freshness", clock.t)
		.some((e) => e.spoke === "overlay" && e.state === "stale");

	const vizProps = {
		events,
		t: clock.t,
		interaction: { kind: "airlockStep", stageIndex: stageCount } as const,
		reducedMotion: clock.reducedMotion,
		dataset: clock.dataset,
	};

	return (
		<SceneFrame config={config}>
			<div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_320px] lg:items-start">
				<div className="rounded-sm border border-deck-line bg-deck-raised/40 p-2">
					<AirlockFlow {...vizProps} />

					<div className="flex flex-wrap items-center gap-3 border-t border-deck-line px-3 py-3">
						<button
							type="button"
							onClick={step}
							disabled={complete}
							aria-label="Step the draft through the next airlock chamber"
							className={`rounded-sm border px-3 py-1.5 font-instrument text-[11px] uppercase tracking-[0.12em] ${
								complete
									? "border-deck-line text-ink-deck-muted opacity-40"
									: "border-ink-deck-muted text-ink-deck hover:border-accent-deck hover:text-accent-deck"
							}`}
						>
							Step airlock {stageCount}/3
						</button>
						<span
							data-testid="airlock-note"
							aria-live="polite"
							className="min-w-0 flex-1 font-instrument text-[11px] leading-snug text-ink-deck-muted"
						>
							{STAGE_NOTES[stageCount]}
							{stageCount < STAGE_AT.length
								? ` (next at T+${formatClock(STAGE_AT[stageCount])})`
								: ""}
						</span>
					</div>
				</div>

				<div className="flex flex-col gap-4">
					<ProseCard label="scene 05 · the hub">
						<p>{config.hook}</p>
						<p className="mt-2">
							Read-only views are free. Anything that leaves the machine is
							drafted, reviewed, token-gated, and released through a timed
							window. Step a message through.
						</p>
					</ProseCard>

					<FreshnessPanel {...vizProps} />

					{complete ? (
						<p
							data-testid="hub-takeaway"
							className="rounded-sm border border-deck-line p-4 font-instrument text-[11px] uppercase leading-relaxed tracking-[0.12em] text-accent-deck"
						>
							Draft -&gt; approval -&gt; send. Nothing leaves without a token.
						</p>
					) : null}
					{overlayStale ? (
						<p
							data-testid="overlay-stale-note"
							className="font-instrument text-[10px] uppercase tracking-[0.12em] text-ink-deck-muted"
						>
							Alerts fire only from fresh data - overlay stays dark.
						</p>
					) : null}
				</div>
			</div>
		</SceneFrame>
	);
}
