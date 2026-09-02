/**
 * Standalone SVG serializer for the docs export. JSX-free on purpose so
 * scripts/render-diagrams.ts runs under Node's type-stripping. Output is
 * byte-deterministic: fixed attribute order, no incidental whitespace.
 */
import type {
	DiagramModel,
	Geometry,
	Ground,
	Tone,
	Variant,
} from "./model.ts";

/** Literal colours for the standalone files; render.test.ts pins them to src/index.css. */
export const PALETTE: Record<Ground, Record<Tone, string>> = {
	deck: {
		bg: "#15191e",
		fg: "#e9e7df",
		muted: "#9a9488",
		line: "#2a2f36",
		raised: "#1b2027",
		accent: "#ff7a4d",
	},
	paper: {
		bg: "#f4efe4",
		fg: "#1a1c20",
		muted: "#6b6457",
		line: "rgba(26,28,32,0.22)",
		raised: "rgba(26,28,32,0.05)",
		accent: "#b0451d",
	},
};

export const FONT_STACK = "Space Mono, ui-monospace, monospace";

export function escapeXml(s: string): string {
	return s
		.replaceAll("&", "&amp;")
		.replaceAll("<", "&lt;")
		.replaceAll(">", "&gt;")
		.replaceAll('"', "&quot;");
}

/** Marker ids are namespaced by diagram so several inline figures can share a page. */
export function markerId(diagramId: string, tone: Tone): string {
	return `${diagramId}-arrow-${tone}`;
}

/** Tones that need an arrowhead marker, in a stable order. */
export function arrowTones(g: Geometry): Tone[] {
	const tones = new Set<Tone>();
	for (const l of g.lines) if (l.arrow) tones.add(l.stroke);
	for (const p of g.paths) if (p.arrow) tones.add(p.stroke);
	return [...tones].sort();
}

function num(n: number): string {
	return Number.isInteger(n) ? String(n) : String(Number(n.toFixed(2)));
}

export function renderSvgString(
	model: DiagramModel,
	variant: Variant,
	ground: Ground,
): string {
	const g = model[variant];
	const c = PALETTE[ground];
	const paint = (t: Tone | "none") => (t === "none" ? "none" : c[t]);
	const [, , vbW, vbH] = g.viewBox.split(/\s+/);
	const parts: string[] = [];

	parts.push(
		`<svg xmlns="http://www.w3.org/2000/svg" viewBox="${g.viewBox}" width="${vbW}" height="${vbH}" role="img" aria-label="${escapeXml(model.ariaLabel)}" font-family="${FONT_STACK}">`,
	);
	const markers = arrowTones(g);
	if (markers.length > 0) {
		parts.push("<defs>");
		for (const tone of markers) {
			parts.push(
				`<marker id="${markerId(model.id, tone)}" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse"><path d="M0 0 L10 5 L0 10 z" fill="${c[tone]}"/></marker>`,
			);
		}
		parts.push("</defs>");
	}
	parts.push(`<rect width="${vbW}" height="${vbH}" fill="${c.bg}"/>`);

	for (const l of g.lines) {
		let s = `<line x1="${num(l.x1)}" y1="${num(l.y1)}" x2="${num(l.x2)}" y2="${num(l.y2)}" stroke="${c[l.stroke]}"`;
		if (l.strokeWidth !== undefined) s += ` stroke-width="${num(l.strokeWidth)}"`;
		if (l.dash) s += ` stroke-dasharray="${l.dash}"`;
		if (l.arrow) s += ` marker-end="url(#${markerId(model.id, l.stroke)})"`;
		parts.push(`${s}/>`);
	}
	for (const p of g.paths) {
		let s = `<path d="${p.d}" fill="none" stroke="${c[p.stroke]}"`;
		if (p.dash) s += ` stroke-dasharray="${p.dash}"`;
		if (p.arrow) s += ` marker-end="url(#${markerId(model.id, p.stroke)})"`;
		parts.push(`${s}/>`);
	}
	for (const r of g.rects) {
		let s = `<rect x="${num(r.x)}" y="${num(r.y)}" width="${num(r.w)}" height="${num(r.h)}" fill="${paint(r.fill)}" stroke="${paint(r.stroke)}"`;
		if (r.strokeWidth !== undefined) s += ` stroke-width="${num(r.strokeWidth)}"`;
		if (r.dash) s += ` stroke-dasharray="${r.dash}"`;
		parts.push(`${s}/>`);
	}
	for (const o of g.circles) {
		parts.push(
			`<circle cx="${num(o.cx)}" cy="${num(o.cy)}" r="${num(o.r)}" fill="${c[o.fill]}"/>`,
		);
	}
	for (const t of g.texts) {
		let s = `<text x="${num(t.x)}" y="${num(t.y)}" font-size="${num(t.size)}" fill="${c[t.tone]}"`;
		if (t.anchor && t.anchor !== "start") s += ` text-anchor="${t.anchor}"`;
		if (t.bold) s += ` font-weight="700"`;
		if (t.tracking !== undefined) s += ` letter-spacing="${num(t.tracking)}"`;
		parts.push(`${s}>${escapeXml(t.text)}</text>`);
	}
	parts.push("</svg>");
	return `${parts.join("\n")}\n`;
}
