import { formatClock } from "../../lib/format";
import type { VizProps } from "../../types/scene.ts";

type FeedRow =
	| {
			at: number;
			kind: "activity";
			source: string;
			project: string;
			summary: string;
			tags: string[];
	  }
	| {
			at: number;
			kind: "cost";
			sessionCostId: string;
			model: string;
			deltaUsd: number;
	  };

/**
 * The live bridge feed: activity rows reveal as their events pass, cost
 * ticks interleave. Newest first, plain mono, no typewriter theatrics; the
 * information IS the rows, so reduced motion changes nothing here.
 */
export function BridgeFeed({ events, dataset }: VizProps) {
	const rows: FeedRow[] = [];
	for (const e of events) {
		if (e.kind === "activity") {
			const a = dataset.activity.find((x) => x.id === e.activityId);
			if (a)
				rows.push({
					at: e.at,
					kind: "activity",
					source: a.source,
					project: a.projectName,
					summary: a.summary,
					tags: a.tags,
				});
		} else if (e.kind === "cost") {
			rows.push({
				at: e.at,
				kind: "cost",
				sessionCostId: e.sessionCostId,
				model: e.model,
				deltaUsd: e.deltaUsd,
			});
		}
	}
	rows.reverse();

	return (
		<div
			aria-label="Bridge activity feed"
			className="max-h-[300px] overflow-y-auto font-instrument text-[11px] leading-[1.7] text-ink-deck-muted"
		>
			{rows.length === 0 ? (
				<p className="text-ink-deck-muted">
					feed empty at T+00:00.000 · press play or step the handoff
				</p>
			) : (
				rows.map((row) => (
					<div
						key={`${row.kind}-${row.at}`}
						className="border-b border-deck-line/40 py-1 last:border-b-0"
					>
						{row.kind === "activity" ? (
							<>
								<div className="flex flex-wrap items-center gap-x-2">
									<span className="tabular-nums">T+{formatClock(row.at)}</span>
									<span className="text-ink-deck">
										{row.source.toUpperCase()}
									</span>
									<span>· {row.project}</span>
									{row.tags.map((tag) => (
										<span
											key={tag}
											className={
												tag === "SHIPPED"
													? "border border-accent-deck px-1 text-[9px] text-accent-deck"
													: "border border-deck-line px-1 text-[9px]"
											}
										>
											{tag}
										</span>
									))}
								</div>
								<div className="pl-2 text-ink-deck">{row.summary}</div>
							</>
						) : (
							<div className="flex flex-wrap items-center gap-x-2">
								<span className="tabular-nums">T+{formatClock(row.at)}</span>
								<span>COST</span>
								<span>· {row.sessionCostId}</span>
								<span className="text-ink-deck">
									{row.model.toUpperCase()} +${row.deltaUsd.toFixed(2)}
								</span>
							</div>
						)}
					</div>
				))
			)}
		</div>
	);
}
