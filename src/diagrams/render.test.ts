import { existsSync, readFileSync } from "node:fs";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { DIAGRAMS } from "./index.ts";
import { MechanismFigure } from "./MechanismFigure.tsx";
import { type DiagramModel, type Geometry, textSet } from "./model.ts";
import { renderDocs } from "./render-docs.ts";
import { PALETTE, arrowTones, escapeXml, renderSvgString } from "./render-string.ts";

const geometry: Geometry = {
	viewBox: "0 0 200 100",
	rects: [{ x: 10, y: 10, w: 60, h: 30, fill: "raised", stroke: "line" }],
	lines: [
		{ x1: 70, y1: 25, x2: 120, y2: 25, stroke: "fg", arrow: true },
		{ x1: 70, y1: 60, x2: 120, y2: 60, stroke: "accent", arrow: true, dash: "2 4" },
	],
	paths: [],
	circles: [{ cx: 150, cy: 25, r: 4, fill: "accent" }],
	texts: [
		{ x: 40, y: 30, text: "a & b <c>", size: 12, tone: "fg", anchor: "middle", bold: true },
		{ x: 10, y: 90, text: "footnote", size: 10, tone: "muted" },
	],
};

const fixture: DiagramModel = {
	id: "closure",
	eyebrow: "Fixture",
	title: "Fixture",
	ariaLabel: "A fixture diagram",
	figcaption: "Caption",
	verify: "run the tests",
	claims: ["public-release-closure"],
	scene: "coda",
	wide: geometry,
	compact: geometry,
};

const ENTITY: Record<string, string> = {
	"&amp;": "&",
	"&lt;": "<",
	"&gt;": ">",
	"&quot;": '"',
	"&#x27;": "'",
};

/** `<text ...>label</text>` contents of any SVG markup, decoded in one pass. */
export function textsIn(markup: string): Set<string> {
	const out = new Set<string>();
	for (const m of markup.matchAll(/<text[^>]*>([^<]*)<\/text>/g)) {
		out.add((m[1] ?? "").replace(/&(?:amp|lt|gt|quot|#x27);/g, (entity) => ENTITY[entity] ?? entity));
	}
	return out;
}

describe("renderSvgString", () => {
	it("is byte-stable and self-contained", () => {
		const a = renderSvgString(fixture, "wide", "deck");
		const b = renderSvgString(fixture, "wide", "deck");
		expect(a).toBe(b);
		expect(a.startsWith('<svg xmlns="http://www.w3.org/2000/svg"')).toBe(true);
		expect(a).toContain('role="img"');
		expect(a).toContain('aria-label="A fixture diagram"');
		expect(a).not.toContain("<style");
		expect(a).not.toContain("<script");
		expect(a).not.toContain("currentColor");
	});

	it("paints each ground with literal colours", () => {
		const deck = renderSvgString(fixture, "wide", "deck");
		const paper = renderSvgString(fixture, "wide", "paper");
		expect(deck).toContain('fill="#15191e"');
		expect(deck).toContain('fill="#ff7a4d"');
		expect(paper).toContain('fill="#f4efe4"');
		expect(paper).toContain('fill="#b0451d"');
		expect(deck).not.toBe(paper);
	});

	it("declares an arrow marker only for tones that carry an arrow", () => {
		expect(arrowTones(geometry)).toEqual(["accent", "fg"]);
		const svg = renderSvgString(fixture, "wide", "deck");
		expect(svg).toContain('id="closure-arrow-fg"');
		expect(svg).toContain('id="closure-arrow-accent"');
		expect(svg).not.toContain('id="closure-arrow-muted"');
	});

	it("escapes text", () => {
		expect(escapeXml('a & b <c> "d"')).toBe("a &amp; b &lt;c&gt; &quot;d&quot;");
		expect(textsIn(renderSvgString(fixture, "wide", "deck"))).toEqual(
			textSet(geometry),
		);
	});
});

describe("MechanismFigure", () => {
	it("prints the same labels the docs export prints", () => {
		const app = renderToStaticMarkup(createElement(MechanismFigure, { model: fixture }));
		expect(textsIn(app)).toEqual(textsIn(renderSvgString(fixture, "wide", "deck")));
		expect(app).toContain('role="img"');
		expect(app).toContain('aria-label="A fixture diagram"');
		expect(app).toContain("Explainer-local verified");
		expect(app).toContain("run the tests");
	});
});

describe("every registered diagram", () => {
	it.each(Object.values(DIAGRAMS).map((m) => [m.id, m] as const))(
		"%s: the app and the docs export print the same labels, on both grounds",
		(_id, model) => {
			const app = textsIn(renderToStaticMarkup(createElement(MechanismFigure, { model })));
			expect(app).toEqual(textSet(model.wide));
			for (const ground of ["deck", "paper"] as const) {
				expect(textsIn(renderSvgString(model, "wide", ground))).toEqual(textSet(model.wide));
				expect(textsIn(renderSvgString(model, "compact", ground))).toEqual(
					textSet(model.compact),
				);
			}
		},
	);

	it.each(Object.values(DIAGRAMS).map((m) => [m.id, m] as const))(
		"%s: the committed docs files match a fresh render byte for byte",
		(id, model) => {
			for (const ground of ["deck", "paper"] as const) {
				const file = `public/diagrams/${id}-${ground}.svg`;
				expect(existsSync(file), `${file} missing: run pnpm diagrams`).toBe(true);
				expect(readFileSync(file, "utf8"), `${file} stale: run pnpm diagrams`).toBe(
					renderSvgString(model, "wide", ground),
				);
			}
		},
	);

	it("the committed docs page matches a fresh render byte for byte", () => {
		const fresh = renderDocs(Object.values(DIAGRAMS));
		expect(readFileSync("docs/mechanisms.md", "utf8"), "run pnpm diagrams").toBe(fresh);
		for (const model of Object.values(DIAGRAMS)) {
			expect(fresh).toContain(model.figcaption);
			expect(fresh).toContain(model.verify);
			expect(fresh).toContain(`public/diagrams/${model.id}-deck.svg`);
		}
		expect(fresh).not.toMatch(/\u2014/);
	});
});

describe("the docs palette", () => {
	// The contrast gate reads the real stylesheet; the SVG files carry literal
	// colours, so they must be the same bytes the stylesheet declares.
	const css = readFileSync("src/index.css", "utf8");
	const token = (name: string) => {
		const m = new RegExp(`${name}:\\s*(#[0-9a-fA-F]{6})`).exec(css);
		if (!m) throw new Error(`token ${name} not found in src/index.css`);
		return m[1];
	};
	it("matches the stylesheet tokens", () => {
		expect(PALETTE.deck).toEqual({
			bg: token("--deck"),
			fg: token("--ink-deck"),
			muted: token("--ink-deck-muted"),
			line: token("--deck-line"),
			raised: token("--deck-raised"),
			accent: token("--accent-deck"),
		});
		expect(PALETTE.paper.bg).toBe(token("--paper"));
		expect(PALETTE.paper.fg).toBe(token("--ink"));
		expect(PALETTE.paper.muted).toBe(token("--ink-muted"));
		expect(PALETTE.paper.accent).toBe(token("--accent"));
	});
});
