import { motion } from "motion/react";
import { useVizScale } from "../../lib/useVizScale";
import type { SyntheticEvent } from "../../types/data.ts";
import type { VizProps } from "../../types/scene.ts";

type Fanout = Extract<SyntheticEvent, { kind: "fanout" }>;

const STAGES = ["dispatch", "snapshot", "pickup", "receipt", "clear"] as const;

interface Pt {
	x: number;
	y: number;
}
interface Rect {
	x: number;
	y: number;
	width: number;
	height: number;
}

interface ColdOpenGeometry {
	viewBox: string;
	claudeAi: Pt;
	claudeAiR: number;
	claudeAiLabel: Pt;
	/** The claude_ai -> cc run, already trimmed to both rings. */
	link: { x1: number; y1: number; x2: number; y2: number };
	stageTick: (i: number) => Pt;
	stageLabel: (i: number) => Pt;
	stageAnchor: "middle" | "start";
	cc: Pt;
	ccR: number;
	ccInner: number;
	ccLabel: Pt;
	guardArc: string;
	guardLabel: Pt;
	/** Fan-out lane i: its box, the run in from cc, and its worktree caption. */
	lane: (i: number) => { rect: Rect; from: Pt; to: Pt; label: Pt };
	merge: Pt;
	/** Where the converge run meets the gate, and the gate's own centre. */
	gateIn: Pt;
	gate: Pt;
	gateHalf: number;
	gateReach: number;
	gateLabel: Pt;
	/** The short run out of an open gate, then the dashed hop to the build log. */
	passRun: { x1: number; y1: number; x2: number; y2: number };
	shipRun: { x1: number; y1: number; x2: number; y2: number };
	buildlog: { rect: Rect; title: Pt; status: Pt };
}

const W_CC = { x: 300, y: 220 };

/** Wide: the whole mission reads left to right across a 960-unit stage. */
const WIDE: ColdOpenGeometry = {
	viewBox: "0 0 960 440",
	claudeAi: { x: 110, y: 220 },
	claudeAiR: 34,
	claudeAiLabel: { x: 110, y: 276 },
	link: { x1: 144, y1: 220, x2: 262, y2: 220 },
	stageTick: (i) => ({ x: 162 + i * 40, y: 234 }),
	stageLabel: (i) => ({ x: 162 + i * 40, y: 252 }),
	stageAnchor: "middle",
	cc: W_CC,
	ccR: 38,
	ccInner: 30,
	ccLabel: { x: 300, y: 280 },
	guardArc: `M ${W_CC.x - 52} ${W_CC.y - 26} A 58 58 0 0 1 ${W_CC.x + 52} ${W_CC.y - 26}`,
	guardLabel: { x: 300, y: 146 },
	lane: (i) => ({
		rect: { x: 400, y: 140 + i * 80, width: 160, height: 28 },
		from: { x: 338, y: 220 },
		to: { x: 400, y: 154 + i * 80 },
		label: { x: 408, y: 158 + i * 80 },
	}),
	merge: { x: 610, y: 220 },
	gateIn: { x: 678, y: 220 },
	gate: { x: 690, y: 220 },
	gateHalf: 12,
	gateReach: 26,
	gateLabel: { x: 690, y: 266 },
	passRun: { x1: 702, y1: 220, x2: 770, y2: 220 },
	shipRun: { x1: 770, y1: 220, x2: 816, y2: 150 },
	buildlog: {
		rect: { x: 816, y: 116, width: 92, height: 32 },
		title: { x: 862, y: 130 },
		status: { x: 862, y: 142 },
	},
};

const C_CC = { x: 60, y: 306 };
const C_LANE_Y = [386, 430, 474] as const;

/**
 * Compact: the same mission stood on end. Nothing is cut, the run simply reads
 * top to bottom, which is the only axis a phone has enough of. The handoff
 * ticks move to the side of the run so their captions get real width.
 *
 * The first 56 units are left clear: the scene parks its prompt chip over the
 * top-left of this canvas, and on a narrow canvas that chip spans most of the
 * width rather than tucking into empty margin the way it does on desktop.
 */
const COMPACT: ColdOpenGeometry = {
	viewBox: "0 0 340 716",
	claudeAi: { x: 60, y: 114 },
	claudeAiR: 26,
	claudeAiLabel: { x: 60, y: 82 },
	link: { x1: 60, y1: 140, x2: 60, y2: 278 },
	stageTick: (i) => ({ x: 74, y: 156 + i * 30 }),
	stageLabel: (i) => ({ x: 86, y: 160 + i * 30 }),
	stageAnchor: "start",
	cc: C_CC,
	ccR: 28,
	ccInner: 22,
	ccLabel: { x: 60, y: 352 },
	guardArc: `M ${C_CC.x - 40} ${C_CC.y - 20} A 44 44 0 0 1 ${C_CC.x + 40} ${C_CC.y - 20}`,
	guardLabel: { x: 170, y: 252 },
	lane: (i) => ({
		rect: { x: 100, y: C_LANE_Y[i], width: 150, height: 32 },
		// Fans out from beneath the CLAUDE CODE caption rather than from the
		// ring, so three converging runs never cross the label.
		from: { x: 60, y: 364 },
		to: { x: 100, y: C_LANE_Y[i] + 16 },
		label: { x: 108, y: C_LANE_Y[i] + 21 },
	}),
	merge: { x: 280, y: 526 },
	gateIn: { x: 280, y: 566 },
	gate: { x: 280, y: 592 },
	gateHalf: 12,
	gateReach: 26,
	gateLabel: { x: 280, y: 638 },
	passRun: { x1: 280, y1: 618, x2: 280, y2: 646 },
	shipRun: { x1: 280, y1: 646, x2: 260, y2: 660 },
	buildlog: {
		rect: { x: 180, y: 660, width: 120, height: 36 },
		title: { x: 240, y: 678 },
		status: { x: 240, y: 692 },
	},
};

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
	const { ref, variant: g, fs } = useVizScale({ wide: WIDE, compact: COMPACT });

	const appear = (visible: boolean) => ({ opacity: visible ? 1 : 0.18 });

	return (
		<svg
			ref={ref}
			viewBox={g.viewBox}
			role="img"
			aria-label="The whole operator OS as a constellation: an instruction routes to Claude Code, crosses the spine as a handoff, fans out into worktrees, survives a guard block, passes the verify gate on attempt two, and ships to the build log."
			className="block w-full"
		>
			{/* ---- claude_ai -> cc: routing + the handoff lease ---- */}
			<g style={appear(true)}>
				<circle
					cx={g.claudeAi.x}
					cy={g.claudeAi.y}
					r={g.claudeAiR}
					fill="var(--deck-raised)"
					stroke="var(--ink-deck-muted)"
					strokeWidth={1}
					strokeDasharray="3 5"
				/>
				<text
					x={g.claudeAiLabel.x}
					y={g.claudeAiLabel.y}
					textAnchor="middle"
					className="font-instrument"
					fontSize={fs(10)}
					fill="var(--ink-deck)"
					style={{ letterSpacing: "0.12em" }}
				>
					CLAUDE.AI
				</text>
			</g>

			<line
				{...g.link}
				stroke={dispatched ? "var(--accent-deck)" : "var(--deck-line)"}
				strokeWidth={1}
				opacity={dispatched ? 0.7 : 1}
			/>
			{/* handoff stage ticks along the connector */}
			{STAGES.slice(0, 3).map((stage, i) => {
				const tick = g.stageTick(i);
				const at = g.stageLabel(i);
				const lit = handoffStages.has(stage);
				return (
					<g key={stage}>
						<circle
							cx={tick.x}
							cy={tick.y}
							r={3.5}
							fill={lit ? "var(--accent-deck)" : "var(--deck-raised)"}
							stroke={lit ? "var(--accent-deck)" : "var(--deck-line)"}
							strokeWidth={1}
						/>
						<text
							x={at.x}
							y={at.y}
							textAnchor={g.stageAnchor}
							className="font-instrument"
							fontSize={fs(8)}
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
					cx={g.cc.x}
					cy={g.cc.y}
					r={g.ccR}
					fill="var(--deck-raised)"
					stroke={dispatched ? "var(--ink-deck)" : "var(--ink-deck-muted)"}
					strokeWidth={1}
				/>
				<circle
					cx={g.cc.x}
					cy={g.cc.y}
					r={g.ccInner}
					fill="none"
					stroke={dispatched ? "var(--ink-deck)" : "var(--ink-deck-muted)"}
					strokeWidth={1}
				/>
				<text
					x={g.ccLabel.x}
					y={g.ccLabel.y}
					textAnchor="middle"
					className="font-instrument"
					fontSize={fs(10)}
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
						d={g.guardArc}
						fill="none"
						stroke="var(--accent-deck)"
						strokeWidth={1.5}
					/>
					<text
						x={g.guardLabel.x}
						y={g.guardLabel.y}
						textAnchor="middle"
						className="font-instrument"
						fontSize={fs(9)}
						fill="var(--accent-deck)"
						style={{ letterSpacing: "0.08em" }}
					>
						hard-deny fired -&gt; opened a branch
					</text>
				</g>
			) : null}

			{/* ---- fan-out lanes ---- */}
			{laneState.map((l, lane) => {
				const geo = g.lane(lane);
				return (
					<g key={lane} style={appear(l.spawned)}>
						<line
							x1={geo.from.x}
							y1={geo.from.y}
							x2={geo.to.x}
							y2={geo.to.y}
							stroke={l.spawned ? "var(--ink-deck-muted)" : "var(--deck-line)"}
							strokeWidth={1}
						/>
						<rect
							{...geo.rect}
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
							x={geo.label.x}
							y={geo.label.y}
							className="font-instrument"
							fontSize={fs(8.5)}
							fill={l.running ? "var(--accent-deck)" : "var(--ink-deck-muted)"}
							style={{ letterSpacing: "0.08em" }}
						>
							wt/corveth-{lane}
						</text>
						{l.converged ? (
							<line
								x1={geo.rect.x + geo.rect.width}
								y1={geo.to.y}
								x2={g.merge.x}
								y2={g.merge.y}
								stroke="var(--ink-deck)"
								strokeWidth={1}
							/>
						) : null}
					</g>
				);
			})}

			{/* ---- converge -> gate -> ship ---- */}
			{anyConverged ? (
				<>
					<circle cx={g.merge.x} cy={g.merge.y} r={4} fill="var(--ink-deck)" />
					<line
						x1={g.merge.x}
						y1={g.merge.y}
						x2={g.gateIn.x}
						y2={g.gateIn.y}
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
					x1={g.gate.x - g.gateHalf}
					y1={g.gate.y - g.gateReach}
					x2={g.gate.x - g.gateHalf}
					y2={g.gate.y + g.gateReach}
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
					x1={g.gate.x + g.gateHalf}
					y1={g.gate.y - g.gateReach}
					x2={g.gate.x + g.gateHalf}
					y2={g.gate.y + g.gateReach}
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
						x1={g.gate.x - g.gateHalf}
						y1={g.gate.y - g.gateReach}
						x2={g.gate.x + g.gateHalf + 6}
						y2={g.gate.y - g.gateReach - 20}
						stroke="var(--ink-deck)"
						strokeWidth={2}
					/>
				) : (
					<line
						x1={g.gate.x - g.gateHalf}
						y1={g.gate.y - 8}
						x2={g.gate.x + g.gateHalf}
						y2={g.gate.y + 8}
						stroke={blocked ? "var(--accent-deck)" : "var(--ink-deck-muted)"}
						strokeWidth={2}
					/>
				)}
				<text
					x={g.gateLabel.x}
					y={g.gateLabel.y}
					textAnchor="middle"
					className="font-instrument"
					fontSize={fs(9)}
					fill={blocked ? "var(--accent-deck)" : "var(--ink-deck-muted)"}
					style={{ letterSpacing: "0.1em" }}
				>
					{blocked ? "VERIFY: BLOCK" : passed ? "VERIFY: PASS" : "VERIFY GATE"}
				</text>
			</g>

			{passed ? (
				<line
					{...g.passRun}
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
						{...g.shipRun}
						stroke="var(--ink-deck-muted)"
						strokeWidth={1}
						strokeDasharray="3 5"
					/>
					<rect
						{...g.buildlog.rect}
						rx={3}
						fill="var(--deck-raised)"
						stroke="var(--accent-deck)"
						strokeWidth={1}
					/>
					<text
						x={g.buildlog.title.x}
						y={g.buildlog.title.y}
						textAnchor="middle"
						className="font-instrument"
						fontSize={fs(8.5)}
						fill="var(--ink-deck)"
						style={{ letterSpacing: "0.1em" }}
					>
						BUILD LOG
					</text>
					<text
						x={g.buildlog.status.x}
						y={g.buildlog.status.y}
						textAnchor="middle"
						className="font-instrument"
						fontSize={fs(8)}
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
