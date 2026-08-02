import { motion } from "motion/react";
import { useVizScale } from "../../lib/useVizScale";
import type { SyntheticEvent } from "../../types/data.ts";
import type { VizProps } from "../../types/scene.ts";

type HandoffEvent = Extract<SyntheticEvent, { kind: "handoff" }>;

const BUS_LABELS = [
	"CLAUDE.AI",
	"CLAUDE CODE",
	"CODEX",
	"AUTONOMOUS",
] as const;

export const HERO_STAGES = [
	"dispatch",
	"snapshot",
	"pickup",
	"receipt",
	"clear",
] as const;

type Anchor = "start" | "middle" | "end";
interface Pt {
	x: number;
	y: number;
}
interface Seg {
	x1: number;
	y1: number;
	x2: number;
	y2: number;
}
interface Label extends Pt {
	anchor: Anchor;
}

interface SpineGeometry {
	viewBox: string;
	bus: Seg;
	busLabel: Label;
	/** Bus tap for system i: the tick across the bus, its dot, and its name. */
	nodeTick: (i: number) => Seg;
	nodeDot: (i: number) => Pt;
	nodeLabel: (i: number) => Label;
	heroLane: Seg;
	/** Dashed riser tying each end of the hero lane back to the bus. */
	riser: (end: 0 | 1) => Seg;
	heroTitle: Label;
	stageMark: (i: number) => Pt;
	stageLabel: (i: number) => Label;
	/** The baton sits beside the lane, offset perpendicular to it. */
	baton: (i: number) => Pt;
	status: Label;
	ambientLine: Seg;
	ambientDot: (isDispatch: boolean) => Pt;
	/** Ambient caption, split across lines where the canvas is narrow. */
	ambientLabel: readonly Label[];
}

const WIDE_BUS_X = [150, 430, 680, 870] as const;
const WIDE_BUS_Y = 170;
const WIDE_LANE_Y = 90;
const wideTickX = (i: number) => 150 + (280 * i) / (HERO_STAGES.length - 1);

/** Wide: the bus runs left to right, lanes stack above and below it. */
const WIDE: SpineGeometry = {
	viewBox: "0 0 960 320",
	bus: { x1: 60, y1: WIDE_BUS_Y, x2: 920, y2: WIDE_BUS_Y },
	busLabel: { x: 60, y: WIDE_BUS_Y + 24, anchor: "start" },
	nodeTick: (i) => ({
		x1: WIDE_BUS_X[i],
		y1: WIDE_BUS_Y - 8,
		x2: WIDE_BUS_X[i],
		y2: WIDE_BUS_Y + 8,
	}),
	nodeDot: (i) => ({ x: WIDE_BUS_X[i], y: WIDE_BUS_Y }),
	nodeLabel: (i) => ({ x: WIDE_BUS_X[i], y: WIDE_BUS_Y - 18, anchor: "middle" }),
	heroLane: { x1: 150, y1: WIDE_LANE_Y, x2: 430, y2: WIDE_LANE_Y },
	riser: (end) => ({
		x1: end === 0 ? 150 : 430,
		y1: WIDE_LANE_Y,
		x2: end === 0 ? 150 : 430,
		y2: WIDE_BUS_Y - 8,
	}),
	heroTitle: { x: 150, y: WIDE_LANE_Y - 34, anchor: "start" },
	stageMark: (i) => ({ x: wideTickX(i), y: WIDE_LANE_Y }),
	stageLabel: (i) => ({
		x: wideTickX(i),
		y: WIDE_LANE_Y + 24,
		anchor: "middle",
	}),
	baton: (i) => ({ x: wideTickX(i), y: WIDE_LANE_Y - 14 }),
	status: { x: 444, y: WIDE_LANE_Y + 4, anchor: "start" },
	ambientLine: { x1: 150, y1: 250, x2: 680, y2: 250 },
	ambientDot: (isDispatch) => ({ x: isDispatch ? 150 : 680, y: 250 }),
	ambientLabel: [{ x: 150, y: 272, anchor: "start" }],
};

const CO_BUS_X = 44;
const CO_NODE_Y = [100, 250, 380, 470] as const;
const CO_LANE_X = 180;
const coTickY = (i: number) => 100 + (150 * i) / (HERO_STAGES.length - 1);

/**
 * Compact: the bus stands on end. Four mono system names cannot sit side by
 * side in 340 units, but they stack cleanly down a vertical bus with their
 * labels left-anchored beside each tap, and the handoff lane runs parallel.
 */
const COMPACT: SpineGeometry = {
	viewBox: "0 0 340 560",
	bus: { x1: CO_BUS_X, y1: 56, x2: CO_BUS_X, y2: 500 },
	busLabel: { x: 20, y: 32, anchor: "start" },
	nodeTick: (i) => ({
		x1: CO_BUS_X - 8,
		y1: CO_NODE_Y[i],
		x2: CO_BUS_X + 8,
		y2: CO_NODE_Y[i],
	}),
	nodeDot: (i) => ({ x: CO_BUS_X, y: CO_NODE_Y[i] }),
	nodeLabel: (i) => ({ x: CO_BUS_X + 16, y: CO_NODE_Y[i] + 4, anchor: "start" }),
	heroLane: { x1: CO_LANE_X, y1: 100, x2: CO_LANE_X, y2: 250 },
	riser: (end) => ({
		x1: CO_BUS_X + 8,
		y1: end === 0 ? 100 : 250,
		x2: CO_LANE_X,
		y2: end === 0 ? 100 : 250,
	}),
	heroTitle: { x: 330, y: 76, anchor: "end" },
	stageMark: (i) => ({ x: CO_LANE_X, y: coTickY(i) }),
	stageLabel: (i) => ({ x: CO_LANE_X + 16, y: coTickY(i) + 4, anchor: "start" }),
	baton: (i) => ({ x: CO_LANE_X - 16, y: coTickY(i) }),
	status: { x: 330, y: 276, anchor: "end" },
	ambientLine: { x1: 300, y1: 100, x2: 300, y2: 380 },
	ambientDot: (isDispatch) => ({ x: 300, y: isDispatch ? 100 : 380 }),
	ambientLabel: [
		{ x: 330, y: 404, anchor: "end" },
		{ x: 330, y: 424, anchor: "end" },
	],
};

/**
 * Scene 2 hero viz: bridge-db as a bus threading the four systems, the Corveth
 * handoff lane stepping through its five stages, and the ambient Faltrin
 * handoff alongside. Pure function of (events, t): a stage tick is lit iff its
 * event is visible at t.
 */
export function SpineBus({ events, reducedMotion }: VizProps) {
	const handoffEvents = events.filter(
		(e): e is HandoffEvent => e.kind === "handoff",
	);
	const heroLit = HERO_STAGES.map((stage) =>
		handoffEvents.some((e) => e.handoffId === 1 && e.stage === stage),
	);
	const heroCount = heroLit.filter(Boolean).length;
	const cleared = heroLit[4];
	const ambientStages = handoffEvents.filter((e) => e.handoffId === 2);
	const ambientHeld = ambientStages.some((e) => e.stage === "pickup");
	const { ref, variant: g, fs } = useVizScale({ wide: WIDE, compact: COMPACT });

	// The caption reads as one sentence wide, and breaks at the "·" when the
	// canvas is too narrow to carry it on one line.
	const ambientText = [
		"FALTRIN · CLAUDE.AI -> CODEX",
		ambientHeld ? "ACTIVE (LEASE HELD)" : "PENDING",
	];
	const ambientLines =
		g.ambientLabel.length === 1 ? [ambientText.join(" · ")] : ambientText;

	return (
		<svg
			ref={ref}
			viewBox={g.viewBox}
			role="img"
			aria-label="bridge-db as a bus threading the four systems, with the Corveth handoff lane stepping through dispatch, snapshot, pickup, receipt and clear."
			className="block w-full"
		>
			{/* ---- the bus ---- */}
			<line
				{...g.bus}
				stroke="var(--ink-deck-muted)"
				strokeWidth={1.5}
			/>
			<text
				x={g.busLabel.x}
				y={g.busLabel.y}
				textAnchor={g.busLabel.anchor}
				className="font-instrument"
				fontSize={fs(11)}
				fill="var(--ink-deck-muted)"
				style={{ letterSpacing: "0.2em" }}
			>
				BRIDGE-DB · SQLITE + FTS
			</text>

			{BUS_LABELS.map((label, i) => {
				const dot = g.nodeDot(i);
				const at = g.nodeLabel(i);
				return (
					<g key={label}>
						<line
							{...g.nodeTick(i)}
							stroke="var(--ink-deck)"
							strokeWidth={1.5}
						/>
						<circle cx={dot.x} cy={dot.y} r={3} fill="var(--ink-deck)" />
						<text
							x={at.x}
							y={at.y}
							textAnchor={at.anchor}
							className="font-instrument"
							fontSize={fs(11)}
							fill="var(--ink-deck)"
							style={{ letterSpacing: "0.12em" }}
						>
							{label}
						</text>
					</g>
				);
			})}

			{/* ---- hero handoff lane (Corveth, handoffId 1) ---- */}
			<line
				{...g.heroLane}
				stroke={cleared ? "var(--ink-deck-muted)" : "var(--deck-line)"}
				strokeWidth={1}
			/>
			<line
				{...g.riser(0)}
				stroke="var(--deck-line)"
				strokeWidth={1}
				strokeDasharray="2 4"
			/>
			<line
				{...g.riser(1)}
				stroke="var(--deck-line)"
				strokeWidth={1}
				strokeDasharray="2 4"
			/>

			<text
				x={g.heroTitle.x}
				y={g.heroTitle.y}
				textAnchor={g.heroTitle.anchor}
				className="font-instrument"
				fontSize={fs(11)}
				fill="var(--ink-deck)"
				style={{ letterSpacing: "0.14em" }}
			>
				CORVETH · CLAUDE.AI -&gt; CC
			</text>
			<text
				x={g.status.x}
				y={g.status.y}
				textAnchor={g.status.anchor}
				className="font-instrument"
				fontSize={fs(10)}
				fill={cleared ? "var(--accent-deck)" : "var(--ink-deck-muted)"}
				style={{ letterSpacing: "0.1em" }}
			>
				{cleared ? "CLEARED" : heroCount > 2 ? "ACTIVE" : "PENDING"}
			</text>

			{HERO_STAGES.map((stage, i) => {
				const lit = heroLit[i];
				const mark = g.stageMark(i);
				const at = g.stageLabel(i);
				return (
					<g key={stage} data-testid={`stage-${stage}`} data-lit={lit}>
						{stage === "snapshot" ? (
							<rect
								x={mark.x - 5}
								y={mark.y - 5}
								width={10}
								height={10}
								transform={`rotate(45 ${mark.x} ${mark.y})`}
								fill={lit ? "var(--accent-deck)" : "var(--deck-raised)"}
								stroke={lit ? "var(--accent-deck)" : "var(--ink-deck-muted)"}
								strokeWidth={1}
							/>
						) : (
							<circle
								cx={mark.x}
								cy={mark.y}
								r={5}
								fill={lit ? "var(--accent-deck)" : "var(--deck-raised)"}
								stroke={lit ? "var(--accent-deck)" : "var(--ink-deck-muted)"}
								strokeWidth={1}
							/>
						)}
						<text
							x={at.x}
							y={at.y}
							textAnchor={at.anchor}
							className="font-instrument"
							fontSize={fs(10)}
							fill={lit ? "var(--ink-deck)" : "var(--ink-deck-muted)"}
							style={{ letterSpacing: "0.08em" }}
						>
							{stage}
						</text>
					</g>
				);
			})}

			{/* the baton: sits at the latest lit stage */}
			{heroCount > 0 && !cleared ? (
				<motion.circle
					data-testid="baton"
					animate={{
						cx: g.baton(heroCount - 1).x,
						cy: g.baton(heroCount - 1).y,
					}}
					initial={false}
					transition={
						reducedMotion
							? { duration: 0 }
							: { type: "spring", stiffness: 120, damping: 20 }
					}
					r={6}
					fill="var(--accent-deck)"
				/>
			) : null}

			{/* ---- ambient Faltrin lane (handoffId 2) ---- */}
			{ambientStages.length > 0 ? (
				<g opacity={0.7}>
					<line
						{...g.ambientLine}
						stroke="var(--deck-line)"
						strokeWidth={1}
					/>
					{ambientLines.map((line, i) => {
						const at = g.ambientLabel[i];
						return (
							<text
								key={line}
								x={at.x}
								y={at.y}
								textAnchor={at.anchor}
								className="font-instrument"
								fontSize={fs(10)}
								fill="var(--ink-deck-muted)"
								style={{ letterSpacing: "0.12em" }}
							>
								{line}
							</text>
						);
					})}
					{ambientStages.map((e) => {
						const dot = g.ambientDot(e.stage === "dispatch");
						return (
							<circle
								key={e.id}
								cx={dot.x}
								cy={dot.y}
								r={4}
								fill="var(--ink-deck-muted)"
							/>
						);
					})}
				</g>
			) : null}
		</svg>
	);
}
