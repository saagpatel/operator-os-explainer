// @vitest-environment node
import { existsSync, readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { closureViolations } from "./closure.ts";
import { generate, SEED } from "./generate.ts";

// The authored target lives under prep/, which the publish filter strips from
// the release lineage (RELEASE.md). It is JSON-identical to the committed
// dataset.json, so where it is absent the byte-for-byte artifact assertion
// below pins the same generator output.
const GOLDEN_FIXTURE = "prep/sample-timeline.json";
const hasGoldenFixture = existsSync(GOLDEN_FIXTURE);

describe("generator determinism + golden fixture", () => {
	it.runIf(hasGoldenFixture)(
		"reproduces prep/sample-timeline.json exactly at the canonical seed",
		() => {
			const golden = JSON.parse(readFileSync(GOLDEN_FIXTURE, "utf8"));
			expect(generate(SEED)).toEqual(golden);
		},
	);

	it("is byte-identical across two runs", () => {
		expect(JSON.stringify(generate())).toBe(JSON.stringify(generate()));
	});

	it("matches the committed dataset.json artifact byte-for-byte", () => {
		const artifact = readFileSync("src/data/dataset.json", "utf8");
		expect(`${JSON.stringify(generate(), null, "\t")}\n`).toBe(artifact);
	});
});

describe("closure (the default-deny guarantee, SPEC 3.3)", () => {
	it("emits zero violations for the shipped dataset", () => {
		expect(closureViolations(generate())).toEqual([]);
	});

	it("catches a planted out-of-vocabulary summary", () => {
		const d = generate();
		d.activity[0].summary = "model-authored free text that must never ship";
		expect(closureViolations(d).join("\n")).toContain("summary");
	});

	it("catches a planted real-looking path", () => {
		const d = generate();
		d.handoffs[0].projectPath = "/home/nobody/leak";
		expect(closureViolations(d).join("\n")).toContain("projectPath");
	});

	it("catches a broken reconciliation invariant", () => {
		const d = generate();
		d.sessionCosts[0].costUsd = 9.99;
		expect(closureViolations(d).join("\n")).toContain("mission 1");
	});

	it("catches unsorted events", () => {
		const d = generate();
		d.events.reverse();
		expect(closureViolations(d).join("\n")).toContain("sorted");
	});
});
