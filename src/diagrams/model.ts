/**
 * Mechanism diagrams: the data model shared by the in-app figure and the
 * docs export. A diagram is pure data (no JSX, so scripts/render-diagrams.ts
 * can import it under plain Node). Every number a diagram prints is computed
 * in facts.ts from the shipped dataset, the closed vocabularies, and the
 * manifest, never typed into a model by hand.
 */
import type { ArchitectureClaimId } from "../types/architecture.ts";
import type { Lens } from "../types/scene.ts";

/** Colour roles; each renderer maps them to its own palette. */
export type Tone = "fg" | "muted" | "line" | "raised" | "accent" | "bg";
export type Anchor = "start" | "middle" | "end";

export interface Rect {
	x: number;
	y: number;
	w: number;
	h: number;
	fill: Tone | "none";
	stroke: Tone | "none";
	strokeWidth?: number;
	dash?: string;
}
export interface Line {
	x1: number;
	y1: number;
	x2: number;
	y2: number;
	stroke: Tone;
	strokeWidth?: number;
	dash?: string;
	arrow?: boolean;
}
export interface Path {
	d: string;
	stroke: Tone;
	dash?: string;
	arrow?: boolean;
}
export interface Circle {
	cx: number;
	cy: number;
	r: number;
	fill: Tone;
}
export interface Text {
	x: number;
	y: number;
	text: string;
	size: number;
	tone: Tone;
	anchor?: Anchor;
	bold?: boolean;
	/** letter-spacing in user units, for eyebrow-style labels */
	tracking?: number;
}

/** One layout of a diagram. Paint order: lines, paths, rects, circles, texts, so chips and boxes sit above lanes. */
export interface Geometry {
	viewBox: string;
	rects: Rect[];
	lines: Line[];
	paths: Path[];
	circles: Circle[];
	texts: Text[];
}

export const DIAGRAM_IDS = [
	"closure",
	"lease",
	"airlock",
	"freshness",
	"spine-rows",
	"guards",
] as const;
export type DiagramId = (typeof DIAGRAM_IDS)[number];

export interface DiagramModel {
	id: DiagramId;
	/** Mono eyebrow above the title, e.g. "Mechanism 01 · public-release-closure". */
	eyebrow: string;
	title: string;
	/** The claim the picture makes, for readers who cannot see it. */
	ariaLabel: string;
	figcaption: string;
	/** What a stranger runs or reads to check the picture. */
	verify: string;
	claims: readonly ArchitectureClaimId[];
	/** The scene whose deep panel carries this diagram. */
	scene: Lens;
	wide: Geometry;
	compact: Geometry;
}

export type Ground = "deck" | "paper";
export type Variant = "wide" | "compact";

/** Every distinct label a geometry prints, for cross-renderer and cross-variant parity. */
export function textSet(g: Geometry): Set<string> {
	return new Set(g.texts.map((t) => t.text));
}
