// @vitest-environment node
import { describe, expect, it } from "vitest";
import { architectureManifest } from "../data/architecture-manifest.ts";
import { COMPACT_MAX_VIEWPORT, MIN_LABEL_PX } from "../lib/useVizScale.ts";
import { SCENES } from "../scenes/index.ts";
import { ASSURANCE_RANK, assuranceFor, claimAssurance } from "./assurance.ts";
import { DIAGRAMS, diagramsFor } from "./index.ts";
import { DIAGRAM_IDS, type Geometry, type Text, textSet } from "./model.ts";

const NO_EM_DASH = /^[^\u2014]*$/;
const NO_MONEY = /^[^$]*$/;
const NO_HOME_PATH = /^(?!.*(?:\/Users\/|~\/|[A-Za-z]:\\)).*$/s;

/**
 * The narrowest phone the e2e suite exercises is 320px; the scene frame
 * leaves the figure about 288px. useVizScale floors every compact label so
 * it renders at MIN_LABEL_PX there, and that floored size is what the
 * geometry has to survive.
 */
const NARROWEST_FIGURE_PX = 288;
const GLYPH_EM = 0.63; // Space Mono advance width is 0.612em; bold and hinting add a little

function renderedSize(g: Geometry, t: Text, variant: "wide" | "compact"): number {
	if (variant === "wide") return t.size;
	const k = NARROWEST_FIGURE_PX / Number(g.viewBox.split(/\s+/)[2]);
	const floor = MIN_LABEL_PX / k;
	return t.size < floor ? floor : t.size;
}

function box(g: Geometry, t: Text, variant: "wide" | "compact") {
	const size = renderedSize(g, t, variant);
	const run = t.text.length * size * GLYPH_EM + (t.tracking ?? 0) * t.text.length;
	const left = t.anchor === "end" ? t.x - run : t.anchor === "middle" ? t.x - run / 2 : t.x;
	return { left, right: left + run, top: t.y - size * 0.8, bottom: t.y + size * 0.2 };
}

const variants = (m: (typeof DIAGRAMS)[keyof typeof DIAGRAMS]) =>
	[
		["wide", m.wide],
		["compact", m.compact],
	] as const;

describe("diagram registry", () => {
	it("registers every diagram id exactly once, keyed by its own id", () => {
		expect(Object.keys(DIAGRAMS).sort()).toEqual([...DIAGRAM_IDS].sort());
		for (const [key, model] of Object.entries(DIAGRAMS)) expect(model.id).toBe(key);
	});

	it("depicts only manifest claims and wears the weakest one as its badge", () => {
		const manifestIds = new Set(architectureManifest.claims.map((c) => c.id));
		for (const model of Object.values(DIAGRAMS)) {
			expect(model.claims.length, `${model.id} needs a claim`).toBeGreaterThan(0);
			for (const id of model.claims) expect(manifestIds.has(id), `${model.id} -> ${id}`).toBe(true);
			const badge = assuranceFor(model.claims);
			for (const id of model.claims) {
				expect(ASSURANCE_RANK[badge]).toBeLessThanOrEqual(ASSURANCE_RANK[claimAssurance(id)]);
			}
		}
	});

	it("is placed on a scene that declares the same claims", () => {
		for (const model of Object.values(DIAGRAMS)) {
			const scene = Object.values(SCENES).find((s) => s.lens === model.scene);
			expect(scene, `${model.id} names an unknown scene`).toBeDefined();
			for (const id of model.claims) {
				expect(scene?.architectureClaims, `${model.id} on ${model.scene} lacks ${id}`).toContain(id);
			}
		}
		expect(diagramsFor("spine").map((d) => d.id)).toEqual(["lease", "spine-rows"]);
		expect(diagramsFor("hub").map((d) => d.id)).toEqual(["airlock", "freshness"]);
		expect(diagramsFor("safety").map((d) => d.id)).toEqual(["guards"]);
		expect(diagramsFor("coda").map((d) => d.id)).toEqual(["closure"]);
		expect(diagramsFor("fleet")).toEqual([]);
		expect(diagramsFor("finale")).toEqual([]);
		expect(diagramsFor("cold-open")).toEqual([]);
	});

	it("prints exactly the same labels on the phone layout as on the wide one", () => {
		for (const model of Object.values(DIAGRAMS)) {
			expect([...textSet(model.compact)].sort(), model.id).toEqual([...textSet(model.wide)].sort());
		}
	});

	it("keeps its copy inside the public-safe rules", () => {
		for (const model of Object.values(DIAGRAMS)) {
			const copy = [
				model.eyebrow,
				model.title,
				model.ariaLabel,
				model.figcaption,
				model.verify,
				...model.wide.texts.map((t) => t.text),
				...model.compact.texts.map((t) => t.text),
			];
			for (const s of copy) {
				expect(s, `${model.id}: em dash`).toMatch(NO_EM_DASH);
				expect(s, `${model.id}: money`).toMatch(NO_MONEY);
				expect(s, `${model.id}: home path`).toMatch(NO_HOME_PATH);
				expect(s.trim().length, `${model.id}: empty label`).toBeGreaterThan(0);
			}
			expect(model.wide.viewBox.startsWith("0 0 1120 ")).toBe(true);
			expect(model.compact.viewBox.startsWith("0 0 340 ")).toBe(true);
		}
	});

	it("keeps every label inside its viewBox at the size it will render", () => {
		expect(COMPACT_MAX_VIEWPORT).toBeGreaterThan(NARROWEST_FIGURE_PX);
		for (const model of Object.values(DIAGRAMS)) {
			for (const [name, g] of variants(model)) {
				const [, , w, h] = g.viewBox.split(/\s+/).map(Number);
				for (const t of g.texts) {
					const b = box(g, t, name);
					expect(b.left, `${model.id} ${name}: "${t.text}" runs off the left`).toBeGreaterThanOrEqual(-1);
					expect(b.right, `${model.id} ${name}: "${t.text}" runs off the right`).toBeLessThanOrEqual(w + 1);
					expect(b.bottom, `${model.id} ${name}: "${t.text}" runs off the bottom`).toBeLessThanOrEqual(h);
					expect(b.top, `${model.id} ${name}: "${t.text}" runs off the top`).toBeGreaterThanOrEqual(0);
				}
			}
		}
	});

	it("never prints two labels over each other", () => {
		for (const model of Object.values(DIAGRAMS)) {
			for (const [name, g] of variants(model)) {
				const boxes = g.texts.map((t) => ({ t, b: box(g, t, name) }));
				for (let i = 0; i < boxes.length; i++) {
					for (let j = i + 1; j < boxes.length; j++) {
						const a = boxes[i];
						const c = boxes[j];
						if (!a || !c) continue;
						const overlap =
							a.b.left < c.b.right && c.b.left < a.b.right && a.b.top < c.b.bottom && c.b.top < a.b.bottom;
						expect(overlap, `${model.id} ${name}: "${a.t.text}" collides with "${c.t.text}"`).toBe(false);
					}
				}
			}
		}
	});
});
