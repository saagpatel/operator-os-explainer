/**
 * Closure checker (SPEC 3.3 mechanism 4, the real guarantee). Walks a whole
 * Dataset and returns a violation string for every value that is NOT a member
 * of its field's closed allowlist (or a template over members). An empty
 * return IS the default-deny proof: nothing outside the audited sets ships.
 */
import type { Dataset } from "../types/data.ts";
import {
	ACTIVITY_TAGS,
	ADAPTATIONS,
	ARTIFACTS,
	CALLERS,
	CODENAMES,
	COST_NOTES,
	COST_SYSTEMS,
	DISPATCH_STATUSES,
	FANOUT_PHASES,
	FLEET_NODES,
	FRESHNESS_STATES,
	GUARD_LAYERS,
	HANDOFF_STAGES,
	HANDOFF_STATUSES,
	HUB_ARTIFACT_ID,
	HUBFLOW_STAGES,
	LESSONS,
	MODEL_TIERS,
	PATTERNS,
	PHASES,
	ROADMAP_FILES,
	RULE_CONCEPTS,
	SECTION_KEYS,
	SECTION_OWNERS,
	SNAP_SYSTEMS,
	SOURCE_TRUSTS,
	SPOKES,
	sectionBody,
	slug,
	TASK_CLASSES,
	VERBS,
	VERIFY_RESULTS,
} from "./vocab.ts";

const SLUGS = CODENAMES.map((c) => slug(c));
const TIMESTAMP = /^2026-03-16T00:0[01]:[0-5]\dZ$/;
const round2 = (n: number): number => Math.round(n * 100) / 100;

export function closureViolations(d: Dataset): string[] {
	const out: string[] = [];
	const fail = (path: string, value: unknown, rule: string): void => {
		out.push(`${path} = ${JSON.stringify(value)} violates: ${rule}`);
	};
	const member = (
		path: string,
		value: unknown,
		set: readonly unknown[],
		label: string,
	): void => {
		if (!set.includes(value)) fail(path, value, `must be a member of ${label}`);
	};
	const memberOrNull = (
		path: string,
		value: unknown,
		set: readonly unknown[],
		label: string,
	): void => {
		if (value !== null) member(path, value, set, label);
	};
	const timestamp = (path: string, value: unknown): void => {
		if (typeof value !== "string" || !TIMESTAMP.test(value))
			fail(path, value, "must be an ISO second in the fabricated window");
	};
	const rounded = (path: string, value: unknown): void => {
		if (
			typeof value !== "number" ||
			!Number.isFinite(value) ||
			round2(value) !== value
		)
			fail(path, value, "must be a finite number rounded to <=2 decimals");
	};

	// ---- meta ----
	if (d.meta.synthetic !== true)
		fail("meta.synthetic", d.meta.synthetic, "must be true");
	if (d.meta.sessionLengthMs !== 90_000)
		fail("meta.sessionLengthMs", d.meta.sessionLengthMs, "must be 90000");
	if (d.meta.heroMissionId !== 1)
		fail("meta.heroMissionId", d.meta.heroMissionId, "must be 1");

	// ---- activity ----
	for (const a of d.activity) {
		const p = `activity[${a.id}]`;
		member(`${p}.source`, a.source, CALLERS, "CALLERS");
		member(`${p}.projectName`, a.projectName, CODENAMES, "CODENAMES");
		member(`${p}.sourceTrust`, a.sourceTrust, SOURCE_TRUSTS, "SOURCE_TRUSTS");
		timestamp(`${p}.timestamp`, a.timestamp);
		for (const tag of a.tags)
			member(`${p}.tags`, tag, ACTIVITY_TAGS, "ACTIVITY_TAGS");
		const templated = VERBS.some(
			(v) =>
				a.summary.startsWith(`${v} `) &&
				(ARTIFACTS as readonly string[]).includes(
					a.summary.slice(v.length + 1),
				),
		);
		if (!templated)
			fail(
				`${p}.summary`,
				a.summary,
				"must be `${VERB} ${ARTIFACT}` over the closed lists",
			);
		if (a.branch !== null) {
			const m = /^(feat|fix)\/([a-z]+)$/.exec(a.branch);
			if (!m || !SLUGS.includes(m[2]))
				fail(
					`${p}.branch`,
					a.branch,
					"must be feat|fix/<codename slug> or null",
				);
		}
	}

	// ---- handoffs ----
	for (const h of d.handoffs) {
		const p = `handoffs[${h.id}]`;
		member(`${p}.projectName`, h.projectName, CODENAMES, "CODENAMES");
		if (h.dispatchedFrom !== "claude_ai")
			fail(`${p}.dispatchedFrom`, h.dispatchedFrom, "must be claude_ai");
		if (h.projectPath !== null) {
			const m = /^~\/workspace\/([a-z]+)$/.exec(h.projectPath);
			if (!m || !SLUGS.includes(m[1]))
				fail(
					`${p}.projectPath`,
					h.projectPath,
					"must be ~/workspace/<codename slug> or null",
				);
		}
		memberOrNull(
			`${p}.roadmapFile`,
			h.roadmapFile,
			ROADMAP_FILES,
			"ROADMAP_FILES",
		);
		memberOrNull(`${p}.phase`, h.phase, PHASES, "PHASES");
		member(`${p}.status`, h.status, HANDOFF_STATUSES, "HANDOFF_STATUSES");
		memberOrNull(`${p}.claimedBy`, h.claimedBy, CALLERS, "CALLERS");
		member(`${p}.sourceTrust`, h.sourceTrust, SOURCE_TRUSTS, "SOURCE_TRUSTS");
		timestamp(`${p}.dispatchedAt`, h.dispatchedAt);
		if (h.pickedUpAt !== null) timestamp(`${p}.pickedUpAt`, h.pickedUpAt);
		if (h.clearedAt !== null) timestamp(`${p}.clearedAt`, h.clearedAt);
	}

	// ---- snapshots ----
	for (const s of d.snapshots) {
		const p = `snapshots[${s.id}]`;
		member(`${p}.system`, s.system, SNAP_SYSTEMS, "SNAP_SYSTEMS");
		if (s.snapshotDate !== "2026-03-16")
			fail(`${p}.snapshotDate`, s.snapshotDate, "must be the fabricated date");
		member(`${p}.sourceTrust`, s.sourceTrust, SOURCE_TRUSTS, "SOURCE_TRUSTS");
		timestamp(`${p}.createdAt`, s.createdAt);
		for (const proj of s.data.activeProjects)
			member(`${p}.data.activeProjects`, proj, CODENAMES, "CODENAMES");
		for (const l of s.data.lessons)
			member(`${p}.data.lessons`, l, LESSONS, "LESSONS");
		for (const pat of s.data.patterns)
			member(`${p}.data.patterns`, pat, PATTERNS, "PATTERNS");
	}

	// ---- costRecords ----
	for (const c of d.costRecords) {
		const p = `costRecords[${c.id}]`;
		member(`${p}.system`, c.system, COST_SYSTEMS, "COST_SYSTEMS");
		if (c.month !== "2026-03")
			fail(`${p}.month`, c.month, "must be the fabricated month");
		rounded(`${p}.amount`, c.amount);
		memberOrNull(`${p}.notes`, c.notes, COST_NOTES, "COST_NOTES");
	}

	// ---- sessionCosts ----
	for (const sc of d.sessionCosts) {
		const p = `sessionCosts[${sc.sessionId}]`;
		if (!/^sc-\d+$/.test(sc.sessionId))
			fail(`${p}.sessionId`, sc.sessionId, "must match sc-<n>");
		member(`${p}.projectName`, sc.projectName, CODENAMES, "CODENAMES");
		member(`${p}.source`, sc.source, CALLERS, "CALLERS");
		timestamp(`${p}.startedAt`, sc.startedAt);
		rounded(`${p}.costUsd`, sc.costUsd);
		let breakdownSum = 0;
		for (const [tier, usd] of Object.entries(sc.modelBreakdown)) {
			member(`${p}.modelBreakdown`, tier, MODEL_TIERS, "MODEL_TIERS");
			rounded(`${p}.modelBreakdown.${tier}`, usd);
			breakdownSum += usd;
		}
		if (round2(breakdownSum) !== sc.costUsd)
			fail(
				`${p}.modelBreakdown`,
				breakdownSum,
				`must sum to costUsd ${sc.costUsd}`,
			);
	}

	// ---- sections ----
	for (const s of d.sections) {
		const p = `sections[${s.sectionName}]`;
		member(`${p}.sectionName`, s.sectionName, SECTION_KEYS, "SECTION_KEYS");
		member(`${p}.owner`, s.owner, SECTION_OWNERS, "SECTION_OWNERS");
		timestamp(`${p}.updatedAt`, s.updatedAt);
		if (s.content !== sectionBody(s.sectionName))
			fail(`${p}.content`, s.content, "must be the templated section body");
	}

	// ---- events ----
	const activityIds = new Set(d.activity.map((a) => a.id));
	const handoffIds = new Set(d.handoffs.map((h) => h.id));
	const sessionCostIds = new Set(d.sessionCosts.map((sc) => sc.sessionId));
	const eventIds = new Set<number>();
	let prevAt = -1;
	for (const e of d.events) {
		const p = `events[${e.id}]`;
		if (eventIds.has(e.id)) fail(`${p}.id`, e.id, "must be unique");
		eventIds.add(e.id);
		if (e.at < prevAt)
			fail(`${p}.at`, e.at, "events must be sorted ascending by at");
		prevAt = e.at;
		if (!Number.isInteger(e.at) || e.at < 0 || e.at > 90_000)
			fail(`${p}.at`, e.at, "must be an integer in [0, 90000]");

		switch (e.kind) {
			case "dispatch":
				member(`${p}.from`, e.from, CALLERS, "CALLERS");
				member(`${p}.to`, e.to, FLEET_NODES, "FLEET_NODES");
				member(`${p}.taskClass`, e.taskClass, TASK_CLASSES, "TASK_CLASSES");
				member(`${p}.model`, e.model, MODEL_TIERS, "MODEL_TIERS");
				member(`${p}.status`, e.status, DISPATCH_STATUSES, "DISPATCH_STATUSES");
				if (
					!Number.isInteger(e.durationMs) ||
					e.durationMs < 200 ||
					e.durationMs > 2_400
				)
					fail(
						`${p}.durationMs`,
						e.durationMs,
						"must be an integer in [200, 2400]",
					);
				break;
			case "activity":
				if (!activityIds.has(e.activityId))
					fail(`${p}.activityId`, e.activityId, "must reference an Activity");
				break;
			case "handoff":
				member(`${p}.stage`, e.stage, HANDOFF_STAGES, "HANDOFF_STAGES");
				if (!handoffIds.has(e.handoffId))
					fail(`${p}.handoffId`, e.handoffId, "must reference a Handoff");
				break;
			case "guard":
				member(`${p}.layer`, e.layer, GUARD_LAYERS, "GUARD_LAYERS");
				member(
					`${p}.ruleConcept`,
					e.ruleConcept,
					RULE_CONCEPTS,
					"RULE_CONCEPTS",
				);
				member(`${p}.adaptation`, e.adaptation, ADAPTATIONS, "ADAPTATIONS");
				if (e.outcome !== "blocked")
					fail(`${p}.outcome`, e.outcome, "must be blocked");
				break;
			case "fanout": {
				member(`${p}.model`, e.model, MODEL_TIERS, "MODEL_TIERS");
				member(`${p}.phase`, e.phase, FANOUT_PHASES, "FANOUT_PHASES");
				const m = /^wt\/([a-z]+)-(\d)$/.exec(e.worktree);
				if (!m || !SLUGS.includes(m[1]) || Number(m[2]) !== e.lane)
					fail(
						`${p}.worktree`,
						e.worktree,
						"must be wt/<codename slug>-<lane>",
					);
				break;
			}
			case "verify":
				member(`${p}.result`, e.result, VERIFY_RESULTS, "VERIFY_RESULTS");
				if (!Number.isInteger(e.attempt) || e.attempt < 1)
					fail(`${p}.attempt`, e.attempt, "must be a positive integer");
				break;
			case "ship": {
				if (!activityIds.has(e.activityId))
					fail(`${p}.activityId`, e.activityId, "must reference an Activity");
				if (e.downstreamSystem !== "notion")
					fail(`${p}.downstreamSystem`, e.downstreamSystem, "must be notion");
				const m = /^buildlog\/([a-z]+)$/.exec(e.downstreamRef);
				if (!m || !SLUGS.includes(m[1]))
					fail(
						`${p}.downstreamRef`,
						e.downstreamRef,
						"must be buildlog/<codename slug>",
					);
				break;
			}
			case "freshness":
				member(`${p}.spoke`, e.spoke, SPOKES, "SPOKES");
				member(`${p}.state`, e.state, FRESHNESS_STATES, "FRESHNESS_STATES");
				break;
			case "hubflow":
				member(`${p}.stage`, e.stage, HUBFLOW_STAGES, "HUBFLOW_STAGES");
				if (e.artifactId !== HUB_ARTIFACT_ID)
					fail(
						`${p}.artifactId`,
						e.artifactId,
						"must be the closed hub artifact id",
					);
				break;
			case "cost":
				member(`${p}.model`, e.model, MODEL_TIERS, "MODEL_TIERS");
				rounded(`${p}.deltaUsd`, e.deltaUsd);
				if (!sessionCostIds.has(e.sessionCostId))
					fail(
						`${p}.sessionCostId`,
						e.sessionCostId,
						"must reference a SessionCost",
					);
				break;
		}
	}

	// ---- reconciliation invariant (DATA-MODEL §4 item 5) ----
	for (const sc of d.sessionCosts) {
		if (sc.missionId === null) continue;
		const sum = d.events
			.filter((e) => e.kind === "cost" && e.missionId === sc.missionId)
			.reduce((acc, e) => acc + (e.kind === "cost" ? e.deltaUsd : 0), 0);
		if (round2(sum) !== round2(sc.costUsd))
			out.push(
				`mission ${sc.missionId}: cost deltas sum ${round2(sum)} !== sessionCost ${sc.costUsd}`,
			);
	}

	return out;
}
