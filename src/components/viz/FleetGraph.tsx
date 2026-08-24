import { motion } from "motion/react";
import { ROUTING, type TaskClass, WHY_HERE } from "../../data/vocab.ts";
import { formatClock } from "../../lib/format";
import { useVizScale } from "../../lib/useVizScale";
import type { FleetNode, SyntheticEvent } from "../../types/data.ts";
import type { VizProps } from "../../types/scene.ts";

type Dispatch = Extract<SyntheticEvent, { kind: "dispatch" }>;

/** Injected (reader-routed) dispatches use ids from this floor up. */
export const INJECTED_ID_FLOOR = 9_000;

export const NODES: Record<
	FleetNode,
	{ x: number; y: number; label: string; persona: string; sub: string }
> = {
	claude_ai: {
		x: 190,
		y: 280,
		label: "CLAUDE.AI",
		persona: "the writer-strategist",
		sub: "no filesystem of its own",
	},
	cc: {
		x: 620,
		y: 130,
		label: "CLAUDE CODE",
		persona: "the careful engineer",
		sub: "hands on the filesystem",
	},
	codex: {
		x: 620,
		y: 430,
		label: "CODEX",
		persona: "the mechanical swarm",
		sub: "parallel, cheap, crisp specs",
	},
	autonomous: {
		x: 830,
		y: 280,
		label: "AUTONOMOUS",
		persona: "the night auditor",
		sub: "read-only",
	},
};

const CONNECTORS: readonly [FleetNode, FleetNode][] = [
	["claude_ai", "cc"],
	["claude_ai", "codex"],
	["cc", "autonomous"],
];

const NODE_R = 48;

interface FleetGeometry {
	viewBox: string;
	pos: Record<FleetNode, { x: number; y: number }>;
	nodeR: number;
	/**
	 * Units below a node reserved for its label stack. A connector leaving
	 * downward starts beneath this band instead of running through the text.
	 * Zero on the wide canvas, where labels never sit on a connector.
	 */
	labelBand: number;
	/** Baseline offsets from the node edge for the name and the persona line. */
	nameDy: number;
	personaDy: number;
	/** The second descriptor line; dropped where the canvas cannot carry it. */
	showSub: boolean;
	personaTracking: string;
	/** Fixed home for the routing annotation, or null to hang it off the node. */
	whyHere: { x: number; y: number } | null;
	/** Off-canvas point a routed chip flies in from. */
	chipOrigin: { x: number; y: number };
	/** Per-node ornament radii, stated outright so the wide canvas is exact. */
	art: {
		claudeAiInner: number;
		ccInner: number;
		codexCore: number;
		codexOrbit: number;
		codexDot: number;
		autoBody: number;
		autoLens: number;
		autoLensDx: number;
		autoLensDy: number;
	};
}

const WIDE: FleetGeometry = {
	viewBox: "0 0 960 560",
	pos: {
		claude_ai: { x: 190, y: 280 },
		cc: { x: 620, y: 130 },
		codex: { x: 620, y: 430 },
		autonomous: { x: 830, y: 280 },
	},
	nodeR: NODE_R,
	labelBand: 0,
	nameDy: 22,
	personaDy: 40,
	showSub: true,
	personaTracking: "0.08em",
	whyHere: null,
	chipOrigin: { x: 480, y: 620 },
	art: {
		claudeAiInner: 30,
		ccInner: 38,
		codexCore: 30,
		codexOrbit: 44,
		codexDot: 4,
		autoBody: 40,
		autoLens: 6,
		autoLensDx: 14,
		autoLensDy: -16,
	},
};

/**
 * Compact: the constellation turned portrait. The fork survives (one writer
 * branching into two pairs of hands, with the night auditor tethered to Claude
 * Code), but the second descriptor line is dropped: two 200-unit captions
 * cannot sit side by side in 340 units at a legible size. The full descriptor
 * for every system stays on the page in the routing table below.
 */
const COMPACT: FleetGeometry = {
	viewBox: "0 0 340 560",
	pos: {
		claude_ai: { x: 170, y: 62 },
		cc: { x: 96, y: 216 },
		codex: { x: 252, y: 216 },
		autonomous: { x: 170, y: 392 },
	},
	nodeR: 34,
	labelBand: 46,
	nameDy: 18,
	personaDy: 34,
	showSub: false,
	personaTracking: "0.02em",
	whyHere: { x: 170, y: 522 },
	chipOrigin: { x: 170, y: 600 },
	art: {
		claudeAiInner: 21,
		ccInner: 27,
		codexCore: 21,
		codexOrbit: 31,
		codexDot: 3,
		autoBody: 28,
		autoLens: 4.5,
		autoLensDx: 10,
		autoLensDy: -11,
	},
};

/**
 * Endpoint pair trimmed so lines meet rings, not centers. Where a node carries
 * a label band, a downward connector is clipped to start below it.
 */
function connector(g: FleetGeometry, a: FleetNode, b: FleetNode) {
	const na = g.pos[a];
	const nb = g.pos[b];
	const dx = nb.x - na.x;
	const dy = nb.y - na.y;
	const len = Math.hypot(dx, dy);
	const ux = dx / len;
	const uy = dy / len;
	let x1 = na.x + ux * g.nodeR;
	let y1 = na.y + uy * g.nodeR;
	const bandBottom = na.y + g.nodeR + g.labelBand;
	if (g.labelBand > 0 && dy > 0 && y1 < bandBottom) {
		y1 = bandBottom;
		x1 = na.x + (dx * (bandBottom - na.y)) / dy;
	}
	return { x1, y1, x2: nb.x - ux * g.nodeR, y2: nb.y - uy * g.nodeR };
}

function connectorKey(from: FleetNode, to: FleetNode): string | null {
	for (const [a, b] of CONNECTORS) {
		if ((a === from && b === to) || (a === to && b === from))
			return `${a}-${b}`;
	}
	return null;
}

/**
 * Scene 1 hero viz: the fleet constellation. Pure function of VizProps
 * (SPEC 4.3): pulses and lit connectors derive from (events, t), so
 * scrubbing back rewinds them deterministically. Under reduced motion the
 * traveling pulses vanish and past dispatches read as statically lit
 * connectors plus the mono log (SPEC 2.5).
 */
export function FleetGraph({
	events,
	t,
	interaction,
	reducedMotion,
}: VizProps) {
	const dispatches = events.filter((e): e is Dispatch => e.kind === "dispatch");
	const selected =
		interaction.kind === "taskChipRoute" ? interaction.selectedTaskClass : null;
	const selectedNode = selected ? ROUTING[selected as TaskClass] : null;
	const {
		ref,
		variant: g,
		fs,
		compact,
	} = useVizScale({ wide: WIDE, compact: COMPACT });

	const litKeys = new Set<string>();
	for (const d of dispatches) {
		if (reducedMotion || t - d.at <= 4_000) {
			const key = connectorKey(d.from as FleetNode, d.to);
			if (key) litKeys.add(key);
		}
	}

	const docked = dispatches.filter((d) => d.id >= INJECTED_ID_FLOOR);
	const r = g.nodeR;

	return (
		<div className="relative" ref={ref}>
			<svg
				viewBox={g.viewBox}
				role="img"
				aria-label="The four fleet systems as a constellation: Claude.ai dispatching into Claude Code and Codex, with the autonomous night auditor tethered to Claude Code."
				className="block w-full"
			>
				{/* ---- connectors ---- */}
				{CONNECTORS.map(([a, b]) => {
					const { x1, y1, x2, y2 } = connector(g, a, b);
					const key = `${a}-${b}`;
					const lit = litKeys.has(key);
					return (
						<g key={key}>
							<line
								x1={x1}
								y1={y1}
								x2={x2}
								y2={y2}
								stroke="var(--deck-line)"
								strokeWidth={1}
								strokeDasharray={b === "autonomous" ? "2 6" : undefined}
							/>
							{lit ? (
								<line
									x1={x1}
									y1={y1}
									x2={x2}
									y2={y2}
									stroke="var(--accent-deck)"
									strokeWidth={1}
									opacity={0.35}
								/>
							) : null}
						</g>
					);
				})}

				{/* ---- traveling dispatch pulses (decorative; off under reduced motion) ---- */}
				{!reducedMotion &&
					dispatches.map((d) => {
						const age = t - d.at;
						if (age < 0 || age > d.durationMs) return null;
						const f = age / d.durationMs;
						const from = g.pos[d.from as FleetNode];
						const to = g.pos[d.to];
						if (d.from === d.to) {
							// self-dispatch (essay): an expanding halo instead of travel
							return (
								<circle
									key={`pulse-${d.id}`}
									cx={from.x}
									cy={from.y}
									r={r + 6 + f * 22}
									fill="none"
									stroke="var(--accent-deck)"
									strokeWidth={1}
									opacity={0.5 * (1 - f)}
								/>
							);
						}
						const x = from.x + (to.x - from.x) * f;
						const y = from.y + (to.y - from.y) * f;
						return (
							<circle
								key={`pulse-${d.id}`}
								cx={x}
								cy={y}
								r={3.5}
								fill="var(--accent-deck)"
								opacity={0.9}
							/>
						);
					})}

				{/* ---- nodes ---- */}
				{(Object.keys(NODES) as FleetNode[]).map((id) => {
					const n = { ...NODES[id], ...g.pos[id] };
					const active = selectedNode === id;
					const ring = active ? "var(--accent-deck)" : "var(--ink-deck-muted)";
					return (
						<g key={id} data-testid={`node-${id}`}>
							{id === "claude_ai" ? (
								<>
									<circle
										cx={n.x}
										cy={n.y}
										r={r}
										fill="none"
										stroke={ring}
										strokeWidth={1}
										strokeDasharray="3 5"
									/>
									<circle
										cx={n.x}
										cy={n.y}
										r={g.art.claudeAiInner}
										fill="var(--deck-raised)"
										stroke={ring}
										strokeWidth={1}
									/>
								</>
							) : null}
							{id === "cc" ? (
								<>
									<circle
										cx={n.x}
										cy={n.y}
										r={r}
										fill="none"
										stroke={ring}
										strokeWidth={1}
									/>
									<circle
										cx={n.x}
										cy={n.y}
										r={g.art.ccInner}
										fill="var(--deck-raised)"
										stroke={ring}
										strokeWidth={1}
									/>
								</>
							) : null}
							{id === "codex" ? (
								<>
									<circle
										cx={n.x}
										cy={n.y}
										r={g.art.codexCore}
										fill="var(--deck-raised)"
										stroke={ring}
										strokeWidth={1}
									/>
									{[0, 60, 120, 180, 240, 300].map((deg) => {
										const rad = (deg * Math.PI) / 180;
										return (
											<circle
												key={deg}
												cx={n.x + Math.cos(rad) * g.art.codexOrbit}
												cy={n.y + Math.sin(rad) * g.art.codexOrbit}
												r={g.art.codexDot}
												fill={
													active ? "var(--accent-deck)" : "var(--deck-line)"
												}
											/>
										);
									})}
								</>
							) : null}
							{id === "autonomous" ? (
								<g opacity={0.85}>
									<circle
										cx={n.x}
										cy={n.y}
										r={g.art.autoBody}
										fill="var(--deck-raised)"
										stroke={ring}
										strokeWidth={1}
									/>
									<circle
										cx={n.x + g.art.autoLensDx}
										cy={n.y + g.art.autoLensDy}
										r={g.art.autoLens}
										fill="none"
										stroke={ring}
										strokeWidth={1}
									/>
								</g>
							) : null}

							<text
								x={n.x}
								y={n.y + r + g.nameDy}
								textAnchor="middle"
								className="font-instrument"
								fontSize={fs(13)}
								fill="var(--ink-deck)"
								style={{ letterSpacing: "0.14em" }}
							>
								{n.label}
							</text>
							<text
								x={n.x}
								y={n.y + r + g.personaDy}
								textAnchor="middle"
								className="font-instrument"
								fontSize={fs(10.5)}
								fill="var(--ink-deck-muted)"
								style={{ letterSpacing: g.personaTracking }}
							>
								{g.showSub ? `${n.persona} · ${n.sub}` : n.persona}
							</text>
						</g>
					);
				})}

				{/* ---- docked reader-routed chips ---- */}
				{docked.map((d) => {
					const n = g.pos[d.to];
					const stack = docked.filter((x) => x.to === d.to).indexOf(d);
					const y = n.y - r - 18 - stack * 24;
					return (
						<motion.g
							key={`chip-${d.taskClass}`}
							data-testid={`chip-docked-${d.taskClass}`}
							initial={
								reducedMotion
									? false
									: {
											x: g.chipOrigin.x - n.x,
											y: g.chipOrigin.y - y,
											opacity: 0,
										}
							}
							animate={{ x: 0, y: 0, opacity: 1 }}
							transition={
								reducedMotion
									? { duration: 0 }
									: { type: "spring", stiffness: 160, damping: 22 }
							}
						>
							<rect
								x={n.x - 44}
								y={y - 12}
								width={88}
								height={22}
								rx={3}
								fill="var(--deck)"
								stroke="var(--accent-deck)"
								strokeWidth={1}
							/>
							<text
								x={n.x}
								y={y + 3}
								textAnchor="middle"
								className="font-instrument"
								fontSize={fs(11)}
								fill="var(--accent-deck)"
								style={{ letterSpacing: "0.12em" }}
							>
								{d.taskClass.toUpperCase()}
							</text>
						</motion.g>
					);
				})}

				{/* ---- why-here annotation at the routed node ---- */}
				{selected && selectedNode ? (
					<text
						x={g.whyHere ? g.whyHere.x : g.pos[selectedNode].x}
						y={g.whyHere ? g.whyHere.y : g.pos[selectedNode].y + r + 58}
						textAnchor="middle"
						className="font-instrument"
						fontSize={fs(11)}
						fill="var(--accent-deck)"
						style={{ letterSpacing: "0.06em" }}
					>
						why here: {WHY_HERE[selected as TaskClass]}
					</text>
				) : null}
			</svg>

			{/* ---- dispatch log: honest mono telemetry, serves reduced motion ---- */}
			{/* Overlaid on the wide canvas, where it sits in empty margin. On the
			    compact canvas five log lines would cover the constellation, so it
			    takes its own space below instead. */}
				<div
					role="log"
					aria-label="Dispatch log"
					aria-live="polite"
				className={
					compact
						? "px-1 pt-2 font-instrument text-[10px] leading-relaxed text-ink-deck-muted"
						: "pointer-events-none absolute left-3 top-2 font-instrument text-[10px] leading-relaxed text-ink-deck-muted"
				}
			>
				{dispatches.slice(-5).map((d) => (
					<div key={d.id}>
						T+{formatClock(d.at)} {d.taskClass.toUpperCase()} -&gt;{" "}
						{NODES[d.to].label}
						{" · "}
						{d.model.toUpperCase()}
						{d.id >= INJECTED_ID_FLOOR ? (
							<span className="text-accent-deck"> · YOU</span>
						) : null}
					</div>
				))}
			</div>
		</div>
	);
}
