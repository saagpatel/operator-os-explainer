import { motion } from "motion/react";
import { GUARD_LAYERS, GUARD_MAP, type RuleConcept } from "../../data/vocab.ts";
import { formatClock } from "../../lib/format";
import { useVizScale } from "../../lib/useVizScale";
import type { SyntheticEvent } from "../../types/data.ts";
import type { VizProps } from "../../types/scene.ts";

type GuardEvent = Extract<SyntheticEvent, { kind: "guard" }>;

/** The blocked dot travels up-left along a fixed 45-degree radial. */
const DIAG = Math.SQRT1_2;

interface GuardGeometry {
	viewBox: string;
	cx: number;
	cy: number;
	agentR: number;
	ringR: (layerIndex: number) => number;
	/** Ring name above its own ring; null when the legend carries the names. */
	ringLabel: ((r: number) => { x: number; y: number }) | null;
	/** Where the "BLOCKED · LAYER" callout sits, given the stop point. */
	blockedLabel: (stop: { x: number; y: number }) => {
		x: number;
		y: number;
		anchor: "start" | "middle" | "end";
	};
	adaptation: {
		path: string;
		rect: { x: number; y: number; width: number; height: number };
		text: { x: number; y: number };
	};
	/** Compact only: the layer names as an ordered outer-to-inner list. */
	legend: { x: number; y: number; step: number } | null;
}

const WIDE_CX = 480;
const WIDE_CY = 300;

/** Wide: seven labeled rings, the adaptation branching off to the right. */
const WIDE: GuardGeometry = {
	viewBox: "0 0 960 600",
	cx: WIDE_CX,
	cy: WIDE_CY,
	agentR: 42,
	ringR: (i) => 42 + 40 + (GUARD_LAYERS.length - 1 - i) * 26,
	ringLabel: (r) => ({ x: WIDE_CX, y: WIDE_CY - r - 5 }),
	blockedLabel: (stop) => ({ x: stop.x - 14, y: stop.y - 10, anchor: "end" }),
	adaptation: {
		path: `M ${WIDE_CX + 42} ${WIDE_CY} Q ${WIDE_CX + 120} ${WIDE_CY + 10} ${WIDE_CX + 170} ${WIDE_CY + 46}`,
		rect: { x: WIDE_CX + 170, y: WIDE_CY + 32, width: 220, height: 28 },
		text: { x: WIDE_CX + 280, y: WIDE_CY + 50 },
	},
	legend: null,
};

const CO_CX = 170;
const CO_CY = 196;

/**
 * Compact: the concentric shields survive intact, but seven ring names cannot
 * stack above a 162-unit radius without colliding at a legible size. The names
 * move to an ordered outer-to-inner legend below the rings, and the ring that
 * actually fires still calls itself out in place.
 */
const COMPACT: GuardGeometry = {
	viewBox: "0 0 340 600",
	cx: CO_CX,
	cy: CO_CY,
	agentR: 34,
	ringR: (i) => 34 + 22 + (GUARD_LAYERS.length - 1 - i) * 17,
	ringLabel: null,
	blockedLabel: () => ({ x: 330, y: 26, anchor: "end" }),
	adaptation: {
		path: `M ${CO_CX} ${CO_CY + 34} Q ${CO_CX + 40} ${CO_CY + 130} ${CO_CX + 30} ${CO_CY + 176}`,
		rect: { x: 20, y: CO_CY + 176, width: 300, height: 30 },
		text: { x: 170, y: CO_CY + 196 },
	},
	legend: { x: 20, y: 440, step: 21 },
};

/**
 * Scene 3 hero viz: concentric guard shields around an acting agent.
 * STRICTLY DESCRIPTIVE (SPEC 2.3): rule concepts and adaptations are
 * closed-vocabulary terms; no command strings, no bypass mechanics. The
 * attempt indicator travels outward, the mapped layer blocks it and holds,
 * and the agent visibly adapts instead of escalating.
 */
export function GuardShields({ events, reducedMotion, interaction }: VizProps) {
	const selectedRule =
		interaction.kind === "guardTrigger"
			? (interaction.selectedRule as RuleConcept | null)
			: null;
	const blocked = selectedRule ? GUARD_MAP[selectedRule] : null;
	const blockedIndex = blocked ? GUARD_LAYERS.indexOf(blocked.layer) : -1;
	const guardEvents = events.filter((e): e is GuardEvent => e.kind === "guard");
	const firedLayers = new Set(guardEvents.map((e) => e.layer));
	const {
		ref,
		variant: g,
		fs,
		compact,
	} = useVizScale({ wide: WIDE, compact: COMPACT });

	const stopR = blocked ? g.ringR(blockedIndex) : 0;
	const stop = blocked
		? { x: g.cx - stopR * DIAG, y: g.cy - stopR * DIAG }
		: null;
	const callout = stop ? g.blockedLabel(stop) : null;

	return (
		<div className="relative" ref={ref}>
			<svg
				viewBox={g.viewBox}
				role="img"
				aria-label="Seven concentric guard layers around an acting agent. A selected risky action travels outward until the matching layer blocks it, and the agent adapts."
				className="block w-full"
			>
				{/* ---- rings, outer to inner ---- */}
				{GUARD_LAYERS.map((layer, i) => {
					const r = g.ringR(i);
					const isBlocking = blocked?.layer === layer;
					const hasFired = firedLayers.has(layer);
					const at = g.ringLabel?.(r);
					return (
						<g key={layer}>
							<circle
								cx={g.cx}
								cy={g.cy}
								r={r}
								fill="none"
								stroke={
									isBlocking
										? "var(--accent-deck)"
										: hasFired
											? "var(--ink-deck-muted)"
											: "var(--deck-line)"
								}
								strokeWidth={isBlocking ? 2 : 1}
								data-testid={`ring-${layer}`}
								data-blocking={isBlocking}
							/>
							{at ? (
								<text
									x={at.x}
									y={at.y}
									textAnchor="middle"
									className="font-instrument"
									fontSize={fs(10)}
									fill={
										isBlocking ? "var(--accent-deck)" : "var(--ink-deck-muted)"
									}
									style={{ letterSpacing: "0.1em" }}
								>
									{layer}
								</text>
							) : null}
						</g>
					);
				})}

				{/* ---- the acting agent ---- */}
				<circle
					cx={g.cx}
					cy={g.cy}
					r={g.agentR}
					fill="var(--deck-raised)"
					stroke="var(--ink-deck)"
					strokeWidth={1}
				/>
				<text
					x={g.cx}
					y={g.cy + 4}
					textAnchor="middle"
					className="font-instrument"
					fontSize={fs(11)}
					fill="var(--ink-deck)"
					style={{ letterSpacing: "0.14em" }}
				>
					AGENT
				</text>

				{/* ---- the attempt indicator: center -> blocked ring, then holds ---- */}
				{blocked && stop && callout ? (
					<g key={selectedRule}>
						{!reducedMotion ? (
							<motion.line
								x1={g.cx}
								y1={g.cy}
								initial={{ x2: g.cx, y2: g.cy }}
								animate={{ x2: stop.x, y2: stop.y }}
								transition={{ duration: 0.6, ease: "easeOut" }}
								stroke="var(--accent-deck)"
								strokeWidth={1}
								strokeDasharray="3 4"
								opacity={0.7}
							/>
						) : (
							<line
								x1={g.cx}
								y1={g.cy}
								x2={stop.x}
								y2={stop.y}
								stroke="var(--accent-deck)"
								strokeWidth={1}
								strokeDasharray="3 4"
								opacity={0.7}
							/>
						)}
						<motion.circle
							initial={reducedMotion ? false : { cx: g.cx, cy: g.cy, opacity: 0 }}
							animate={{ cx: stop.x, cy: stop.y, opacity: 1 }}
							transition={
								reducedMotion
									? { duration: 0 }
									: { duration: 0.6, ease: "easeOut" }
							}
							r={6}
							fill="var(--accent-deck)"
						/>
						<text
							x={callout.x}
							y={callout.y}
							textAnchor={callout.anchor}
							className="font-instrument"
							fontSize={fs(11)}
							fill="var(--accent-deck)"
							style={{ letterSpacing: "0.14em" }}
						>
							BLOCKED · {blocked.layer.toUpperCase()}
						</text>
					</g>
				) : null}

				{/* ---- the layer roster, outer to inner (compact only) ---- */}
				{g.legend
					? GUARD_LAYERS.map((layer, i) => {
							const isBlocking = blocked?.layer === layer;
							const legend = g.legend;
							if (!legend) return null;
							return (
								<text
									key={`legend-${layer}`}
									x={legend.x}
									y={legend.y + i * legend.step}
									className="font-instrument"
									fontSize={fs(10)}
									fill={
										isBlocking ? "var(--accent-deck)" : "var(--ink-deck-muted)"
									}
									style={{ letterSpacing: "0.1em" }}
								>
									{i + 1} · {layer}
								</text>
							);
						})
					: null}

				{/* ---- the adaptation: reroute, never escalate ---- */}
				{blocked ? (
					<motion.g
						key={`adapt-${selectedRule}`}
						initial={reducedMotion ? false : { opacity: 0 }}
						animate={{ opacity: 1 }}
						transition={
							reducedMotion ? { duration: 0 } : { delay: 0.7, duration: 0.3 }
						}
						data-testid="adaptation"
					>
						<path
							d={g.adaptation.path}
							fill="none"
							stroke="var(--ink-deck)"
							strokeWidth={1}
						/>
						<rect
							{...g.adaptation.rect}
							rx={3}
							fill="var(--deck)"
							stroke="var(--ink-deck-muted)"
							strokeWidth={1}
						/>
						<text
							x={g.adaptation.text.x}
							y={g.adaptation.text.y}
							textAnchor="middle"
							className="font-instrument"
							fontSize={fs(11)}
							fill="var(--ink-deck)"
							style={{ letterSpacing: "0.1em" }}
						>
							{blocked.adaptation.replace(/-/g, " ")}
						</text>
					</motion.g>
				) : null}
			</svg>

			{/* ---- guard replay log (mono telemetry; serves reduced motion) ---- */}
				<div
					role="log"
					aria-label="Guard event log"
					aria-live="polite"
				className={
					compact
						? "px-1 pt-2 font-instrument text-[10px] leading-relaxed text-ink-deck-muted"
						: "pointer-events-none absolute left-3 top-2 font-instrument text-[10px] leading-relaxed text-ink-deck-muted"
				}
			>
				{guardEvents.map((e) => (
					<div key={e.id}>
						T+{formatClock(e.at)} {e.layer.toUpperCase()} blocked{" "}
						{e.ruleConcept} -&gt; {e.adaptation.replace(/-/g, " ")} · REPLAY
					</div>
				))}
			</div>
		</div>
	);
}
