/**
 * Mechanism 06: guards fire, the agent adapts. Seven independent layers from
 * outer intent to inner floor; each fabricated would-be action stops at the
 * layer that catches it and exits as an adaptation, never as an escalation.
 */
import { GUARD_LAYERS } from "../data/vocab.ts";
import { sketch } from "./draw.ts";
import { fmtT, guardEvents, guardRows } from "./facts.ts";
import type { DiagramModel } from "./model.ts";

const rows = guardRows();
const fixture = guardEvents()[0];
if (!fixture) throw new Error("the guards diagram needs one guard event in the dataset");

const L = {
	hAction: "WOULD-BE ACTION · closed set",
	hLayer: "LAYER · outer intent to inner floor",
	hAdapt: "ADAPTATION · never an escalation",
	layer: GUARD_LAYERS.map((layer, i) => `${i + 1} · ${layer}`),
	blocked: "BLOCKED",
	replay: `replay: ${fmtT(fixture.at)}`,
	noRule: "no rule in the map · independent anyway",
	floorA: `guards the guards: checks layers 1 to ${GUARD_LAYERS.length - 1}`,
	floorB: "are present and untampered",
	footA: "Every entering line stops at one layer;",
	footB: "nothing passes through to more permission.",
	footC: `Only ${fixture.ruleConcept} has a timeline event;`,
	footD: `the other ${rows.length - 1} resolve from the static map.`,
};

const rulesFor = (layer: (typeof GUARD_LAYERS)[number]) => rows.filter((r) => r.layer === layer);
const isFixture = (rule: string) => rule === fixture.ruleConcept;

function wide() {
	const s = sketch("0 0 1120 400");
	s.text(0, 22, L.hAction, 10, "muted", { tracking: 2 });
	s.text(560, 22, L.hLayer, 10, "muted", { anchor: "middle", tracking: 2 });
	s.text(1120, 22, L.hAdapt, 10, "muted", { anchor: "end", tracking: 2 });
	GUARD_LAYERS.forEach((layer, i) => {
		const y = 40 + i * 48;
		const cy = y + 15;
		const caught = rulesFor(layer);
		const isFloor = i === GUARD_LAYERS.length - 1;
		const hero = caught.some((r) => isFixture(r.rule));
		s.rect(400, y, 320, 30, hero ? { stroke: "fg" } : {});
		s.text(560, cy + 4, L.layer[i] ?? layer, 11, "fg", { anchor: "middle", bold: hero });
		if (isFloor) {
			s.text(756, cy, L.floorA, 10, "muted");
			s.text(756, cy + 14, L.floorB, 10, "muted");
		} else if (caught.length === 0) {
			s.text(756, cy + 4, L.noRule, 10, "muted");
		}
		caught.forEach((r, j) => {
			const offset = caught.length === 1 ? 0 : j === 0 ? -8 : 8;
			const ly = cy + offset;
			const heroRule = isFixture(r.rule);
			const labelY = caught.length === 2 && j === 0 ? ly - 4 : ly + 4;
			s.text(0, labelY, r.rule, 11, "fg", { bold: true });
			if (heroRule) s.text(0, ly + 8, L.replay, 9, "accent");
			s.line(150, ly, 392, ly, "fg", heroRule ? { sw: 1.5 } : {});
			s.dot(400, ly, heroRule ? 5 : 4, "accent");
			if (heroRule) s.text(386, ly - 10, L.blocked, 9, "accent", { anchor: "end" });
			s.line(722, ly, 900, ly, "fg", { arrow: true, ...(heroRule ? { sw: 1.5 } : {}) });
			s.text(908, ly + 4, r.adaptation, 11, "fg", { bold: heroRule });
		});
	});
	s.text(0, 384, L.footA, 10, "muted");
	s.text(0, 398, L.footB, 10, "muted");
	s.text(560, 384, L.footC, 10, "muted");
	s.text(560, 398, L.footD, 10, "muted");
	return s.done();
}

/** Phone layout: each layer is a bar; the rules it catches are listed beneath it. */
function compact() {
	const s = sketch("0 0 340 690");
	s.text(20, 16, L.hAction, 10, "muted");
	s.text(20, 30, L.hLayer, 10, "muted");
	s.text(20, 44, L.hAdapt, 10, "muted");
	let y = 60;
	GUARD_LAYERS.forEach((layer, i) => {
		const caught = rulesFor(layer);
		const isFloor = i === GUARD_LAYERS.length - 1;
		const hero = caught.some((r) => isFixture(r.rule));
		s.rect(20, y, 300, 26, hero ? { stroke: "fg" } : {});
		s.text(170, y + 17, L.layer[i] ?? layer, 10.5, "fg", { anchor: "middle", bold: hero });
		let ly = y + 26 + 18;
		if (isFloor) {
			s.text(28, ly, L.floorA, 10, "muted");
			s.text(28, ly + 14, L.floorB, 10, "muted");
			ly += 28;
		} else if (caught.length === 0) {
			s.text(28, ly, L.noRule, 10, "muted");
			ly += 14;
		}
		for (const r of caught) {
			const heroRule = isFixture(r.rule);
			s.dot(28, ly - 4, heroRule ? 4 : 3, "accent");
			s.text(38, ly, r.rule, 10.5, "fg", { bold: true });
			ly += 14;
			s.line(38, ly - 4, 58, ly - 4, "fg", { arrow: true });
			s.text(66, ly, r.adaptation, 10, "fg", { bold: heroRule });
			ly += 14;
			if (heroRule) {
				s.text(38, ly, L.blocked, 10, "accent", { bold: true });
				s.text(106, ly, L.replay, 10, "accent");
				ly += 14;
			}
		}
		y = ly + 4;
	});
	s.text(20, y + 8, L.footA, 10, "muted");
	s.text(20, y + 22, L.footB, 10, "muted");
	s.text(20, y + 36, L.footC, 10, "muted");
	s.text(20, y + 50, L.footD, 10, "muted");
	return s.done();
}

export const guards: DiagramModel = {
	id: "guards",
	eyebrow: `Mechanism 06 · layered-operation-guards · ${GUARD_LAYERS.length} layers, ${rows.length} rules`,
	title: "Guards fire, the agent adapts",
	ariaLabel: `${GUARD_LAYERS.length} guard layers stacked from outer intent to inner floor: ${GUARD_LAYERS.join(", ")}. ${rows.length} fabricated would-be actions enter from the left and each stops at the layer that catches it, then exits to the right as an adaptation. No line crosses to a privilege escalation. The integrity floor checks the other ${GUARD_LAYERS.length - 1} are present.`,
	figcaption:
		"Each layer works alone, so no single failure unlocks the system. A blocked action is a signal to adapt: open a branch, reword, reroute, verify first, or hand the decision to the operator.",
	verify: `GUARD_LAYERS (${GUARD_LAYERS.length}), RULE_CONCEPTS (${rows.length}), ADAPTATIONS and GUARD_MAP in src/data/vocab.ts · the guard event at ${fmtT(fixture.at)} in src/data/dataset.json · the layered practice itself is an operator attestation, not public source`,
	claims: ["layered-operation-guards"],
	scene: "safety",
	wide: wide(),
	compact: compact(),
};
