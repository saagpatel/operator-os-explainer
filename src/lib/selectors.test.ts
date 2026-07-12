// @vitest-environment node
import { describe, expect, it } from "vitest";
import { generate } from "../data/generate.ts";
import {
	eventBoundaries,
	eventsOfKind,
	eventsUpTo,
	missionEvents,
	nextBoundary,
	prevBoundary,
} from "./selectors.ts";

const { events } = generate();

describe("eventsUpTo (canonical cumulative render rule)", () => {
	it("matches known fixture values", () => {
		expect(eventsUpTo(events, 0)).toHaveLength(0);
		expect(eventsUpTo(events, 799)).toHaveLength(0);
		expect(eventsUpTo(events, 800)).toHaveLength(1); // ev1 dispatch
		expect(eventsUpTo(events, 3_500)).toHaveLength(5); // through ev5
		expect(eventsUpTo(events, 90_000)).toHaveLength(46);
	});

	it("is monotonic: count never decreases as t advances", () => {
		let prev = 0;
		for (let t = 0; t <= 90_000; t += 500) {
			const count = eventsUpTo(events, t).length;
			expect(count).toBeGreaterThanOrEqual(prev);
			prev = count;
		}
		expect(prev).toBe(46);
	});
});

describe("eventsOfKind", () => {
	it("matches known fixture values", () => {
		// cost events at 4500, 6500, 11500, 12000, 15500
		expect(eventsOfKind(events, "cost", 12_000)).toHaveLength(4);
		expect(eventsOfKind(events, "cost", 90_000)).toHaveLength(5);
		expect(eventsOfKind(events, "guard", 10_999)).toHaveLength(0);
		expect(eventsOfKind(events, "guard", 11_000)).toHaveLength(1);
	});

	it("narrows the union type", () => {
		const guards = eventsOfKind(events, "guard", 90_000);
		expect(guards[0].ruleConcept).toBe("push-to-main");
	});
});

describe("missionEvents (the Corveth hero arc)", () => {
	it("threads the full mission through t", () => {
		expect(missionEvents(events, 1, 799)).toHaveLength(0);
		expect(missionEvents(events, 1, 4_500)).toHaveLength(6); // ev1..ev6
		expect(missionEvents(events, 1, 19_000)).toHaveLength(25); // whole arc
		expect(missionEvents(events, 1, 90_000)).toHaveLength(25); // nothing after clear
	});
});

describe("step boundaries", () => {
	const boundaries = eventBoundaries(events);

	it("deduplicates simultaneous events", () => {
		expect(boundaries.filter((b) => b === 8_000)).toHaveLength(1);
	});

	it("steps to known neighbors", () => {
		expect(prevBoundary(boundaries, 800)).toBe(0); // nothing strictly before
		expect(prevBoundary(boundaries, 801)).toBe(800);
		expect(nextBoundary(boundaries, 0, 90_000)).toBe(800);
		expect(nextBoundary(boundaries, 800, 90_000)).toBe(1_500);
		expect(nextBoundary(boundaries, 70_000, 90_000)).toBe(90_000); // fallback
	});
});
