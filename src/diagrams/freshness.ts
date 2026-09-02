/**
 * Mechanism 04: alerts fire only from fresh data. Each spoke keeps its own
 * system of record; the hub reads it through an adapter and classifies
 * freshness. The alert edge leaves the fresh state and no other.
 */
import { dataset } from "../data/dataset.ts";
import { FRESHNESS_STATES, SPOKES } from "../data/vocab.ts";
import { sketch } from "./draw.ts";
import { fmtT, freshnessTicks } from "./facts.ts";
import type { DiagramModel } from "./model.ts";

const ticks = freshnessTicks();

/** One fixture line per spoke, derived from its ticks in clock order. */
function fixtureLines(): string[] {
	return SPOKES.map((spoke) => {
		const own = ticks.filter((t) => t.spoke === spoke);
		const path = own.map((t) => `${t.state} ${fmtT(t.at)}`).join(" -> ");
		const last = own.at(-1);
		const dark =
			last && last.state !== "fresh"
				? ` · dark to ${fmtT(dataset.meta.sessionLengthMs)}`
				: "";
		return `${spoke}: ${path}${dark}`;
	});
}

const L = {
	hubSpoke: "HUB AND SPOKE",
	ownStore: "own store",
	adapterA: "each read through",
	adapterB: "an adapter",
	hub: "HUB",
	hubA: "reads spokes",
	hubB: "classifies freshness",
	neverA: "never calls an external service",
	neverB: "its one cross-system write:",
	neverC: "activity into the spine, fire and forget",
	perSpoke: "per spoke",
	machine: "FRESHNESS STATE MACHINE · one per spoke",
	tick: "tick arrives",
	age: "age passes",
	newTick: "new tick",
	alert: "ALERT eligible",
	onlyExit: "the only exit",
	quietA: "goes quiet",
	quietB: "never lies",
	fixture: "FIXTURE",
	lines: fixtureLines(),
};

const state = (name: (typeof FRESHNESS_STATES)[number]) => {
	if (!FRESHNESS_STATES.includes(name)) throw new Error(`unknown state ${name}`);
	return name;
};

function wide() {
	const s = sketch("0 0 1120 400");
	s.text(0, 22, L.hubSpoke, 10, "muted", { tracking: 2 });
	SPOKES.forEach((spoke, i) => {
		const y = 40 + i * 64;
		s.rect(0, y, 150, 40);
		s.text(12, y + 17, spoke, 11, "fg", { bold: true });
		s.text(12, y + 31, L.ownStore, 10, "muted");
	});
	const hubY = [170, 180, 188, 196, 206];
	SPOKES.forEach((_, i) => {
		s.line(152, 60 + i * 64, 326, hubY[i] ?? 188, "fg", { arrow: true });
	});
	s.text(200, 96, L.adapterA, 10, "muted");
	s.text(200, 110, L.adapterB, 10, "muted");
	s.rect(330, 150, 150, 76, { stroke: "fg" });
	s.text(405, 180, L.hub, 12, "fg", { anchor: "middle", bold: true });
	s.text(405, 198, L.hubA, 10, "muted", { anchor: "middle" });
	s.text(405, 212, L.hubB, 10, "muted", { anchor: "middle" });
	s.text(330, 252, L.neverA, 10, "muted");
	s.text(330, 266, L.neverB, 10, "muted");
	s.text(330, 280, L.neverC, 10, "muted");
	s.line(482, 188, 560, 188, "fg", { arrow: true });
	s.text(521, 178, L.perSpoke, 10, "muted", { anchor: "middle" });
	// state machine
	s.text(600, 22, L.machine, 10, "muted", { tracking: 2 });
	s.rect(600, 60, 130, 40);
	s.text(665, 85, state("unavailable"), 12, "fg", { anchor: "middle" });
	s.rect(860, 60, 130, 40, { stroke: "accent", sw: 1.5 });
	s.text(925, 85, state("fresh"), 12, "accent", { anchor: "middle", bold: true });
	s.rect(860, 220, 130, 40);
	s.text(925, 245, state("aging"), 12, "fg", { anchor: "middle" });
	s.rect(600, 220, 130, 40);
	s.text(665, 245, state("stale"), 12, "fg", { anchor: "middle" });
	s.line(732, 80, 856, 80, "fg", { arrow: true });
	s.text(794, 70, L.tick, 10, "muted", { anchor: "middle" });
	s.line(925, 102, 925, 216, "fg", { arrow: true });
	s.text(934, 164, L.age, 10, "muted");
	s.line(858, 240, 734, 240, "fg", { arrow: true });
	s.text(796, 230, L.age, 10, "muted", { anchor: "middle" });
	s.line(905, 218, 905, 104, "fg", { dash: "3 3", arrow: true });
	s.text(898, 164, L.newTick, 10, "muted", { anchor: "end" });
	s.path("M 665 218 L 665 130 L 856 90", "fg", { dash: "3 3", arrow: true });
	s.text(672, 150, L.newTick, 10, "muted");
	s.line(992, 80, 1110, 80, "accent", { sw: 1.5, arrow: true });
	s.text(1050, 70, L.alert, 10, "accent", { anchor: "middle", bold: true });
	s.text(1050, 100, L.onlyExit, 10, "muted", { anchor: "middle" });
	s.text(665, 284, L.quietA, 10, "muted", { anchor: "middle" });
	s.text(665, 298, L.quietB, 10, "muted", { anchor: "middle" });
	// fixture
	s.text(600, 322, L.fixture, 10, "muted", { tracking: 2 });
	L.lines.forEach((line, i) => s.text(600, 338 + i * 13, line, 10, "muted"));
	return s.done();
}

/** Phone layout: spokes and hub on top, the state cycle beneath, fixture last. */
function compact() {
	const s = sketch("0 0 340 668");
	s.text(20, 20, L.hubSpoke, 10, "muted");
	SPOKES.forEach((spoke, i) => {
		const y = 34 + i * 40;
		s.rect(20, y, 130, 32);
		s.text(28, y + 13, spoke, 10, "fg", { bold: true });
		s.text(28, y + 27, L.ownStore, 10, "muted");
		s.line(152, y + 16, 176, 132, "fg", { arrow: true });
	});
	s.rect(180, 100, 150, 64, { stroke: "fg" });
	s.text(255, 122, L.hub, 11, "fg", { anchor: "middle", bold: true });
	s.text(255, 137, L.hubA, 10, "muted", { anchor: "middle" });
	s.text(255, 151, L.hubB, 10, "muted", { anchor: "middle" });
	s.line(255, 166, 255, 216, "fg", { arrow: true });
	s.text(262, 194, L.perSpoke, 10, "muted");
	s.text(180, 240, L.adapterA, 10, "muted");
	s.text(180, 254, L.adapterB, 10, "muted");
	s.text(20, 276, L.neverA, 10, "muted");
	s.text(20, 290, L.neverB, 10, "muted");
	s.text(20, 304, L.neverC, 10, "muted");
	// the cycle: fresh top-left so its exit has room above it
	s.text(20, 322, L.machine, 10, "muted");
	s.line(85, 378, 85, 338, "accent", { sw: 1.5, arrow: true });
	s.text(92, 346, L.alert, 10, "accent", { bold: true });
	s.text(92, 360, L.onlyExit, 10, "muted");
	s.text(255, 376, L.tick, 10, "muted", { anchor: "middle" });
	s.rect(20, 382, 130, 36, { stroke: "accent", sw: 1.5 });
	s.text(85, 405, state("fresh"), 11, "accent", { anchor: "middle", bold: true });
	s.rect(190, 382, 130, 36);
	s.text(255, 405, state("unavailable"), 11, "fg", { anchor: "middle" });
	s.rect(20, 482, 130, 36);
	s.text(85, 505, state("aging"), 11, "fg", { anchor: "middle" });
	s.rect(190, 482, 130, 36);
	s.text(255, 505, state("stale"), 11, "fg", { anchor: "middle" });
	s.line(188, 400, 154, 400, "fg", { arrow: true });
	s.line(118, 420, 118, 478, "fg", { arrow: true });
	s.text(124, 453, L.age, 10, "muted");
	s.line(44, 480, 44, 422, "fg", { dash: "3 3", arrow: true });
	s.text(50, 453, L.newTick, 10, "muted");
	s.line(152, 500, 186, 500, "fg", { arrow: true });
	s.text(169, 536, L.age, 10, "muted", { anchor: "middle" });
	s.path("M 255 480 L 255 442 L 156 408", "fg", { dash: "3 3", arrow: true });
	s.text(262, 460, L.newTick, 10, "muted");
	s.text(255, 536, L.quietA, 10, "muted", { anchor: "middle" });
	s.text(255, 550, L.quietB, 10, "muted", { anchor: "middle" });
	s.text(20, 580, L.fixture, 10, "muted");
	L.lines.forEach((line, i) => s.text(20, 596 + i * 14, line, 10, "muted"));
	return s.done();
}

export const freshness: DiagramModel = {
	id: "freshness",
	eyebrow: `Mechanism 04 · freshness-gated-alerts · ${SPOKES.length} spokes`,
	title: "Alerts fire only from fresh data",
	ariaLabel: `Left: ${SPOKES.length} spokes (${SPOKES.join(", ")}), each its own system of record, read by the hub through an adapter; the hub never calls external services. Right: a ${FRESHNESS_STATES.length}-state machine (${FRESHNESS_STATES.join(", ")}). A tick moves any state to fresh; age moves fresh to aging to stale. Only fresh has an exit labeled alert eligible. In the fixture the overlay spoke goes stale and never recovers.`,
	figcaption:
		"Each spoke keeps its own system of record; the hub only reads. Because the alert edge leaves the fresh state and no other, an aging or stale spoke goes quiet instead of lying, which is why the overlay light stays dark at the end of the replay.",
	verify:
		"SPOKES and FRESHNESS_STATES are closed sets in src/data/vocab.ts · ticks from src/data/dataset.json · the alert eligibility boundary is private control-plane source, checked but not publicly inspectable",
	claims: ["freshness-gated-alerts"],
	scene: "hub",
	wide: wide(),
	compact: compact(),
};
