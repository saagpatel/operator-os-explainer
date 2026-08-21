// @vitest-environment node
import { describe, expect, it } from "vitest";
import { closureViolations } from "./closure.ts";
import { generate } from "./generate.ts";

/**
 * Property test (SPEC 3.3 mechanism 4): the generator is a pure function
 * seed -> Dataset, and closure holds across the sampled seed space, not just
 * at the canonical seed. PRNG variety can only land inside the closed sets.
 */
describe("property: closure holds across the seed space", () => {
	it("holds for 250 sampled seeds", () => {
		for (let i = 0; i < 250; i++) {
			const seed = (i * 2654435761 + 97) >>> 0;
			const violations = closureViolations(generate(seed));
			expect(violations, `seed ${seed}`).toEqual([]);
		}
	});

	it("is deterministic per seed", () => {
		expect(JSON.stringify(generate(42))).toBe(JSON.stringify(generate(42)));
	});

	it("records the requested seed in meta", () => {
		expect(generate(42).meta.seed).toBe(42);
	});
});
