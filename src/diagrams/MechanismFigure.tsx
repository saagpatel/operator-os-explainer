import { useVizScale } from "../lib/useVizScale";
import { ASSURANCE_LABEL, assuranceFor } from "./assurance.ts";
import type { DiagramModel, Tone } from "./model.ts";
import { arrowTones, markerId } from "./render-string.ts";

/**
 * The in-app rendering of a mechanism diagram: the same model the docs
 * export serialises, drawn with the deck tokens and the shared responsive
 * scaling (wide or compact geometry, phone label floor). Static by design:
 * no motion, so nothing to gate under reduced motion.
 */
const TONE_VAR: Record<Tone, string> = {
	bg: "var(--deck)",
	fg: "var(--ink-deck)",
	muted: "var(--ink-deck-muted)",
	line: "var(--deck-line)",
	raised: "var(--deck-raised)",
	accent: "var(--accent-deck)",
};
const paint = (t: Tone | "none") => (t === "none" ? "none" : TONE_VAR[t]);

/**
 * Below this container width the 1120-unit wide layout renders its 10-unit
 * labels under 8.6 CSS px, so the phone layout takes over even on a desktop
 * viewport. The phone layout is then capped so its labels stay a sane size.
 */
const WIDE_MIN_PX = 960;
const COMPACT_MAX_PX = 480;

export function MechanismFigure({ model }: { model: DiagramModel }) {
	const {
		ref,
		variant: g,
		fs,
		compact,
	} = useVizScale({ wide: model.wide, compact: model.compact }, { minWideWidth: WIDE_MIN_PX });
	const badge = ASSURANCE_LABEL[assuranceFor(model.claims)];

	return (
		<figure className="m-0 flex min-w-0 flex-col gap-3" data-diagram={model.id}>
			<div>
				<p className="font-instrument text-[11px] uppercase tracking-[0.22em] text-ink-deck-muted">
					{model.eyebrow}
				</p>
				<p className="mt-1 font-display text-2xl text-ink-deck">{model.title}</p>
			</div>
			<svg
				ref={ref}
				viewBox={g.viewBox}
				role="img"
				aria-label={model.ariaLabel}
				className="block w-full font-instrument"
				style={compact ? { maxWidth: COMPACT_MAX_PX } : undefined}
			>
				<defs>
					{arrowTones(g).map((tone) => (
						<marker
							key={tone}
							id={markerId(model.id, tone)}
							viewBox="0 0 10 10"
							refX="9"
							refY="5"
							markerWidth="7"
							markerHeight="7"
							orient="auto-start-reverse"
						>
							<path d="M0 0 L10 5 L0 10 z" fill={TONE_VAR[tone]} />
						</marker>
					))}
				</defs>
				{g.lines.map((l, i) => (
					<line
						key={`l${i}`}
						x1={l.x1}
						y1={l.y1}
						x2={l.x2}
						y2={l.y2}
						stroke={TONE_VAR[l.stroke]}
						strokeWidth={l.strokeWidth}
						strokeDasharray={l.dash}
						markerEnd={l.arrow ? `url(#${markerId(model.id, l.stroke)})` : undefined}
					/>
				))}
				{g.paths.map((p, i) => (
					<path
						key={`p${i}`}
						d={p.d}
						fill="none"
						stroke={TONE_VAR[p.stroke]}
						strokeDasharray={p.dash}
						markerEnd={p.arrow ? `url(#${markerId(model.id, p.stroke)})` : undefined}
					/>
				))}
				{g.rects.map((r, i) => (
					<rect
						key={`r${i}`}
						x={r.x}
						y={r.y}
						width={r.w}
						height={r.h}
						fill={paint(r.fill)}
						stroke={paint(r.stroke)}
						strokeWidth={r.strokeWidth}
						strokeDasharray={r.dash}
					/>
				))}
				{g.circles.map((o, i) => (
					<circle key={`c${i}`} cx={o.cx} cy={o.cy} r={o.r} fill={TONE_VAR[o.fill]} />
				))}
				{g.texts.map((t, i) => (
					<text
						key={`t${i}`}
						x={t.x}
						y={t.y}
						fontSize={fs(t.size)}
						fill={TONE_VAR[t.tone]}
						textAnchor={t.anchor}
						fontWeight={t.bold ? 700 : undefined}
						letterSpacing={t.tracking}
					>
						{t.text}
					</text>
				))}
			</svg>
			<figcaption className="max-w-[76ch] font-prose text-[15px] leading-relaxed text-ink-deck">
				{model.figcaption}
			</figcaption>
			<div className="flex flex-col gap-3 border-t border-deck-line pt-3 font-instrument text-[11px] leading-relaxed sm:flex-row sm:items-start sm:justify-between">
				<p className="text-ink-deck-muted">
					<span className="text-ink-deck">Verify</span> · {model.verify}
				</p>
				<span className="shrink-0 self-start border border-deck-line px-2.5 py-1.5 uppercase tracking-[0.12em] text-ink-deck">
					{badge}
				</span>
			</div>
		</figure>
	);
}
