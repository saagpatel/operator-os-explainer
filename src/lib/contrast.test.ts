import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { contrastRatio } from "./contrast";

// vitest cwd is the project root; jsdom import.meta.url is not file-scheme.
const css = readFileSync("src/index.css", "utf8");

/**
 * The standing contrast gate (SPEC 4.4, Phase 0 -> Phase 9). Token values are
 * parsed from the REAL stylesheet so the test cannot drift from what ships.
 */
function token(name: string): string {
	const match = new RegExp(`${name}:\\s*(#[0-9a-fA-F]{6})`).exec(css);
	if (!match) throw new Error(`token ${name} not found in src/index.css`);
	return match[1];
}

const deck = token("--deck");
const paper = token("--paper");

// [foreground, background, expected ratio from prep/design-tokens.md]
const LEDGER: readonly [string, string, number][] = [
	[token("--ink-deck"), deck, 14.26],
	[token("--ink-deck-muted"), deck, 5.85],
	[token("--accent-deck"), deck, 6.84],
	[paper, deck, 15.39],
	[token("--ink"), paper, 14.88],
	[token("--ink-muted"), paper, 5.11],
	[token("--accent"), paper, 4.93],
];

describe("contrast ledger (WCAG 2.1 AA)", () => {
	it.each(
		LEDGER,
	)("%s on %s matches the ledger and clears AA", (fg, bg, expected) => {
		const ratio = contrastRatio(fg, bg);
		expect(ratio).toBeCloseTo(expected, 2);
		expect(ratio).toBeGreaterThanOrEqual(4.5);
	});

	it("REJECTS --ink-muted on the deck (the banned pairing)", () => {
		const ratio = contrastRatio(token("--ink-muted"), deck);
		expect(ratio).toBeCloseTo(3.01, 2);
		expect(ratio).toBeLessThan(4.5);
	});

	it("keeps --ink-deck-muted well clear of the AA floor", () => {
		expect(
			contrastRatio(token("--ink-deck-muted"), deck),
		).toBeGreaterThanOrEqual(4.5);
	});
});
