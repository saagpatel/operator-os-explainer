import { describe, expect, it } from "vitest";
import { formatClock } from "./format";

describe("formatClock", () => {
	it("formats known values", () => {
		expect(formatClock(0)).toBe("00:00.000");
		expect(formatClock(4_500)).toBe("00:04.500");
		expect(formatClock(61_001)).toBe("01:01.001");
		expect(formatClock(90_000)).toBe("01:30.000");
	});

	it("clamps negatives to zero", () => {
		expect(formatClock(-50)).toBe("00:00.000");
	});
});
