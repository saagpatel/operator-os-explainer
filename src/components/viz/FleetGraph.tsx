import { motion } from "motion/react";
import { ROUTING, type TaskClass, WHY_HERE } from "../../data/vocab.ts";
import { formatClock } from "../../lib/format";
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

/** Endpoint pair trimmed by node radius so lines meet rings, not centers. */
function trimmed(a: FleetNode, b: FleetNode) {
	const na = NODES[a];
	const nb = NODES[b];
	const dx = nb.x - na.x;
	const dy = nb.y - na.y;
	const len = Math.hypot(dx, dy);
	const ux = dx / len;
	const uy = dy / len;
	return {
		x1: na.x + ux * NODE_R,
		y1: na.y + uy * NODE_R,
		x2: nb.x - ux * NODE_R,
		y2: nb.y - uy * NODE_R,
	};
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

	const litKeys = new Set<string>();
	for (const d of dispatches) {
		if (reducedMotion || t - d.at <= 4_000) {
			const key = connectorKey(d.from as FleetNode, d.to);
			if (key) litKeys.add(key);
		}
	}

	const docked = dispatches.filter((d) => d.id >= INJECTED_ID_FLOOR);

	return (
		<div className="relative">
			<svg
				viewBox="0 0 960 560"
				role="img"
				aria-label="The four fleet systems as a constellation: Claude.ai dispatching into Claude Code and Codex, with the autonomous night auditor tethered to Claude Code."
				className="block w-full"
			>
				{/* ---- connectors ---- */}
				{CONNECTORS.map(([a, b]) => {
					const { x1, y1, x2, y2 } = trimmed(a, b);
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
						const from = NODES[d.from as FleetNode];
						const to = NODES[d.to];
						if (d.from === d.to) {
							// self-dispatch (essay): an expanding halo instead of travel
							return (
								<circle
									key={`pulse-${d.id}`}
									cx={from.x}
									cy={from.y}
									r={NODE_R + 6 + f * 22}
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
					const n = NODES[id];
					const active = selectedNode === id;
					const ring = active ? "var(--accent-deck)" : "var(--ink-deck-muted)";
					return (
						<g key={id} data-testid={`node-${id}`}>
							{id === "claude_ai" ? (
								<>
									<circle
										cx={n.x}
										cy={n.y}
										r={NODE_R}
										fill="none"
										stroke={ring}
										strokeWidth={1}
										strokeDasharray="3 5"
									/>
									<circle
										cx={n.x}
										cy={n.y}
										r={30}
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
										r={NODE_R}
										fill="none"
										stroke={ring}
										strokeWidth={1}
									/>
									<circle
										cx={n.x}
										cy={n.y}
										r={38}
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
										r={30}
										fill="var(--deck-raised)"
										stroke={ring}
										strokeWidth={1}
									/>
									{[0, 60, 120, 180, 240, 300].map((deg) => {
										const rad = (deg * Math.PI) / 180;
										return (
											<circle
												key={deg}
												cx={n.x + Math.cos(rad) * 44}
												cy={n.y + Math.sin(rad) * 44}
												r={4}
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
										r={40}
										fill="var(--deck-raised)"
										stroke={ring}
										strokeWidth={1}
									/>
									<circle
										cx={n.x + 14}
										cy={n.y - 16}
										r={6}
										fill="none"
										stroke={ring}
										strokeWidth={1}
									/>
								</g>
							) : null}

							<text
								x={n.x}
								y={n.y + NODE_R + 22}
								textAnchor="middle"
								className="font-instrument"
								fontSize={13}
								fill="var(--ink-deck)"
								style={{ letterSpacing: "0.14em" }}
							>
								{n.label}
							</text>
							<text
								x={n.x}
								y={n.y + NODE_R + 40}
								textAnchor="middle"
								className="font-instrument"
								fontSize={10.5}
								fill="var(--ink-deck-muted)"
								style={{ letterSpacing: "0.08em" }}
							>
								{n.persona} · {n.sub}
							</text>
						</g>
					);
				})}

				{/* ---- docked reader-routed chips ---- */}
				{docked.map((d) => {
					const n = NODES[d.to];
					const stack = docked.filter((x) => x.to === d.to).indexOf(d);
					const y = n.y - NODE_R - 18 - stack * 24;
					return (
						<motion.g
							key={`chip-${d.taskClass}`}
							data-testid={`chip-docked-${d.taskClass}`}
							initial={
								reducedMotion ? false : { x: 480 - n.x, y: 620 - y, opacity: 0 }
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
								fontSize={11}
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
						x={NODES[selectedNode].x}
						y={NODES[selectedNode].y + NODE_R + 58}
						textAnchor="middle"
						className="font-instrument"
						fontSize={11}
						fill="var(--accent-deck)"
						style={{ letterSpacing: "0.06em" }}
					>
						why here: {WHY_HERE[selected as TaskClass]}
					</text>
				) : null}
			</svg>

			{/* ---- dispatch log: honest mono telemetry, serves reduced motion ---- */}
			<div
				aria-label="Dispatch log"
				className="pointer-events-none absolute left-3 top-2 font-instrument text-[10px] leading-relaxed text-ink-deck-muted"
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
