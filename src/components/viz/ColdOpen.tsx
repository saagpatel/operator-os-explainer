import { motion } from "motion/react";
import type { SyntheticEvent } from "../../types/data.ts";
import type { VizProps } from "../../types/scene.ts";

type Fanout = Extract<SyntheticEvent, { kind: "fanout" }>;

const W = 960;
const H = 440;
const CLAUDE_AI = { x: 110, y: 220 };
const CC = { x: 300, y: 220 };
const LANES_X0 = 400;
const LANES_X1 = 560;
const LANE_Y = [140, 220, 300] as const;
const MERGE = { x: 610, y: 220 };
const GATE_X = 690;
const BUILDLOG = { x: 860, y: 130 };
const STAGES = ["dispatch", "snapshot", "pickup", "receipt", "clear"] as const;

/**
 * Scene 0: the whole OS as one dim constellation; Corveth's mission lights
 * it left to right as the clock plays. Every element is a pure function of
 * (events, t), so the cold open is just the clock playing 0..18s. Under
 * reduced motion the scene renders its final composed state statically.
 */
export function ColdOpen({ events, reducedMotion }: VizProps) {
	const dispatched = events.some((e) => e.kind === "dispatch");
	const handoffStages = new Set(
		events.flatMap((e) => (e.kind === "handoff" ? [e.stage] : [])),
	);
	const fanouts = events.filter((e): e is Fanout => e.kind === "fanout");
	const laneState = ([0, 1, 2] as const).map((lane) => {
		const evts = fanouts.filter((e) => e.lane === lane);
		return {
			spawned: evts.some((e) => e.phase === "spawn"),
			running:
				evts.some((e) => e.phase === "run") &&
				!evts.some((e) => e.phase === "converge"),
			converged: evts.some((e) => e.phase === "converge"),
		};
	});
	const anyConverged = laneState.some((l) => l.converged);
	const guardFired = events.some((e) => e.kind === "guard");
	const blocked =
		events.some((e) => e.kind === "verify" && e.result === "block") &&
		!events.some((e) => e.kind === "verify" && e.result === "pass");
	const passed = events.some((e) => e.kind === "verify" && e.result === "pass");
	const shipped = events.some((e) => e.kind === "ship");

	const appear = (visible: boolean) =>
		reducedMotion
			? { opacity: visible ? 1 : 0.18 }
			: { opacity: visible ? 1 : 0.18 };

	return (
		<svg
			viewBox={`0 0 ${W} ${H}`}
			role="img"
			aria-label="The whole operator OS as a constellation: an instruction routes to Claude Code, crosses the spine as a handoff, fans out into worktrees, survives a guard block, passes the verify gate on attempt two, and ships to the build log."
			className="block w-full"
		>
			{/* ---- claude_ai -> cc: routing + the handoff lease ---- */}
			<g style={appear(true)}>
				<circle
					cx={CLAUDE_AI.x}
					cy={CLAUDE_AI.y}
					r={34}
					fill="var(--deck-raised)"
					stroke="var(--ink-deck-muted)"
					strokeWidth={1}
					strokeDasharray="3 5"
				/>
				<text
					x={CLAUDE_AI.x}
					y={CLAUDE_AI.y + 56}
					textAnchor="middle"
					className="font-instrument"
					fontSize={10}
					fill="var(--ink-deck)"
					style={{ letterSpacing: "0.12em" }}
				>
					CLAUDE.AI
				</text>
			</g>

			<line
				x1={CLAUDE_AI.x + 34}
				y1={CLAUDE_AI.y}
				x2={CC.x - 38}
				y2={CC.y}
				stroke={dispatched ? "var(--accent-deck)" : "var(--deck-line)"}
				strokeWidth={1}
				opacity={dispatched ? 0.7 : 1}
			/>
			{/* handoff stage ticks along the connector */}
			{STAGES.slice(0, 3).map((stage, i) => {
				const x = CLAUDE_AI.x + 52 + i * 40;
				const lit = handoffStages.has(stage);
				return (
					<g key={stage}>
						<circle
							cx={x}
							cy={CLAUDE_AI.y + 14}
							r={3.5}
							fill={lit ? "var(--accent-deck)" : "var(--deck-raised)"}
							stroke={lit ? "var(--accent-deck)" : "var(--deck-line)"}
							strokeWidth={1}
						/>
						<text
							x={x}
							y={CLAUDE_AI.y + 32}
							textAnchor="middle"
							className="font-instrument"
							fontSize={8}
							fill={lit ? "var(--ink-deck-muted)" : "var(--deck-line)"}
							style={{ letterSpacing: "0.06em" }}
						>
							{stage}
						</text>
					</g>
				);
			})}

			<g style={appear(dispatched)} data-testid="co-cc">
				<circle
					cx={CC.x}
					cy={CC.y}
					r={38}
					fill="var(--deck-raised)"
					stroke={dispatched ? "var(--ink-deck)" : "var(--ink-deck-muted)"}
					strokeWidth={1}
				/>
				<circle
					cx={CC.x}
					cy={CC.y}
					r={30}
					fill="none"
					stroke={dispatched ? "var(--ink-deck)" : "var(--ink-deck-muted)"}
					strokeWidth={1}
				/>
				<text
					x={CC.x}
					y={CC.y + 60}
					textAnchor="middle"
					className="font-instrument"
					fontSize={10}
					fill="var(--ink-deck)"
					style={{ letterSpacing: "0.12em" }}
				>
					CLAUDE CODE
				</text>
			</g>

			{/* the guard moment: an arc over cc that fires and resolves */}
			{guardFired ? (
				<g data-testid="co-guard">
					<path
						d={`M ${CC.x - 52} ${CC.y - 26} A 58 58 0 0 1 ${CC.x + 52} ${CC.y - 26}`}
						fill="none"
						stroke="var(--accent-deck)"
						strokeWidth={1.5}
					/>
					<text
						x={CC.x}
						y={CC.y - 74}
						textAnchor="middle"
						className="font-instrument"
						fontSize={9}
						fill="var(--accent-deck)"
						style={{ letterSpacing: "0.08em" }}
					>
						hard-deny fired -&gt; opened a branch
					</text>
				</g>
			) : null}

			{/* ---- fan-out lanes ---- */}
			{laneState.map((l, lane) => (
				<g key={lane} style={appear(l.spawned)}>
					<line
						x1={CC.x + 38}
						y1={CC.y}
						x2={LANES_X0}
						y2={LANE_Y[lane] + 14}
						stroke={l.spawned ? "var(--ink-deck-muted)" : "var(--deck-line)"}
						strokeWidth={1}
					/>
					<rect
						x={LANES_X0}
						y={LANE_Y[lane]}
						width={LANES_X1 - LANES_X0}
						height={28}
						rx={2}
						fill={l.spawned ? "var(--deck-raised)" : "none"}
						stroke={
							l.running
								? "var(--accent-deck)"
								: l.spawned
									? "var(--ink-deck-muted)"
									: "var(--deck-line)"
						}
						strokeWidth={1}
						opacity={l.converged ? 0.5 : 1}
					/>
					<text
						x={LANES_X0 + 8}
						y={LANE_Y[lane] + 18}
						className="font-instrument"
						fontSize={8.5}
						fill={l.running ? "var(--accent-deck)" : "var(--ink-deck-muted)"}
						style={{ letterSpacing: "0.08em" }}
					>
						wt/corveth-{lane}
					</text>
					{l.converged ? (
						<line
							x1={LANES_X1}
							y1={LANE_Y[lane] + 14}
							x2={MERGE.x}
							y2={MERGE.y}
							stroke="var(--ink-deck)"
							strokeWidth={1}
						/>
					) : null}
				</g>
			))}

			{/* ---- converge -> gate -> ship ---- */}
			{anyConverged ? (
				<>
					<circle cx={MERGE.x} cy={MERGE.y} r={4} fill="var(--ink-deck)" />
					<line
						x1={MERGE.x}
						y1={MERGE.y}
						x2={GATE_X - 12}
						y2={MERGE.y}
						stroke="var(--ink-deck)"
						strokeWidth={1.5}
					/>
				</>
			) : null}

			<g
				data-testid="co-gate"
				data-state={blocked ? "block" : passed ? "pass" : "neutral"}
				style={appear(anyConverged)}
			>
				<line
					x1={GATE_X - 12}
					y1={MERGE.y - 26}
					x2={GATE_X - 12}
					y2={MERGE.y + 26}
					stroke={
						blocked
							? "var(--accent-deck)"
							: passed
								? "var(--ink-deck)"
								: "var(--ink-deck-muted)"
					}
					strokeWidth={2}
				/>
				<line
					x1={GATE_X + 12}
					y1={MERGE.y - 26}
					x2={GATE_X + 12}
					y2={MERGE.y + 26}
					stroke={
						blocked
							? "var(--accent-deck)"
							: passed
								? "var(--ink-deck)"
								: "var(--ink-deck-muted)"
					}
					strokeWidth={2}
				/>
				{passed ? (
					<line
						x1={GATE_X - 12}
						y1={MERGE.y - 26}
						x2={GATE_X + 18}
						y2={MERGE.y - 46}
						stroke="var(--ink-deck)"
						strokeWidth={2}
					/>
				) : (
					<line
						x1={GATE_X - 12}
						y1={MERGE.y - 8}
						x2={GATE_X + 12}
						y2={MERGE.y + 8}
						stroke={blocked ? "var(--accent-deck)" : "var(--ink-deck-muted)"}
						strokeWidth={2}
					/>
				)}
				<text
					x={GATE_X}
					y={MERGE.y + 46}
					textAnchor="middle"
					className="font-instrument"
					fontSize={9}
					fill={blocked ? "var(--accent-deck)" : "var(--ink-deck-muted)"}
					style={{ letterSpacing: "0.1em" }}
				>
					{blocked ? "VERIFY: BLOCK" : passed ? "VERIFY: PASS" : "VERIFY GATE"}
				</text>
			</g>

			{passed ? (
				<line
					x1={GATE_X + 12}
					y1={MERGE.y}
					x2={GATE_X + 80}
					y2={MERGE.y}
					stroke="var(--ink-deck)"
					strokeWidth={1.5}
				/>
			) : null}

			{shipped ? (
				<motion.g
					data-testid="co-shipped"
					initial={reducedMotion ? false : { opacity: 0 }}
					animate={{ opacity: 1 }}
					transition={reducedMotion ? { duration: 0 } : { duration: 0.4 }}
				>
					<line
						x1={GATE_X + 80}
						y1={MERGE.y}
						x2={BUILDLOG.x - 44}
						y2={BUILDLOG.y + 20}
						stroke="var(--ink-deck-muted)"
						strokeWidth={1}
						strokeDasharray="3 5"
					/>
					<rect
						x={BUILDLOG.x - 44}
						y={BUILDLOG.y - 14}
						width={92}
						height={32}
						rx={3}
						fill="var(--deck-raised)"
						stroke="var(--accent-deck)"
						strokeWidth={1}
					/>
					<text
						x={BUILDLOG.x + 2}
						y={BUILDLOG.y}
						textAnchor="middle"
						className="font-instrument"
						fontSize={8.5}
						fill="var(--ink-deck)"
						style={{ letterSpacing: "0.1em" }}
					>
						BUILD LOG
					</text>
					<text
						x={BUILDLOG.x + 2}
						y={BUILDLOG.y + 12}
						textAnchor="middle"
						className="font-instrument"
						fontSize={8}
						fill="var(--accent-deck)"
						style={{ letterSpacing: "0.1em" }}
					>
						SHIPPED
					</text>
				</motion.g>
			) : null}
		</svg>
	);
}
