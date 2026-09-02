// @vitest-environment node
import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { SEED } from "../data/generate.ts";
import { ASSURANCE_RANK, assuranceFor } from "./assurance.ts";
import {
	datasetCounts,
	fmtGap,
	fmtT,
	freshnessTicks,
	guardEvents,
	guardRows,
	handoffStageTimes,
	heroHandoff,
	hubflowStages,
	seedHex,
	shippedActivity,
	sourceRevision,
	vocabSizes,
} from "./facts.ts";

/**
 * Golden facts the diagrams print. These are pinned on purpose: regenerating
 * the dataset with a different story must fail here, loudly and by name,
 * rather than let a diagram drift away from the replay it describes.
 */
describe("diagram facts", () => {
	it("formats clock times the way the console does", () => {
		expect(fmtT(1500)).toBe("T+1.5 s");
		expect(fmtT(40000)).toBe("T+40.0 s");
		expect(fmtGap(3000, 18500)).toBe("15.5 s");
	});

	it("pins the hero handoff's five stages and its row", () => {
		expect(handoffStageTimes(1)).toEqual({
			dispatch: 1500,
			snapshot: 2200,
			pickup: 3000,
			receipt: 18500,
			clear: 19000,
		});
		const row = heroHandoff();
		expect(row.projectName).toBe("Corveth");
		expect(row.phase).toBe("implement");
		expect(row.status).toBe("cleared");
		expect(row.claimedBy).toBe("cc");
		expect(row.dispatchedFrom).toBe("claude_ai");
	});

	it("pins the receipt chain: SHIPPED activity, ship event, downstream ref", () => {
		const { ship, activity, revealAt } = shippedActivity();
		expect(activity.summary).toBe("shipped the export pipeline");
		expect(activity.tags).toEqual(["SHIPPED"]);
		expect(revealAt).toBe(17400);
		expect(ship.at).toBe(18000);
		expect(ship.downstreamRef).toBe("buildlog/corveth");
	});

	it("pins the one guard event and the six-row guard map", () => {
		expect(guardEvents()).toHaveLength(1);
		expect(guardEvents()[0]).toMatchObject({
			at: 11000,
			layer: "hard-deny",
			ruleConcept: "push-to-main",
			adaptation: "opened-a-branch",
		});
		expect(guardRows()).toEqual([
			{ rule: "push-to-main", layer: "hard-deny", adaptation: "opened-a-branch" },
			{ rule: "credential-read", layer: "deny-list", adaptation: "escalated-to-operator" },
			{ rule: "non-local-db-write", layer: "pretooluse-hook", adaptation: "reworded" },
			{ rule: "harness-self-mutate", layer: "hard-deny", adaptation: "escalated-to-operator" },
			{ rule: "deep-home-delete", layer: "pretooluse-hook", adaptation: "rerouted" },
			{ rule: "unverified-complete", layer: "verify-gate", adaptation: "ran-verify-first" },
		]);
	});

	it("pins the freshness ticks and the three airlock stages", () => {
		expect(freshnessTicks().map((e) => [e.at, e.spoke, e.state])).toEqual([
			[10000, "bridge", "fresh"],
			[20000, "event-bus", "fresh"],
			[35000, "auditor", "aging"],
			[50000, "overlay", "stale"],
			[65000, "evals-ledger", "fresh"],
			[70000, "auditor", "fresh"],
		]);
		expect(hubflowStages().map((e) => [e.at, e.stage, e.artifactId])).toEqual([
			[40000, "draft", "draft-71"],
			[42000, "approval", "draft-71"],
			[44000, "send", "draft-71"],
		]);
	});

	it("pins the counts, the vocabulary sizes, and the seed", () => {
		expect(datasetCounts()).toEqual({ events: 46, activity: 8, handoffs: 2 });
		expect(vocabSizes()).toEqual({
			codenames: 24,
			taskClasses: 8,
			guardLayers: 7,
			ruleConcepts: 6,
			adaptations: 5,
			spokes: 5,
		});
		expect(seedHex()).toBe("0x0fe7a123");
		expect(Number(seedHex())).toBe(SEED);
	});

	it("only claims sourcemaps are off because vite.config.ts says so", () => {
		const config = readFileSync("vite.config.ts", "utf8");
		expect(config).toMatch(/sourcemap:\s*false/);
	});

	it("shortens a pinned public source revision for a verify line", () => {
		expect(sourceRevision("bridge-db-public-source")).toMatch(/^[0-9a-f]{7}$/);
		expect(() => sourceRevision("operator-practice-attestation")).toThrow();
	});

	it("badges a diagram with the weakest claim it depicts", () => {
		expect(assuranceFor(["bridge-sqlite-spine"])).toBe("public_source_verified");
		expect(
			assuranceFor(["public-release-closure", "deterministic-synthetic-replay"]),
		).toBe("explainer_local_verified");
		expect(
			assuranceFor(["bridge-sqlite-spine", "isolated-worktree-fanout"]),
		).toBe("operator_attested");
		expect(ASSURANCE_RANK.operator_attested).toBeLessThan(
			ASSURANCE_RANK.private_source_verified,
		);
	});
});
