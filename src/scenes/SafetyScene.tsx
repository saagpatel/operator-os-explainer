import { useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { useSessionClock } from "../clock/SessionClockProvider.tsx";
import { useAutoSeek } from "../clock/useAutoSeek.ts";
import { ProseCard } from "../components/shell/ProseCard";
import { SceneFrame } from "../components/shell/SceneFrame";
import { GuardShields } from "../components/viz/GuardShields";
import {
	type Adaptation,
	GUARD_LAYERS,
	GUARD_MAP,
	RULE_CONCEPTS,
	type RuleConcept,
} from "../data/vocab.ts";
import { formatClock } from "../lib/format";
import { SCENES } from "./index.ts";

/**
 * Hand-authored DESCRIPTIVE labels (SPEC 2.3 non-negotiable): each names a
 * class of would-be-dangerous action in plain architectural language.
 * Never command strings, never how-to detail.
 */
const RULE_LABELS: Record<RuleConcept, string> = {
	"push-to-main": "push straight to the main branch",
	"credential-read": "read a credential directory",
	"non-local-db-write": "write to a non-local database",
	"harness-self-mutate": "edit its own guard configuration",
	"deep-home-delete": "bulk-delete near the home root",
	"unverified-complete": "call work done without verifying",
};

const ADAPTATION_STORY: Record<Adaptation, string> = {
	"opened-a-branch":
		"The agent opened a feature branch and did the work there instead.",
	"escalated-to-operator":
		"The agent stopped and put the decision in front of the operator.",
	reworded:
		"The agent rephrased the operation to stay inside the allowed surface.",
	rerouted: "The agent took a safer path to the same goal.",
	"ran-verify-first":
		"The agent ran the verify gate first, then finished the claim.",
};

const LAYER_NOTES: Record<(typeof GUARD_LAYERS)[number], string> = {
	"permission-mode": "an intent level chosen at launch, before any work runs",
	"deny-list": "a static list of forbidden patterns, checked before execution",
	"pretooluse-hook": "deterministic gates that fire before every tool call",
	"hard-deny": "a small floor of rules no instruction can override",
	"confidence-gate": "below a confidence threshold, ask instead of act",
	"verify-gate": "compile and test must pass before work counts as done",
	"integrity-floor": "verifies the guards themselves exist and are untampered",
};

/**
 * Scene 3: the defense story. The reader picks a fabricated risky action
 * from a closed menu; the matching layer lights, blocks, and holds; the
 * agent visibly adapts. Selections are menu-derived UI state (labeled as
 * such); only push-to-main also has a timeline replay event to corroborate.
 */
export function SafetyScene() {
	const config = SCENES.safety;
	const clock = useSessionClock();
	useAutoSeek(config.tStart);

	// ?rule= deep-links a pre-selected trigger (shareable state, mirrors ?chips=)
	const [params] = useSearchParams();
	const [selectedRule, setSelectedRule] = useState<RuleConcept | null>(() => {
		const q = params.get("rule");
		return q !== null && (RULE_CONCEPTS as readonly string[]).includes(q)
			? (q as RuleConcept)
			: null;
	});

	const events = useMemo(
		() =>
			clock
				.eventsUpTo(clock.t)
				.filter((e) => config.eventKinds.includes(e.kind)),
		[clock, clock.t, config.eventKinds],
	);

	const blocked = selectedRule ? GUARD_MAP[selectedRule] : null;
	const replay = selectedRule
		? clock
				.eventsOfKind("guard", clock.t)
				.find((e) => e.ruleConcept === selectedRule)
		: undefined;

	return (
		<SceneFrame
			config={config}
			deepPanelExtra={
				<dl className="grid gap-x-8 gap-y-2 font-instrument text-[11px] sm:grid-cols-2">
					{GUARD_LAYERS.map((layer, i) => (
						<div key={layer} className="flex gap-3">
							<dt className="w-36 shrink-0 text-ink-deck">
								{i + 1}. {layer}
							</dt>
							<dd className="text-ink-deck-muted">{LAYER_NOTES[layer]}</dd>
						</div>
					))}
				</dl>
			}
		>
			<div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_320px] lg:items-start">
				<div className="rounded-sm border border-deck-line bg-deck-raised/40 p-2">
					<GuardShields
						events={events}
						t={clock.t}
						interaction={{ kind: "guardTrigger", selectedRule }}
						reducedMotion={clock.reducedMotion}
						dataset={clock.dataset}
					/>

					<div className="border-t border-deck-line px-3 py-3">
						<p className="mb-2 font-instrument text-[10px] uppercase tracking-[0.2em] text-ink-deck-muted">
							Trigger a would-be-dangerous action (all fabricated)
						</p>
						<div className="flex flex-wrap gap-2">
							{RULE_CONCEPTS.map((rule) => (
								<button
									key={rule}
									type="button"
									onClick={() => setSelectedRule(rule)}
									aria-pressed={selectedRule === rule}
									className={`min-h-11 rounded-sm border px-3 py-1.5 text-left font-instrument text-[11px] sm:min-h-0 ${
										selectedRule === rule
											? "border-accent-deck text-accent-deck"
											: "border-deck-line text-ink-deck hover:border-ink-deck-muted"
									}`}
								>
									{RULE_LABELS[rule]}
								</button>
							))}
						</div>
					</div>
				</div>

				<div className="flex flex-col gap-4">
					<ProseCard label="scene 03 · the safety layers">
						<p>{config.hook}</p>
						<p className="mt-2">
							This is why full autonomy is safe here: every layer is
							independent, and a blocked action makes the agent adapt rather
							than escalate. Try one.
						</p>
					</ProseCard>

					<div
						aria-live="polite"
						data-testid="guard-outcome"
						className="min-h-[150px] rounded-sm border border-deck-line p-4 font-instrument text-[12px] leading-relaxed"
					>
						{selectedRule && blocked ? (
							<>
								<p className="text-ink-deck">
									attempt: {RULE_LABELS[selectedRule]}
								</p>
								<p className="mt-1 text-accent-deck">
									blocked by: {blocked.layer}
								</p>
								<p className="mt-1 text-ink-deck">
									{ADAPTATION_STORY[blocked.adaptation]}
								</p>
								<p className="mt-2 text-ink-deck-muted">
									{replay
										? `replay corroborates at T+${formatClock(replay.at)}`
										: "menu-derived demonstration · not a timeline event"}
								</p>
								<p
									data-testid="safety-takeaway"
									className="mt-3 border-t border-deck-line pt-2 uppercase tracking-[0.14em] text-accent-deck"
								>
									Guards fire. The agent adapts. It never fights the wall.
								</p>
							</>
						) : (
							<p className="text-ink-deck-muted">
								Pick an action from the menu. The layer that owns it lights,
								blocks, and holds; then watch what the agent does instead.
							</p>
						)}
					</div>
				</div>
			</div>
		</SceneFrame>
	);
}
