/**
 * The only source of numbers for the diagrams. Everything here derives from
 * the shipped dataset, the closed vocabularies, and the manifest, so a
 * diagram cannot print a figure the artifact does not carry.
 */
import { architectureManifest } from "../data/architecture-manifest.ts";
import { dataset } from "../data/dataset.ts";
import {
	ADAPTATIONS,
	CODENAMES,
	GUARD_LAYERS,
	GUARD_MAP,
	RULE_CONCEPTS,
	SPOKES,
	TASK_CLASSES,
} from "../data/vocab.ts";
import type { SyntheticEvent } from "../types/data.ts";

type HandoffEvent = Extract<SyntheticEvent, { kind: "handoff" }>;
type GuardEvent = Extract<SyntheticEvent, { kind: "guard" }>;
type FreshnessEvent = Extract<SyntheticEvent, { kind: "freshness" }>;
type HubflowEvent = Extract<SyntheticEvent, { kind: "hubflow" }>;
type ShipEvent = Extract<SyntheticEvent, { kind: "ship" }>;

/** `1500` -> `T+1.5 s`; `40000` -> `T+40.0 s`. */
export function fmtT(ms: number): string {
	return `T+${(ms / 1000).toFixed(1)} s`;
}

/** Whole seconds between two clock times, one decimal: `15.5 s`. */
export function fmtGap(fromMs: number, toMs: number): string {
	return `${((toMs - fromMs) / 1000).toFixed(1)} s`;
}

export function handoffEvents(handoffId: number): HandoffEvent[] {
	return dataset.events.filter(
		(e): e is HandoffEvent => e.kind === "handoff" && e.handoffId === handoffId,
	);
}

/** Stage -> clock ms for one handoff, in stage order. */
export function handoffStageTimes(
	handoffId: number,
): Record<HandoffEvent["stage"], number> {
	const out = {} as Record<HandoffEvent["stage"], number>;
	for (const e of handoffEvents(handoffId)) out[e.stage] = e.at;
	return out;
}

export function heroHandoff() {
	const id = 1;
	const row = dataset.handoffs.find((h) => h.id === id);
	if (!row) throw new Error("handoff 1 missing from the dataset");
	return row;
}

export function shippedActivity() {
	const ship = dataset.events.find((e): e is ShipEvent => e.kind === "ship");
	if (!ship) throw new Error("no ship event in the dataset");
	const activity = dataset.activity.find((a) => a.id === ship.activityId);
	if (!activity) throw new Error("ship event points at a missing activity row");
	const reveal = dataset.events.find(
		(e) => e.kind === "activity" && e.activityId === ship.activityId,
	);
	if (!reveal) throw new Error("shipped activity has no reveal event");
	return { ship, activity, revealAt: reveal.at };
}

export function guardEvents(): GuardEvent[] {
	return dataset.events.filter((e): e is GuardEvent => e.kind === "guard");
}

export function freshnessTicks(): FreshnessEvent[] {
	return dataset.events.filter((e): e is FreshnessEvent => e.kind === "freshness");
}

export function hubflowStages(): HubflowEvent[] {
	return dataset.events.filter((e): e is HubflowEvent => e.kind === "hubflow");
}

export function datasetCounts() {
	return {
		events: dataset.events.length,
		activity: dataset.activity.length,
		handoffs: dataset.handoffs.length,
	};
}

export function vocabSizes() {
	return {
		codenames: CODENAMES.length,
		taskClasses: TASK_CLASSES.length,
		guardLayers: GUARD_LAYERS.length,
		ruleConcepts: RULE_CONCEPTS.length,
		adaptations: ADAPTATIONS.length,
		spokes: SPOKES.length,
	};
}

/** The generator seed as the dataset carries it, printed the way generate.ts spells it. */
export function seedHex(): string {
	return `0x${dataset.meta.seed.toString(16).padStart(8, "0")}`;
}

/** Rule concept -> the layer that catches it and the adaptation that follows, in vocab order. */
export function guardRows() {
	return RULE_CONCEPTS.map((rule) => ({ rule, ...GUARD_MAP[rule] }));
}

/** Short revision of a public manifest source, for a verify line. */
export function sourceRevision(sourceId: string): string {
	const source = architectureManifest.sources.find((s) => s.id === sourceId);
	if (!source?.revision) throw new Error(`source ${sourceId} has no pinned revision`);
	return source.revision.slice(0, 7);
}
