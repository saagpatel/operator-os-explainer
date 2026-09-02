/**
 * Mechanism 03: nothing leaves without a token. Draft, approval, send are
 * the three closed stages; the one-use token and the timed send window are
 * two operator-only conditions on the last edge, not stages.
 */
import { sketch } from "./draw.ts";
import { fmtT, hubflowStages } from "./facts.ts";
import type { DiagramModel } from "./model.ts";

const stages = hubflowStages();
const stage = (name: (typeof stages)[number]["stage"]) => {
	const e = stages.find((s) => s.stage === name);
	if (!e) throw new Error(`no ${name} hubflow event in the dataset`);
	return e;
};
const draft = stage("draft");
const approval = stage("approval");
const send = stage("send");

const L = {
	tDraft: fmtT(draft.at),
	tApproval: fmtT(approval.at),
	tSend: fmtT(send.at),
	draft: draft.stage,
	approval: approval.stage,
	send: send.stage,
	outA: "OUTSIDE",
	outB: "THE MACHINE",
	laneA: "AGENT",
	laneASub: "prepares everything",
	laneH: "HUB",
	laneHSub: "approval queue · durable",
	laneO: "OPERATOR",
	laneOSub: "releases, or does not",
	draftA: "create draft",
	draftB: `draft artifact ${draft.artifactId}`,
	chipDraft: "draft",
	apprA: "raise approval",
	apprB: "raised for review",
	chipPending: "pending",
	agentStops: "agent prepares everything, releases nothing",
	tokA: "mints a one-use",
	tokB: "confirmation token",
	chipToken: "token accepted",
	winA: "opens the timed",
	winB: "send window",
	chipWindow: "window open",
	gateA: "opens only if",
	gateB: "token AND window",
	sent: "sent",
	roA: "read-only views (status, inbox, worklist)",
	roB: "cross no boundary and need no token",
};

function wide() {
	const s = sketch("0 0 1120 350");
	s.text(260, 24, L.tDraft, 10, "muted", { anchor: "middle" });
	s.text(260, 40, L.draft, 11, "fg", { anchor: "middle", bold: true });
	s.text(470, 24, L.tApproval, 10, "muted", { anchor: "middle" });
	s.text(470, 40, L.approval, 11, "fg", { anchor: "middle", bold: true });
	s.text(850, 24, L.tSend, 10, "muted", { anchor: "middle" });
	s.text(850, 40, L.send, 11, "fg", { anchor: "middle", bold: true });
	// the boundary
	s.line(1000, 50, 1000, 330, "fg", { sw: 2 });
	s.text(1012, 70, L.outA, 10, "muted");
	s.text(1012, 84, L.outB, 10, "muted");
	// lanes: the agent lane is solid until approval, dashed after it
	s.line(120, 80, 476, 80, "line");
	s.line(476, 80, 996, 80, "line", { dash: "2 5" });
	s.text(0, 78, L.laneA, 11, "fg", { bold: true });
	s.text(0, 92, L.laneASub, 10, "muted");
	s.line(120, 190, 996, 190, "fg", { sw: 2 });
	s.text(0, 188, L.laneH, 11, "fg", { bold: true });
	s.text(0, 202, L.laneHSub, 10, "muted");
	s.line(120, 300, 996, 300, "line");
	s.text(0, 298, L.laneO, 11, "fg", { bold: true });
	s.text(0, 312, L.laneOSub, 10, "muted");
	// draft
	s.dot(260, 80, 4);
	s.line(260, 86, 260, 176, "fg", { arrow: true });
	s.text(268, 122, L.draftA, 10, "muted");
	s.text(268, 136, L.draftB, 10, "muted");
	s.chip(260, 190, 64, L.chipDraft);
	// approval
	s.dot(470, 80, 4);
	s.line(470, 86, 470, 176, "fg", { arrow: true });
	s.text(478, 122, L.apprA, 10, "muted");
	s.text(478, 136, L.apprB, 10, "muted");
	s.chip(470, 190, 88, L.chipPending);
	s.text(740, 70, L.agentStops, 10, "muted", { anchor: "middle" });
	// token: operator only
	s.dot(620, 300, 4, "accent");
	s.line(620, 294, 620, 204, "accent", { arrow: true });
	s.text(628, 244, L.tokA, 10, "accent");
	s.text(628, 258, L.tokB, 10, "accent");
	s.chip(620, 190, 96, L.chipToken, "accent");
	// send window: operator only
	s.dot(760, 300, 4);
	s.line(760, 294, 760, 204, "fg", { arrow: true });
	s.text(768, 244, L.winA, 10, "muted");
	s.text(768, 258, L.winB, 10, "muted");
	s.chip(760, 190, 96, L.chipWindow);
	// send gate
	s.line(846, 170, 846, 210, "fg", { sw: 2 });
	s.line(856, 170, 856, 210, "fg", { sw: 2 });
	s.line(860, 190, 994, 190, "fg", { arrow: true });
	s.text(850, 150, L.gateA, 10, "muted", { anchor: "middle" });
	s.text(850, 164, L.gateB, 10, "muted", { anchor: "middle" });
	s.text(1012, 194, L.sent, 10, "fg");
	// the free path
	s.text(120, 334, L.roA, 10, "muted");
	s.text(120, 348, L.roB, 10, "muted");
	return s.done();
}

/** Phone layout: rows stack down the page, the boundary is the bottom edge. */
function compact() {
	const s = sketch("0 0 340 522");
	const A = 64;
	const H = 170;
	const O = 284;
	s.text(A, 22, L.laneA, 10.5, "fg", { anchor: "middle", bold: true });
	s.text(H, 22, L.laneH, 10.5, "fg", { anchor: "middle", bold: true });
	s.text(O, 22, L.laneO, 10.5, "fg", { anchor: "middle", bold: true });
	s.text(20, 38, L.laneASub, 10, "muted");
	s.text(H, 52, L.laneHSub, 10, "muted", { anchor: "middle" });
	s.text(320, 66, L.laneOSub, 10, "muted", { anchor: "end" });
	s.line(20, 76, 320, 76, "line");
	const stageRow = (y: number, name: string, time: string) => {
		s.text(H - 6, y, name, 10.5, "fg", { anchor: "end", bold: true });
		s.text(H + 6, y, time, 10, "muted");
	};
	// draft
	stageRow(96, L.draft, L.tDraft);
	s.dot(A, 112, 3.5);
	s.line(A + 6, 112, H - 32, 112, "fg", { arrow: true });
	s.chip(H, 112, 60, L.chipDraft, "fg", 10);
	s.text(20, 132, L.draftA, 10, "muted");
	s.text(20, 146, L.draftB, 10, "muted");
	// approval
	stageRow(168, L.approval, L.tApproval);
	s.dot(A, 184, 3.5);
	s.line(A + 6, 184, H - 34, 184, "fg", { arrow: true });
	s.chip(H, 184, 66, L.chipPending, "fg", 10);
	s.text(20, 204, L.apprA, 10, "muted");
	s.text(20, 218, L.apprB, 10, "muted");
	s.text(H, 242, L.agentStops, 10, "muted", { anchor: "middle" });
	// token
	s.dot(O, 266, 3.5, "accent");
	s.line(O - 6, 266, H + 56, 266, "accent", { arrow: true });
	s.chip(H, 266, 108, L.chipToken, "accent", 10);
	s.text(20, 286, L.tokA, 10, "accent");
	s.text(20, 300, L.tokB, 10, "accent");
	// window
	s.dot(O, 322, 3.5);
	s.line(O - 6, 322, H + 46, 322, "fg", { arrow: true });
	s.chip(H, 322, 88, L.chipWindow, "fg", 10);
	s.text(20, 342, L.winA, 10, "muted");
	s.text(20, 356, L.winB, 10, "muted");
	// send gate and the boundary
	stageRow(380, L.send, L.tSend);
	s.line(H - 20, 392, H + 20, 392, "fg", { sw: 2 });
	s.line(H - 20, 400, H + 20, 400, "fg", { sw: 2 });
	s.text(20, 418, L.gateA, 10, "muted");
	s.text(20, 432, L.gateB, 10, "muted");
	s.line(H, 404, H, 452, "fg", { arrow: true });
	s.line(20, 458, 320, 458, "fg", { sw: 2 });
	s.text(20, 452, L.outA, 10, "muted");
	s.text(320, 452, L.outB, 10, "muted", { anchor: "end" });
	s.text(H + 8, 474, L.sent, 10, "fg");
	s.text(H, 496, L.roA, 10, "muted", { anchor: "middle" });
	s.text(H, 510, L.roB, 10, "muted", { anchor: "middle" });
	return s.done();
}

export const airlock: DiagramModel = {
	id: "airlock",
	eyebrow: `Mechanism 03 · approval-airlock · artifact ${draft.artifactId}`,
	title: "Nothing leaves without a token",
	ariaLabel:
		"Three lanes, agent, hub, operator, and a boundary marked outside the machine. The agent creates a draft and raises an approval. Only the operator mints the one-use confirmation token and opens the timed send window. The send gate opens to the outside only when both hold. The agent lane never reaches the boundary.",
	figcaption: `${L.draft}, ${L.approval}, ${L.send} are the ${stages.length} closed stages. The token and the send window are not stages: they are two conditions on the last edge, and both are operator-only. Every externally visible action is a reviewed, token-gated event.`,
	verify: `HUBFLOW_STAGES is a closed set of ${stages.length} in src/data/vocab.ts · no send event precedes its approval in src/data/dataset.json · the token and window boundary is private control-plane source, checked but not publicly inspectable`,
	claims: ["approval-airlock"],
	scene: "hub",
	wide: wide(),
	compact: compact(),
};
