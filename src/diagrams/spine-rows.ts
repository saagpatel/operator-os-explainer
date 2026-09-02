/**
 * Mechanism 05: one store, five row shapes, fixed writers. Nothing moves
 * between systems except through these shapes, each written under a fixed
 * caller identity; retention protects tagged rows structurally.
 */
import { dataset } from "../data/dataset.ts";
import {
	ACTIVITY_TAGS,
	CALLERS,
	COST_SYSTEMS,
	SECTION_OWNERS,
	SNAP_SYSTEMS,
	SOURCE_TRUSTS,
} from "../data/vocab.ts";
import { sketch } from "./draw.ts";
import { sourceRevision } from "./facts.ts";
import type { DiagramModel } from "./model.ts";

const dispatchers = [...new Set(dataset.handoffs.map((h) => h.dispatchedFrom))];
const claimants = [...new Set(dataset.handoffs.map((h) => h.claimedBy).filter(Boolean))];

const L = {
	taps: [
		{
			id: "activity",
			sub: "session telemetry, searchable",
			w: [CALLERS.slice(0, 3).join(" · "), CALLERS.slice(3).join(" · ")],
		},
		{
			id: "handoffs",
			sub: "work moving between systems",
			w: [`dispatched by ${dispatchers.join(", ")} only`, `claimed by ${claimants.join(" or ")}`],
		},
		{
			id: "snapshots",
			sub: "state saved on completion",
			w: [SNAP_SYSTEMS.join(" · "), "read first on takeover"],
		},
		{
			id: "cost",
			sub: "records and session costs",
			w: [COST_SYSTEMS.slice(0, 2).join(" · "), COST_SYSTEMS.slice(2).join(" · ")],
		},
		{
			id: "sections",
			sub: "long-lived context, stewarded",
			w: [`owner ${SECTION_OWNERS.join(" · ")}`, "the steward is recorded on read"],
		},
	],
	bus: "BRIDGE-DB · SQLITE + FTS5",
	busB: "recall searches every row",
	who: "WHO MAY WRITE · fixed caller identity",
	retention: "RETENTION · activity only",
	retA: "untagged: only the newest 50 per source",
	tags: ACTIVITY_TAGS.join(" · "),
	retB: "retained for good, with their receipts",
	retC: `${ACTIVITY_TAGS[0]} alone obliges a build-log sync`,
	trust: "TRUST · every row",
	trustA: `source_trust: ${SOURCE_TRUSTS.join(" · ")}`,
	trustB: "read back as stored data, not instructions",
	trustC: "every gate decision lands in the audit log",
};

/** Second lines that describe a reader rather than a writer. */
const MUTED_WRITER_LINES = new Set(["read first on takeover", "the steward is recorded on read"]);

function wide() {
	const s = sketch("0 0 1120 430");
	L.taps.forEach((tap, i) => {
		const x = 30 + i * 210;
		const cx = x + 90;
		s.rect(x, 60, 180, 60);
		s.text(cx, 84, tap.id, 12, "fg", { anchor: "middle", bold: true });
		s.text(cx, 102, tap.sub, 10, "muted", { anchor: "middle" });
		s.line(cx, 122, cx, 180, "fg");
		s.line(cx, 208, cx, 250, "line");
		tap.w.forEach((line, j) => {
			s.text(cx, 266 + j * 14, line, 10, MUTED_WRITER_LINES.has(line) ? "muted" : "fg", {
				anchor: "middle",
			});
		});
	});
	s.line(0, 180, 1120, 180, "fg", { sw: 3 });
	s.text(0, 200, L.bus, 10, "muted", { tracking: 2 });
	s.text(230, 200, L.busB, 10, "muted", { tracking: 2 });
	s.text(0, 238, L.who, 10, "muted", { tracking: 2 });
	s.rect(30, 316, 500, 90);
	s.text(44, 336, L.retention, 10, "muted", { tracking: 2 });
	s.text(44, 356, L.retA, 10, "fg");
	s.text(44, 374, L.tags, 10, "accent", { bold: true });
	s.text(160, 374, L.retB, 10, "fg");
	s.text(44, 392, L.retC, 10, "fg");
	s.rect(560, 316, 490, 90);
	s.text(574, 336, L.trust, 10, "muted", { tracking: 2 });
	s.text(574, 356, L.trustA, 10, "fg");
	s.text(574, 374, L.trustB, 10, "fg");
	s.text(574, 392, L.trustC, 10, "fg");
	return s.done();
}

/** Phone layout: the bus runs down the left edge; taps hang off it as rows. */
function compact() {
	const s = sketch("0 0 340 736");
	s.text(20, 20, L.bus, 10, "muted");
	s.text(20, 34, L.busB, 10, "muted");
	s.text(20, 48, L.who, 10, "muted");
	s.line(36, 60, 36, 530, "fg", { sw: 3 });
	L.taps.forEach((tap, i) => {
		const y = 64 + i * 94;
		s.line(36, y + 42, 56, y + 42, "fg");
		s.rect(56, y, 264, 84);
		s.text(66, y + 18, tap.id, 11, "fg", { bold: true });
		s.text(66, y + 33, tap.sub, 10, "muted");
		tap.w.forEach((line, j) => {
			s.text(66, y + 49 + j * 14, line, 10, MUTED_WRITER_LINES.has(line) ? "muted" : "fg");
		});
	});
	s.rect(10, 548, 320, 88);
	s.text(20, 564, L.retention, 10, "muted");
	s.text(20, 580, L.retA, 10, "fg");
	s.text(20, 594, L.tags, 10, "accent", { bold: true });
	s.text(20, 608, L.retB, 10, "fg");
	s.text(20, 622, L.retC, 10, "fg");
	s.rect(10, 648, 320, 74);
	s.text(20, 664, L.trust, 10, "muted");
	s.text(20, 680, L.trustA, 10, "fg");
	s.text(20, 694, L.trustB, 10, "fg");
	s.text(20, 708, L.trustC, 10, "fg");
	return s.done();
}

export const spineRows: DiagramModel = {
	id: "spine-rows",
	eyebrow: `Mechanism 05 · bridge-sqlite-spine · ${L.taps.length} row shapes`,
	title: "One store, five row shapes, fixed writers",
	ariaLabel: `A horizontal bus labeled bridge-db, SQLite plus FTS5, with ${L.taps.length} taps: ${L.taps.map((t) => t.id).join(", ")}. Under each tap, the systems allowed to write it under their fixed caller identity. Below, the retention rule for activity: untagged rows keep only the newest per source, rows tagged ${ACTIVITY_TAGS.join(" or ")} are kept for good, and ${ACTIVITY_TAGS[0]} creates a sync obligation. Every row carries a source trust value.`,
	figcaption:
		"Nothing moves between systems except through these five shapes, each written under a fixed identity. Retention is structural: a protected tag is a property of the row, so no pruning pass and no cascade can orphan its receipt.",
	verify: `shapes and writer sets mirror src/types/data.ts (Caller, SnapSystem, CostSystem, SectionOwner, SourceTrust, ActivityTag) · the bridge-db README, Architecture, Tools, Trust and Retention, pinned at ${sourceRevision("bridge-db-public-source")}`,
	claims: ["bridge-sqlite-spine"],
	scene: "spine",
	wide: wide(),
	compact: compact(),
};
