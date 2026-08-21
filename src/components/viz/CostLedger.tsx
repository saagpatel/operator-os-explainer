import { formatClock } from "../../lib/format";
import type { SyntheticEvent } from "../../types/data.ts";
import type { VizProps } from "../../types/scene.ts";

type Cost = Extract<SyntheticEvent, { kind: "cost" }>;

const round2 = (n: number) => Math.round(n * 100) / 100;

/**
 * Scene 4: the session cost ledger. Tallies the hero mission's cost deltas
 * as they land and, at mission end, reconciles against the sessionCost row
 * (the invariant the closure test proves). The Sonnet/mechanical asymmetry
 * IS the cost play; preserve it, never average it away.
 */
export function CostLedger({ events, dataset }: VizProps) {
	const costs = events.filter(
		(e): e is Cost => e.kind === "cost" && e.missionId === 1,
	);
	const total = round2(costs.reduce((acc, c) => acc + c.deltaUsd, 0));
	const byModel = new Map<string, number>();
	for (const c of costs)
		byModel.set(c.model, round2((byModel.get(c.model) ?? 0) + c.deltaUsd));
	const session = dataset.sessionCosts.find((sc) => sc.missionId === 1);
	const reconciled = session !== undefined && total === session.costUsd;
	const max = Math.max(...[...byModel.values()], 0.01);

	return (
		<div
			data-testid="cost-ledger"
			className="rounded-sm border border-deck-line p-4 font-instrument text-[11px] leading-relaxed"
		>
			<p className="mb-2 text-[10px] uppercase tracking-[0.2em] text-ink-deck-muted">
				Session cost · sc-1 · Corveth
			</p>

			{costs.length === 0 ? (
				<p className="text-ink-deck-muted">no spend yet</p>
			) : (
				<div className="space-y-0.5 text-ink-deck-muted">
					{costs.map((c) => (
						<div key={c.id} className="flex justify-between tabular-nums">
							<span>
								T+{formatClock(c.at)} {c.model.toUpperCase()}
							</span>
							<span className="text-ink-deck">+${c.deltaUsd.toFixed(2)}</span>
						</div>
					))}
				</div>
			)}

			<div className="mt-3 flex items-baseline justify-between border-t border-deck-line pt-2">
				<span className="uppercase tracking-[0.14em] text-ink-deck-muted">
					Total
				</span>
				<span
					data-testid="ledger-total"
					className="text-[16px] tabular-nums text-accent-deck"
				>
					${total.toFixed(2)}
				</span>
			</div>

			{byModel.size > 0 ? (
				<div className="mt-2 space-y-1">
					{[...byModel.entries()].map(([model, usd]) => (
						<div key={model} className="flex items-center gap-2">
							<span className="w-24 shrink-0 uppercase text-ink-deck-muted">
								{model}
							</span>
							<span
								aria-hidden="true"
								className="h-1.5 bg-accent-deck"
								style={{
									width: `${Math.max(3, (usd / max) * 120)}px`,
									opacity: model === "mechanical" ? 0.6 : 1,
								}}
							/>
							<span className="tabular-nums text-ink-deck">
								${usd.toFixed(2)}
							</span>
						</div>
					))}
				</div>
			) : null}

			{reconciled ? (
				<p
					data-testid="ledger-reconciled"
					className="mt-3 border-t border-deck-line pt-2 text-[10px] uppercase tracking-[0.12em] text-ink-deck-muted"
				>
					reconciles to sessionCost sc-1 · the mechanical lane really is a
					fraction
				</p>
			) : null}
		</div>
	);
}
