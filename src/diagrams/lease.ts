/**
 * Mechanism 02: a handoff is a lease with a receipt. Pickup is the one
 * dangerous transition (pending to active), so it hands the claimant a
 * one-time completion capability that only clear can consume. The SHIPPED
 * tag on the resulting activity row creates a sync obligation downstream.
 */
import { HANDOFF_STAGES } from "../data/vocab.ts";
import { sketch } from "./draw.ts";
import {
	fmtGap,
	fmtT,
	handoffStageTimes,
	heroHandoff,
	shippedActivity,
	sourceRevision,
} from "./facts.ts";
import type { DiagramModel } from "./model.ts";

type Stage = (typeof HANDOFF_STAGES)[number];

const row = heroHandoff();
const at = handoffStageTimes(row.id);
const chain = shippedActivity();

const L = {
	laneA: "CLAUDE.AI",
	laneASub: "dispatches · no filesystem",
	laneS: "SPINE",
	laneSSub: "bridge-db · handoff row",
	laneC: "CLAUDE CODE",
	laneCSub: "claims · has the repo",
	stage: Object.fromEntries(HANDOFF_STAGES.map((st) => [st, st])) as Record<Stage, string>,
	time: Object.fromEntries(HANDOFF_STAGES.map((st) => [st, fmtT(at[st])])) as Record<
		Stage,
		string
	>,
	gap: `${fmtGap(at.pickup, at.receipt)} of mission work`,
	gapA: "fan out · guard fires · verify · ship",
	gapB: "see The Fleet in Motion",
	dispatch: "create_handoff",
	dispatchSub: `phase ${row.phase} · ${row.roadmapFile}`,
	pending: "pending",
	snapA: "reads the latest snapshot",
	snapB: "before touching anything",
	pickup: "pick_up_handoff",
	capA: "completion capability",
	capB: "one-time · expires · bearer",
	active: `active · ${row.claimedBy}`,
	held: "held in the claiming session · never logged",
	receipt: "receipt",
	symA: "symmetric receipt:",
	symB: "both sides acknowledge",
	clear: "clear_handoff",
	clearSub: "consumes the capability",
	cleared: "cleared",
	chain: `THE RECEIPT CHAIN · activity row ${chain.activity.id}`,
	shipped: chain.activity.summary,
	shippedSub: `${fmtT(chain.revealAt)} · ${chain.activity.source} · tag`,
	tag: chain.activity.tags[0] ?? "",
	creates: "creates",
	sync: "sync obligation",
	syncSub: "reconciled exactly once",
	ship: "ship",
	log: `external build log · ${chain.ship.downstreamRef}`,
	logSub: `${fmtT(chain.ship.at)} · sync state kept on the row`,
};

function wide() {
	const s = sketch("0 0 1120 470");
	const col: Record<Stage, number> = {
		dispatch: 200,
		snapshot: 340,
		pickup: 480,
		receipt: 840,
		clear: 980,
	};
	for (const st of HANDOFF_STAGES) {
		s.text(col[st], 24, L.time[st], 10, "muted", { anchor: "middle" });
		s.text(col[st], 40, L.stage[st], 11, "fg", { anchor: "middle", bold: true });
	}
	// the mission gap
	s.rect(580, 52, 180, 290, { dash: "4 4" });
	s.text(670, 176, L.gap, 11, "fg", { anchor: "middle", bold: true });
	s.text(670, 194, L.gapA, 10, "muted", { anchor: "middle" });
	s.text(670, 208, L.gapB, 10, "muted", { anchor: "middle" });
	// lanes
	s.line(120, 80, 1120, 80, "line");
	s.text(0, 78, L.laneA, 11, "fg", { bold: true });
	s.text(0, 92, L.laneASub, 10, "muted");
	s.line(120, 200, 1120, 200, "fg", { sw: 2 });
	s.text(0, 198, L.laneS, 11, "fg", { bold: true });
	s.text(0, 212, L.laneSSub, 10, "muted");
	s.line(120, 320, 1120, 320, "line");
	s.text(0, 318, L.laneC, 11, "fg", { bold: true });
	s.text(0, 332, L.laneCSub, 10, "muted");
	// dispatch
	s.dot(200, 80, 4);
	s.line(200, 86, 200, 186, "fg", { arrow: true });
	s.text(208, 122, L.dispatch, 10, "muted");
	s.text(208, 136, L.dispatchSub, 10, "muted");
	s.chip(200, 200, 64, L.pending);
	// snapshot
	s.dot(340, 200, 4);
	s.line(340, 206, 340, 306, "fg", { arrow: true });
	s.text(332, 250, L.snapA, 10, "muted", { anchor: "end" });
	s.text(332, 264, L.snapB, 10, "muted", { anchor: "end" });
	// pickup
	s.line(472, 314, 472, 214, "fg", { arrow: true });
	s.text(464, 250, L.pickup, 10, "muted", { anchor: "end" });
	s.line(496, 214, 496, 306, "accent", { arrow: true });
	s.text(504, 236, L.capA, 10, "accent");
	s.text(504, 250, L.capB, 10, "accent");
	s.chip(480, 200, 80, L.active);
	// the capability travels with the claimant
	s.line(496, 336, 972, 336, "accent", { dash: "2 4" });
	s.text(734, 356, L.held, 10, "accent", { anchor: "middle" });
	// receipt
	s.line(840, 314, 840, 214, "fg", { arrow: true });
	s.line(840, 186, 840, 94, "fg", { arrow: true });
	s.dot(840, 80, 4);
	s.text(848, 290, L.receipt, 10, "muted");
	s.text(848, 122, L.symA, 10, "muted");
	s.text(848, 136, L.symB, 10, "muted");
	// clear
	s.line(980, 314, 980, 214, "accent", { arrow: true });
	s.text(972, 250, L.clear, 10, "accent", { anchor: "end" });
	s.text(972, 264, L.clearSub, 10, "accent", { anchor: "end" });
	s.chip(980, 200, 64, L.cleared);
	// the receipt chain
	s.text(0, 396, L.chain, 10, "muted", { tracking: 2 });
	s.rect(120, 408, 300, 46);
	s.text(132, 426, L.shipped, 11, "fg", { bold: true });
	s.text(132, 442, L.shippedSub, 10, "muted");
	s.rect(252, 432, 60, 14, { fill: "none", stroke: "accent" });
	s.text(282, 443, L.tag, 9, "accent", { anchor: "middle" });
	s.line(422, 431, 486, 431, "fg", { arrow: true });
	s.text(454, 420, L.creates, 9, "muted", { anchor: "middle" });
	s.rect(490, 408, 190, 46);
	s.text(585, 426, L.sync, 11, "fg", { anchor: "middle", bold: true });
	s.text(585, 442, L.syncSub, 10, "muted", { anchor: "middle" });
	s.line(682, 431, 746, 431, "fg", { arrow: true });
	s.text(714, 420, L.ship, 9, "muted", { anchor: "middle" });
	s.rect(750, 408, 300, 46);
	s.text(762, 426, L.log, 11, "fg", { bold: true });
	s.text(762, 442, L.logSub, 10, "muted");
	return s.done();
}

/**
 * Phone layout: the three lanes become three positions on each row (left,
 * centre, right); the stages stack down the page as blocks with their notes
 * full width beneath, so no lane line ever crosses a label.
 */
function compact() {
	const s = sketch("0 0 340 800");
	const A = 64;
	const S = 170;
	const C = 284;
	s.text(A, 22, L.laneA, 10.5, "fg", { anchor: "middle", bold: true });
	s.text(S, 22, L.laneS, 10.5, "fg", { anchor: "middle", bold: true });
	s.text(C, 22, L.laneC, 10.5, "fg", { anchor: "middle", bold: true });
	s.text(20, 38, L.laneASub, 10, "muted");
	s.text(S, 52, L.laneSSub, 10, "muted", { anchor: "middle" });
	s.text(320, 66, L.laneCSub, 10, "muted", { anchor: "end" });
	s.line(20, 76, 320, 76, "line");
	const stageRow = (y: number, st: Stage) => {
		s.text(S - 6, y, L.stage[st], 10.5, "fg", { anchor: "end", bold: true });
		s.text(S + 6, y, L.time[st], 10, "muted");
	};
	// dispatch: claude.ai -> spine
	stageRow(96, "dispatch");
	s.dot(A, 112, 3.5);
	s.line(A + 6, 112, S - 32, 112, "fg", { arrow: true });
	s.chip(S, 112, 60, L.pending, "fg", 10);
	s.text(20, 132, L.dispatch, 10, "muted");
	s.text(20, 146, L.dispatchSub, 10, "muted");
	// snapshot: spine -> claude code
	stageRow(168, "snapshot");
	s.dot(S, 184, 3.5);
	s.line(S + 6, 184, C - 6, 184, "fg", { arrow: true });
	s.text(20, 204, L.snapA, 10, "muted");
	s.text(20, 218, L.snapB, 10, "muted");
	// pickup: claude code -> spine, the capability back
	stageRow(240, "pickup");
	s.line(C - 6, 256, S + 44, 256, "fg", { arrow: true });
	s.chip(S, 256, 86, L.active, "fg", 10);
	s.text(20, 276, L.pickup, 10, "muted");
	s.line(S + 6, 292, C - 6, 292, "accent", { arrow: true });
	s.text(20, 312, L.capA, 10, "accent");
	s.text(20, 326, L.capB, 10, "accent");
	// the mission gap
	s.rect(20, 340, 300, 58, { dash: "4 4" });
	s.text(S, 360, L.gap, 10.5, "fg", { anchor: "middle", bold: true });
	s.text(S, 375, L.gapA, 10, "muted", { anchor: "middle" });
	s.text(S, 389, L.gapB, 10, "muted", { anchor: "middle" });
	s.line(328, 292, 328, 516, "accent", { dash: "2 4" });
	// receipt: both sides
	stageRow(420, "receipt");
	s.line(C - 6, 436, S + 6, 436, "fg", { arrow: true });
	s.line(S - 6, 436, A + 6, 436, "fg", { arrow: true });
	s.dot(A, 436, 3.5);
	s.text(320, 456, L.receipt, 10, "muted", { anchor: "end" });
	s.text(20, 456, L.symA, 10, "muted");
	s.text(20, 470, L.symB, 10, "muted");
	// clear
	stageRow(500, "clear");
	s.line(C - 6, 516, S + 32, 516, "accent", { arrow: true });
	s.chip(S, 516, 60, L.cleared, "fg", 10);
	s.text(20, 536, L.clear, 10, "accent");
	s.text(20, 550, L.clearSub, 10, "accent");
	s.text(S, 572, L.held, 10, "accent", { anchor: "middle" });
	// the receipt chain
	s.text(20, 600, L.chain, 10, "muted");
	s.rect(20, 612, 300, 46);
	s.text(30, 630, L.shipped, 10.5, "fg", { bold: true });
	s.text(30, 646, L.shippedSub, 10, "muted");
	s.rect(246, 634, 64, 16, { fill: "none", stroke: "accent" });
	s.text(278, 646, L.tag, 9.5, "accent", { anchor: "middle" });
	s.line(S, 660, S, 680, "fg", { arrow: true });
	s.text(S + 8, 674, L.creates, 10, "muted");
	s.rect(20, 684, 300, 46);
	s.text(S, 702, L.sync, 10.5, "fg", { anchor: "middle", bold: true });
	s.text(S, 718, L.syncSub, 10, "muted", { anchor: "middle" });
	s.line(S, 732, S, 752, "fg", { arrow: true });
	s.text(S + 8, 746, L.ship, 10, "muted");
	s.rect(20, 756, 300, 46);
	s.text(30, 774, L.log, 10.5, "fg", { bold: true });
	s.text(30, 790, L.logSub, 10, "muted");
	return s.done();
}

export const lease: DiagramModel = {
	id: "lease",
	eyebrow: `Mechanism 02 · bridge-sqlite-spine · handoff ${row.id}, ${row.projectName}`,
	title: "A handoff is a lease with a receipt",
	ariaLabel: `Three lanes: claude.ai, the spine, and Claude Code. Dispatch creates a pending handoff row; Claude Code reads the latest snapshot, picks the handoff up and receives a one-time completion capability; ${fmtGap(at.pickup, at.receipt)} of mission work pass; both sides acknowledge a receipt; clear consumes the capability and the row reads cleared. Below, the ${chain.activity.tags[0]} tag on the activity row creates a sync obligation to the external build log.`,
	figcaption: `Pickup is the one dangerous transition, pending to active, so it hands the claimant a one-time completion capability that only clear can consume. The ${fmtGap(at.pickup, at.receipt)} gap is real: the Spine scene and the Finale share handoff ${row.id} and mission ${chain.activity.missionId}.`,
	verify: `stages and statuses are closed sets in src/data/vocab.ts · times from src/data/dataset.json · capability and retention in the bridge-db README, Tools and Retention, pinned at ${sourceRevision("bridge-db-public-source")}`,
	claims: ["bridge-sqlite-spine"],
	scene: "spine",
	wide: wide(),
	compact: compact(),
};
