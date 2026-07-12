import { motion } from "motion/react";
import { GUARD_LAYERS, GUARD_MAP, type RuleConcept } from "../../data/vocab.ts";
import { formatClock } from "../../lib/format";
import type { SyntheticEvent } from "../../types/data.ts";
import type { VizProps } from "../../types/scene.ts";

type GuardEvent = Extract<SyntheticEvent, { kind: "guard" }>;

const CX = 480;
const CY = 300;
const AGENT_R = 42;
/** Ring radius by layer index; GUARD_LAYERS is ordered outer -> inner. */
const ringR = (layerIndex: number) =>
	AGENT_R + 40 + (GUARD_LAYERS.length - 1 - layerIndex) * 26;

/** The blocked dot travels up-left along a fixed 45-degree radial. */
const DIAG = Math.SQRT1_2;
const onRadial = (r: number) => ({ x: CX - r * DIAG, y: CY - r * DIAG });

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

	const stop = blocked ? onRadial(ringR(blockedIndex)) : null;

	return (
		<div className="relative">
			<svg
				viewBox="0 0 960 600"
				role="img"
				aria-label="Seven concentric guard layers around an acting agent. A selected risky action travels outward until the matching layer blocks it, and the agent adapts."
				className="block w-full"
			>
				{/* ---- rings, outer to inner ---- */}
				{GUARD_LAYERS.map((layer, i) => {
					const r = ringR(i);
					const isBlocking = blocked?.layer === layer;
					const hasFired = firedLayers.has(layer);
					return (
						<g key={layer}>
							<circle
								cx={CX}
								cy={CY}
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
							<text
								x={CX}
								y={CY - r - 5}
								textAnchor="middle"
								className="font-instrument"
								fontSize={10}
								fill={
									isBlocking ? "var(--accent-deck)" : "var(--ink-deck-muted)"
								}
								style={{ letterSpacing: "0.1em" }}
							>
								{layer}
							</text>
						</g>
					);
				})}

				{/* ---- the acting agent ---- */}
				<circle
					cx={CX}
					cy={CY}
					r={AGENT_R}
					fill="var(--deck-raised)"
					stroke="var(--ink-deck)"
					strokeWidth={1}
				/>
				<text
					x={CX}
					y={CY + 4}
					textAnchor="middle"
					className="font-instrument"
					fontSize={11}
					fill="var(--ink-deck)"
					style={{ letterSpacing: "0.14em" }}
				>
					AGENT
				</text>

				{/* ---- the attempt indicator: center -> blocked ring, then holds ---- */}
				{blocked && stop ? (
					<g key={selectedRule}>
						{!reducedMotion ? (
							<motion.line
								x1={CX}
								y1={CY}
								initial={{ x2: CX, y2: CY }}
								animate={{ x2: stop.x, y2: stop.y }}
								transition={{ duration: 0.6, ease: "easeOut" }}
								stroke="var(--accent-deck)"
								strokeWidth={1}
								strokeDasharray="3 4"
								opacity={0.7}
							/>
						) : (
							<line
								x1={CX}
								y1={CY}
								x2={stop.x}
								y2={stop.y}
								stroke="var(--accent-deck)"
								strokeWidth={1}
								strokeDasharray="3 4"
								opacity={0.7}
							/>
						)}
						<motion.circle
							initial={reducedMotion ? false : { cx: CX, cy: CY, opacity: 0 }}
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
							x={stop.x - 14}
							y={stop.y - 10}
							textAnchor="end"
							className="font-instrument"
							fontSize={11}
							fill="var(--accent-deck)"
							style={{ letterSpacing: "0.14em" }}
						>
							BLOCKED · {blocked.layer.toUpperCase()}
						</text>
					</g>
				) : null}

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
							d={`M ${CX + AGENT_R} ${CY} Q ${CX + 120} ${CY + 10} ${CX + 170} ${CY + 46}`}
							fill="none"
							stroke="var(--ink-deck)"
							strokeWidth={1}
						/>
						<rect
							x={CX + 170}
							y={CY + 32}
							width={220}
							height={28}
							rx={3}
							fill="var(--deck)"
							stroke="var(--ink-deck-muted)"
							strokeWidth={1}
						/>
						<text
							x={CX + 280}
							y={CY + 50}
							textAnchor="middle"
							className="font-instrument"
							fontSize={11}
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
				aria-label="Guard event log"
				className="pointer-events-none absolute left-3 top-2 font-instrument text-[10px] leading-relaxed text-ink-deck-muted"
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
