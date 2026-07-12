/**
 * Pure event selectors over the sorted timeline (DATA-MODEL §5).
 * Canonical render rule: a scene at clock t renders ALL events with at <= t
 * (cumulative, monotonic). Known-value assertions live in selectors.test.ts.
 */
import type { SyntheticEvent } from "../types/data.ts";

/** Index of the first event with at > t (events sorted ascending by at). */
function upperBound(events: readonly SyntheticEvent[], t: number): number {
	let lo = 0;
	let hi = events.length;
	while (lo < hi) {
		const mid = (lo + hi) >>> 1;
		if (events[mid].at <= t) lo = mid + 1;
		else hi = mid;
	}
	return lo;
}

export function eventsUpTo(
	events: readonly SyntheticEvent[],
	t: number,
): SyntheticEvent[] {
	return events.slice(0, upperBound(events, t));
}

export function eventsOfKind<K extends SyntheticEvent["kind"]>(
	events: readonly SyntheticEvent[],
	kind: K,
	t: number,
): Extract<SyntheticEvent, { kind: K }>[] {
	return eventsUpTo(events, t).filter(
		(e): e is Extract<SyntheticEvent, { kind: K }> => e.kind === kind,
	);
}

export function missionEvents(
	events: readonly SyntheticEvent[],
	missionId: number,
	t: number,
): SyntheticEvent[] {
	return eventsUpTo(events, t).filter(
		(e) => "missionId" in e && e.missionId === missionId,
	);
}

/** The sorted unique event boundaries, for step-to-event transport controls. */
export function eventBoundaries(events: readonly SyntheticEvent[]): number[] {
	return [...new Set(events.map((e) => e.at))];
}

/** Largest boundary strictly before t, or 0. */
export function prevBoundary(boundaries: readonly number[], t: number): number {
	let candidate = 0;
	for (const b of boundaries) {
		if (b >= t) break;
		candidate = b;
	}
	return candidate;
}

/** Smallest boundary strictly after t, or `fallback` when none remains. */
export function nextBoundary(
	boundaries: readonly number[],
	t: number,
	fallback: number,
): number {
	for (const b of boundaries) {
		if (b > t) return b;
	}
	return fallback;
}
