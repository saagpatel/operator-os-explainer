/**
 * Deterministic synthetic-data generator (DATA-MODEL §4). Pure function
 * seed -> Dataset. Run once at authoring time via scripts/generate-dataset.ts;
 * the app imports only the emitted dataset.json, never this module.
 *
 * The timeline is an authored SCRIPT, not a random walk: at the canonical
 * SEED it reproduces prep/sample-timeline.json exactly (the golden fixture,
 * asserted in closure.test.ts). At any other seed the PRNG fills only
 * low-stakes variety (verb/artifact index, durationMs jitter) within fixed
 * closed ranges, which is what the property test exercises for closure.
 * Cost numbers are hand-set ALWAYS: the reconciliation invariant
 * (sum of a mission's cost deltas === its sessionCost.costUsd) is the
 * load-bearing property and is never randomized.
 */
import type {
	Activity,
	CostRecord,
	Dataset,
	Handoff,
	Section,
	SessionCost,
	Snapshot,
	SyntheticEvent,
} from "../types/data.ts";
import {
	ARTIFACTS,
	COST_NOTES,
	HUB_ARTIFACT_ID,
	LESSONS,
	PATTERNS,
	sectionBody,
	slug,
	VERBS,
} from "./vocab.ts";

export const SEED = 0x0fe7a123;

/** Seeded PRNG, generate-time only. No Date.now(), no Math.random(). */
export function mulberry32(seed: number): () => number {
	let a = seed >>> 0;
	return () => {
		a = (a + 0x6d2b79f5) | 0;
		let t = Math.imul(a ^ (a >>> 15), 1 | a);
		t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
		return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
	};
}

/**
 * Logical DB timestamps are derived from `at` on the synthetic clock,
 * anchored to one fabricated window starting 2026-03-16T00:00:00Z.
 */
export function iso(atMs: number): string {
	const totalSeconds = Math.floor(atMs / 1000);
	const mm = String(Math.floor(totalSeconds / 60)).padStart(2, "0");
	const ss = String(totalSeconds % 60).padStart(2, "0");
	return `2026-03-16T00:${mm}:${ss}Z`;
}

export function generate(seed: number = SEED): Dataset {
	const canonical = seed >>> 0 === SEED;
	const rng = mulberry32(seed >>> 0);
	const pickIndex = (length: number): number => Math.floor(rng() * length);

	/** Templated summary. Authored indices at the canonical seed. */
	const summary = (verbIdx: number, artifactIdx: number): string => {
		const v = canonical ? verbIdx : pickIndex(VERBS.length);
		const a = canonical ? artifactIdx : pickIndex(ARTIFACTS.length);
		return `${VERBS[v]} ${ARTIFACTS[a]}`;
	};
	/** durationMs jitter stays inside the fixed closed range [200, 2400]. */
	const duration = (authoredMs: number): number =>
		canonical ? authoredMs : 200 + Math.floor(rng() * 2201);

	const corveth = slug("Corveth"); // hero mission, missionId 1
	const worktree = (lane: number): string => `wt/${corveth}-${lane}`;

	const activity: Activity[] = [
		// timestamps derive from each activity's reveal event `at` (DATA-MODEL §1)
		{
			id: 201,
			source: "cc",
			timestamp: iso(3_500),
			projectName: "Corveth",
			summary: summary(9, 0),
			branch: `feat/${corveth}`,
			tags: [],
			sourceTrust: "operator",
			missionId: 1,
		},
		{
			id: 202,
			source: "cc",
			timestamp: iso(17_400),
			projectName: "Corveth",
			summary: summary(0, 0),
			branch: `feat/${corveth}`,
			tags: ["SHIPPED"],
			sourceTrust: "agent",
			missionId: 1,
		},
		{
			id: 203,
			source: "codex",
			timestamp: iso(6_000),
			projectName: "Elstra",
			summary: summary(10, 9),
			branch: null,
			tags: [],
			sourceTrust: "agent",
			missionId: 2,
		},
		{
			id: 204,
			source: "codex",
			timestamp: iso(22_000),
			projectName: "Elstra",
			summary: summary(13, 3),
			branch: null,
			tags: [],
			sourceTrust: "agent",
			missionId: 2,
		},
		{
			id: 205,
			source: "claude_ai",
			timestamp: iso(31_000),
			projectName: "Grevan",
			summary: summary(6, 14),
			branch: null,
			tags: ["LEDGER"],
			sourceTrust: "operator",
			missionId: 4,
		},
		{
			id: 206,
			source: "cc",
			timestamp: iso(61_000),
			projectName: "Halvane",
			summary: summary(8, 8),
			branch: null,
			tags: [],
			sourceTrust: "agent",
			missionId: 5,
		},
		{
			id: 207,
			source: "personal_ops",
			timestamp: iso(45_000),
			projectName: "Jorvel",
			summary: summary(1, 7),
			branch: null,
			tags: [],
			sourceTrust: "agent",
			missionId: null,
		},
		{
			id: 208,
			source: "notion_os",
			timestamp: iso(55_000),
			projectName: "Kestrine",
			summary: summary(14, 13),
			branch: null,
			tags: ["LEDGER"],
			sourceTrust: "ingested",
			missionId: null,
		},
	];

	const handoffs: Handoff[] = [
		{
			id: 1,
			projectName: "Corveth",
			projectPath: `~/workspace/${corveth}`,
			roadmapFile: "PLAN.md",
			phase: "implement",
			dispatchedFrom: "claude_ai",
			dispatchedAt: iso(1_500), // handoff stage: dispatch
			pickedUpAt: iso(3_000), // stage: pickup
			clearedAt: iso(19_000), // stage: clear
			status: "cleared",
			claimedBy: "cc",
			sourceTrust: "operator",
		},
		{
			id: 2,
			projectName: "Faltrin",
			projectPath: `~/workspace/${slug("Faltrin")}`,
			roadmapFile: null,
			phase: "scope",
			dispatchedFrom: "claude_ai",
			dispatchedAt: iso(25_000),
			pickedUpAt: iso(26_000),
			clearedAt: null,
			status: "active",
			claimedBy: "codex",
			sourceTrust: "agent",
		},
	];

	const snapshots: Snapshot[] = [
		{
			id: 1,
			system: "cc",
			snapshotDate: "2026-03-16",
			data: {
				activeProjects: ["Corveth", "Elstra"],
				lessons: [LESSONS[1], LESSONS[0]],
				patterns: [PATTERNS[0], PATTERNS[4]],
			},
			createdAt: iso(3_000), // snapshot-first takeover: read at pickup
			sourceTrust: "agent",
		},
		{
			id: 2,
			system: "codex",
			snapshotDate: "2026-03-16",
			data: {
				activeProjects: ["Elstra", "Faltrin"],
				lessons: [LESSONS[4]],
				patterns: [PATTERNS[3]],
			},
			createdAt: iso(26_000),
			sourceTrust: "agent",
		},
	];

	const costRecords: CostRecord[] = [
		{ id: 1, system: "cc", month: "2026-03", amount: 12.4, notes: null },
		{
			id: 2,
			system: "codex",
			month: "2026-03",
			amount: 3.1,
			notes: COST_NOTES[0],
		},
		{
			id: 3,
			system: "personal_ops",
			month: "2026-03",
			amount: 0.9,
			notes: null,
		},
	];

	// Hand-set costs (DATA-MODEL §4 item 3). The reconciliation invariant:
	// mission 1 deltas 0.03 + 0.14 + 0.01 + 0.09 === 0.27 (Sonnet 0.26 / mechanical 0.01);
	// mission 2 delta 0.02 === 0.02. Asserted in closure.test.ts.
	const sessionCosts: SessionCost[] = [
		{
			sessionId: "sc-1",
			projectName: "Corveth",
			startedAt: iso(0),
			costUsd: 0.27,
			modelBreakdown: { Sonnet: 0.26, mechanical: 0.01 },
			source: "cc",
			missionId: 1,
		},
		{
			sessionId: "sc-2",
			projectName: "Elstra",
			startedAt: iso(5_000),
			costUsd: 0.02,
			modelBreakdown: { mechanical: 0.02 },
			source: "codex",
			missionId: 2,
		},
	];

	const sections: Section[] = [
		{
			sectionName: "career",
			owner: "claude_ai",
			content: sectionBody("career"),
			updatedAt: iso(31_000),
			version: 3,
		},
		{
			sectionName: "capabilities",
			owner: "claude_ai",
			content: sectionBody("capabilities"),
			updatedAt: iso(31_000),
			version: 2,
		},
		{
			sectionName: "research",
			owner: "claude_ai",
			content: sectionBody("research"),
			updatedAt: iso(31_000),
			version: 5,
		},
		{
			sectionName: "speaking",
			owner: "claude_ai",
			content: sectionBody("speaking"),
			updatedAt: iso(31_000),
			version: 1,
		},
		{
			sectionName: "portfolio",
			owner: "cc",
			content: sectionBody("portfolio"),
			updatedAt: iso(61_000),
			version: 7,
		},
	];

	// The 90s session script: one coherent hero mission (Corveth, missionId 1)
	// threading Fleet -> Spine -> Safety -> Finale, plus ambient events for the
	// other scenes' feeds. 46 events, ascending by `at`.
	const events: SyntheticEvent[] = [
		{
			kind: "dispatch",
			id: 1,
			at: 800,
			missionId: 1,
			from: "claude_ai",
			to: "cc",
			taskClass: "feature",
			model: "Opus",
			durationMs: duration(1_200),
			status: "ok",
		},
		{
			kind: "handoff",
			id: 2,
			at: 1_500,
			missionId: 1,
			handoffId: 1,
			stage: "dispatch",
		},
		{
			kind: "handoff",
			id: 3,
			at: 2_200,
			missionId: 1,
			handoffId: 1,
			stage: "snapshot",
		},
		{
			kind: "handoff",
			id: 4,
			at: 3_000,
			missionId: 1,
			handoffId: 1,
			stage: "pickup",
		},
		{ kind: "activity", id: 5, at: 3_500, missionId: 1, activityId: 201 },
		{
			kind: "cost",
			id: 6,
			at: 4_500,
			missionId: 1,
			sessionCostId: "sc-1",
			model: "Sonnet",
			deltaUsd: 0.03,
		},
		{
			kind: "dispatch",
			id: 7,
			at: 5_000,
			missionId: 2,
			from: "claude_ai",
			to: "codex",
			taskClass: "sweep",
			model: "mechanical",
			durationMs: duration(800),
			status: "ok",
		},
		{ kind: "activity", id: 8, at: 6_000, missionId: 2, activityId: 203 },
		{
			kind: "cost",
			id: 9,
			at: 6_500,
			missionId: 2,
			sessionCostId: "sc-2",
			model: "mechanical",
			deltaUsd: 0.02,
		},
		{
			kind: "fanout",
			id: 10,
			at: 8_000,
			missionId: 1,
			lane: 0,
			worktree: worktree(0),
			model: "Sonnet",
			phase: "spawn",
		},
		{
			kind: "fanout",
			id: 11,
			at: 8_000,
			missionId: 1,
			lane: 1,
			worktree: worktree(1),
			model: "Sonnet",
			phase: "spawn",
		},
		{
			kind: "fanout",
			id: 12,
			at: 8_200,
			missionId: 1,
			lane: 2,
			worktree: worktree(2),
			model: "mechanical",
			phase: "spawn",
		},
		{ kind: "freshness", id: 13, at: 10_000, spoke: "bridge", state: "fresh" },
		{
			kind: "fanout",
			id: 14,
			at: 10_000,
			missionId: 1,
			lane: 0,
			worktree: worktree(0),
			model: "Sonnet",
			phase: "run",
		},
		{
			kind: "fanout",
			id: 15,
			at: 10_000,
			missionId: 1,
			lane: 1,
			worktree: worktree(1),
			model: "Sonnet",
			phase: "run",
		},
		{
			kind: "fanout",
			id: 16,
			at: 10_200,
			missionId: 1,
			lane: 2,
			worktree: worktree(2),
			model: "mechanical",
			phase: "run",
		},
		{
			kind: "guard",
			id: 17,
			at: 11_000,
			missionId: 1,
			layer: "hard-deny",
			ruleConcept: "push-to-main",
			outcome: "blocked",
			adaptation: "opened-a-branch",
		},
		{
			kind: "cost",
			id: 18,
			at: 11_500,
			missionId: 1,
			sessionCostId: "sc-1",
			model: "Sonnet",
			deltaUsd: 0.14,
		},
		{
			kind: "cost",
			id: 19,
			at: 12_000,
			missionId: 1,
			sessionCostId: "sc-1",
			model: "mechanical",
			deltaUsd: 0.01,
		},
		{
			kind: "fanout",
			id: 20,
			at: 14_000,
			missionId: 1,
			lane: 0,
			worktree: worktree(0),
			model: "Sonnet",
			phase: "converge",
		},
		{
			kind: "fanout",
			id: 21,
			at: 14_000,
			missionId: 1,
			lane: 1,
			worktree: worktree(1),
			model: "Sonnet",
			phase: "converge",
		},
		{
			kind: "fanout",
			id: 22,
			at: 14_200,
			missionId: 1,
			lane: 2,
			worktree: worktree(2),
			model: "mechanical",
			phase: "converge",
		},
		{
			kind: "verify",
			id: 23,
			at: 15_000,
			missionId: 1,
			attempt: 1,
			result: "block",
		},
		{
			kind: "cost",
			id: 24,
			at: 15_500,
			missionId: 1,
			sessionCostId: "sc-1",
			model: "Sonnet",
			deltaUsd: 0.09,
		},
		{
			kind: "verify",
			id: 25,
			at: 17_000,
			missionId: 1,
			attempt: 2,
			result: "pass",
		},
		{ kind: "activity", id: 26, at: 17_400, missionId: 1, activityId: 202 },
		{
			kind: "ship",
			id: 27,
			at: 18_000,
			missionId: 1,
			activityId: 202,
			downstreamSystem: "notion",
			downstreamRef: `buildlog/${corveth}`,
		},
		{
			kind: "handoff",
			id: 28,
			at: 18_500,
			missionId: 1,
			handoffId: 1,
			stage: "receipt",
		},
		{
			kind: "handoff",
			id: 29,
			at: 19_000,
			missionId: 1,
			handoffId: 1,
			stage: "clear",
		},
		{
			kind: "freshness",
			id: 30,
			at: 20_000,
			spoke: "event-bus",
			state: "fresh",
		},
		{ kind: "activity", id: 31, at: 22_000, missionId: 2, activityId: 204 },
		{
			kind: "handoff",
			id: 32,
			at: 25_000,
			missionId: 3,
			handoffId: 2,
			stage: "dispatch",
		},
		{
			kind: "handoff",
			id: 33,
			at: 26_000,
			missionId: 3,
			handoffId: 2,
			stage: "pickup",
		},
		{
			kind: "dispatch",
			id: 34,
			at: 30_000,
			missionId: 4,
			from: "claude_ai",
			to: "claude_ai",
			taskClass: "essay",
			model: "Opus",
			durationMs: duration(2_000),
			status: "ok",
		},
		{ kind: "activity", id: 35, at: 31_000, missionId: 4, activityId: 205 },
		{ kind: "freshness", id: 36, at: 35_000, spoke: "auditor", state: "aging" },
		{
			kind: "hubflow",
			id: 37,
			at: 40_000,
			stage: "draft",
			artifactId: HUB_ARTIFACT_ID,
		},
		{
			kind: "hubflow",
			id: 38,
			at: 42_000,
			stage: "approval",
			artifactId: HUB_ARTIFACT_ID,
		},
		{
			kind: "hubflow",
			id: 39,
			at: 44_000,
			stage: "send",
			artifactId: HUB_ARTIFACT_ID,
		},
		{ kind: "activity", id: 40, at: 45_000, missionId: null, activityId: 207 },
		{ kind: "freshness", id: 41, at: 50_000, spoke: "overlay", state: "stale" },
		{ kind: "activity", id: 42, at: 55_000, missionId: null, activityId: 208 },
		{
			kind: "dispatch",
			id: 43,
			at: 60_000,
			missionId: 5,
			from: "cc",
			to: "autonomous",
			taskClass: "audit",
			model: "Haiku",
			durationMs: duration(500),
			status: "ok",
		},
		{ kind: "activity", id: 44, at: 61_000, missionId: 5, activityId: 206 },
		{
			kind: "freshness",
			id: 45,
			at: 65_000,
			spoke: "evals-ledger",
			state: "fresh",
		},
		{ kind: "freshness", id: 46, at: 70_000, spoke: "auditor", state: "fresh" },
	];

	return {
		meta: {
			seed: seed >>> 0,
			version: "1.0.0",
			sessionLengthMs: 90_000,
			heroMissionId: 1,
			synthetic: true,
		},
		activity,
		handoffs,
		snapshots,
		costRecords,
		sessionCosts,
		sections,
		events,
	};
}
