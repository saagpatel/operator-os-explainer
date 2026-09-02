/**
 * A tiny builder so a diagram model reads as a drawing, not as a pile of
 * object literals. Within each kind, primitives paint in call order; across
 * kinds both renderers paint lines, paths, rects, circles, then texts.
 */
import type { Anchor, Geometry, Tone } from "./model.ts";

export interface Sketch {
	rect(
		x: number,
		y: number,
		w: number,
		h: number,
		opts?: { fill?: Tone | "none"; stroke?: Tone | "none"; sw?: number; dash?: string },
	): void;
	line(
		x1: number,
		y1: number,
		x2: number,
		y2: number,
		tone?: Tone,
		opts?: { arrow?: boolean; dash?: string; sw?: number },
	): void;
	path(d: string, tone?: Tone, opts?: { arrow?: boolean; dash?: string }): void;
	dot(cx: number, cy: number, r: number, tone?: Tone): void;
	text(
		x: number,
		y: number,
		text: string,
		size: number,
		tone?: Tone,
		opts?: { anchor?: Anchor; bold?: boolean; tracking?: number },
	): void;
	/** A titled box: title centred in bold, an optional muted subtitle below. */
	station(
		x: number,
		y: number,
		w: number,
		h: number,
		title: string,
		sub?: string,
		opts?: { accent?: boolean; titleSize?: number; subSize?: number },
	): void;
	/** A small status chip sitting on a lane. */
	chip(cx: number, cy: number, w: number, label: string, tone?: Tone, size?: number): void;
	done(): Geometry;
}

export function sketch(viewBox: string): Sketch {
	const g: Geometry = { viewBox, rects: [], lines: [], paths: [], circles: [], texts: [] };
	const s: Sketch = {
		rect(x, y, w, h, opts = {}) {
			g.rects.push({
				x,
				y,
				w,
				h,
				fill: opts.fill ?? "raised",
				stroke: opts.stroke ?? "line",
				...(opts.sw !== undefined ? { strokeWidth: opts.sw } : {}),
				...(opts.dash ? { dash: opts.dash } : {}),
			});
		},
		line(x1, y1, x2, y2, tone = "fg", opts = {}) {
			g.lines.push({
				x1,
				y1,
				x2,
				y2,
				stroke: tone,
				...(opts.sw !== undefined ? { strokeWidth: opts.sw } : {}),
				...(opts.dash ? { dash: opts.dash } : {}),
				...(opts.arrow ? { arrow: true } : {}),
			});
		},
		path(d, tone = "fg", opts = {}) {
			g.paths.push({
				d,
				stroke: tone,
				...(opts.dash ? { dash: opts.dash } : {}),
				...(opts.arrow ? { arrow: true } : {}),
			});
		},
		dot(cx, cy, r, tone = "fg") {
			g.circles.push({ cx, cy, r, fill: tone });
		},
		text(x, y, text, size, tone = "fg", opts = {}) {
			g.texts.push({
				x,
				y,
				text,
				size,
				tone,
				...(opts.anchor ? { anchor: opts.anchor } : {}),
				...(opts.bold ? { bold: true } : {}),
				...(opts.tracking !== undefined ? { tracking: opts.tracking } : {}),
			});
		},
		station(x, y, w, h, title, sub, opts = {}) {
			const accent = opts.accent ?? false;
			s.rect(x, y, w, h, accent ? { stroke: "accent", sw: 1.5 } : {});
			const cx = x + w / 2;
			const titleSize = opts.titleSize ?? 12;
			const subSize = opts.subSize ?? 10;
			if (sub) {
				s.text(cx, y + h / 2 - 4, title, titleSize, accent ? "accent" : "fg", {
					anchor: "middle",
					bold: true,
				});
				s.text(cx, y + h / 2 + 14, sub, subSize, "muted", { anchor: "middle" });
			} else {
				s.text(cx, y + h / 2 + 4, title, titleSize, accent ? "accent" : "fg", {
					anchor: "middle",
					bold: true,
				});
			}
		},
		chip(cx, cy, w, label, tone = "fg", size = 10) {
			s.rect(cx - w / 2, cy - 10, w, 20, { fill: "bg", stroke: tone });
			s.text(cx, cy + 4, label, size, tone, { anchor: "middle" });
		},
		done() {
			return g;
		},
	};
	return s;
}
