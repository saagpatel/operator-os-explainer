import { motion } from "motion/react";
import type { SyntheticEvent } from "../../types/data.ts";
import type { VizProps } from "../../types/scene.ts";

type HandoffEvent = Extract<SyntheticEvent, { kind: "handoff" }>;

const BUS_Y = 170;
const BUS_NODES = [
	{ id: "claude_ai", x: 150, label: "CLAUDE.AI" },
	{ id: "cc", x: 430, label: "CLAUDE CODE" },
	{ id: "codex", x: 680, label: "CODEX" },
	{ id: "autonomous", x: 870, label: "AUTONOMOUS" },
] as const;

export const HERO_STAGES = [
	"dispatch",
	"snapshot",
	"pickup",
	"receipt",
	"clear",
] as const;

/** Hero lane geometry: claude_ai -> cc, five evenly spaced stage ticks. */
const LANE_Y = 90;
const LANE_X0 = 150;
const LANE_X1 = 430;
const tickX = (i: number) =>
	LANE_X0 + ((LANE_X1 - LANE_X0) * i) / (HERO_STAGES.length - 1);

/** Ambient Faltrin lane: claude_ai -> codex, below the bus. */
const AMBIENT_Y = 250;

/**
 * Scene 2 hero viz: bridge-db as a horizontal bus threading the four
 * systems, the Corveth handoff lane stepping through its five stages, and
 * the ambient Faltrin handoff below. Pure function of (events, t):
 * a stage tick is lit iff its event is visible at t.
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

	return (
		<svg
			viewBox="0 0 960 320"
			role="img"
			aria-label="bridge-db as a horizontal bus threading the four systems, with the Corveth handoff lane stepping through dispatch, snapshot, pickup, receipt and clear."
			className="block w-full"
		>
			{/* ---- the bus ---- */}
			<line
				x1={60}
				y1={BUS_Y}
				x2={920}
				y2={BUS_Y}
				stroke="var(--ink-deck-muted)"
				strokeWidth={1.5}
			/>
			<text
				x={60}
				y={BUS_Y + 24}
				className="font-instrument"
				fontSize={11}
				fill="var(--ink-deck-muted)"
				style={{ letterSpacing: "0.2em" }}
			>
				BRIDGE-DB · SQLITE + FTS
			</text>

			{BUS_NODES.map((n) => (
				<g key={n.id}>
					<line
						x1={n.x}
						y1={BUS_Y - 8}
						x2={n.x}
						y2={BUS_Y + 8}
						stroke="var(--ink-deck)"
						strokeWidth={1.5}
					/>
					<circle cx={n.x} cy={BUS_Y} r={3} fill="var(--ink-deck)" />
					<text
						x={n.x}
						y={BUS_Y - 18}
						textAnchor="middle"
						className="font-instrument"
						fontSize={11}
						fill="var(--ink-deck)"
						style={{ letterSpacing: "0.12em" }}
					>
						{n.label}
					</text>
				</g>
			))}

			{/* ---- hero handoff lane (Corveth, handoffId 1) ---- */}
			<line
				x1={LANE_X0}
				y1={LANE_Y}
				x2={LANE_X1}
				y2={LANE_Y}
				stroke={cleared ? "var(--ink-deck-muted)" : "var(--deck-line)"}
				strokeWidth={1}
			/>
			{/* risers connecting the lane to the bus at both systems */}
			<line
				x1={LANE_X0}
				y1={LANE_Y}
				x2={LANE_X0}
				y2={BUS_Y - 8}
				stroke="var(--deck-line)"
				strokeWidth={1}
				strokeDasharray="2 4"
			/>
			<line
				x1={LANE_X1}
				y1={LANE_Y}
				x2={LANE_X1}
				y2={BUS_Y - 8}
				stroke="var(--deck-line)"
				strokeWidth={1}
				strokeDasharray="2 4"
			/>

			<text
				x={LANE_X0}
				y={LANE_Y - 34}
				className="font-instrument"
				fontSize={11}
				fill="var(--ink-deck)"
				style={{ letterSpacing: "0.14em" }}
			>
				CORVETH · CLAUDE.AI -&gt; CC
			</text>
			<text
				x={LANE_X1 + 14}
				y={LANE_Y + 4}
				className="font-instrument"
				fontSize={10}
				fill={cleared ? "var(--accent-deck)" : "var(--ink-deck-muted)"}
				style={{ letterSpacing: "0.1em" }}
			>
				{cleared ? "CLEARED" : heroCount > 2 ? "ACTIVE" : "PENDING"}
			</text>

			{HERO_STAGES.map((stage, i) => {
				const lit = heroLit[i];
				return (
					<g key={stage} data-testid={`stage-${stage}`} data-lit={lit}>
						{stage === "snapshot" ? (
							<rect
								x={tickX(i) - 5}
								y={LANE_Y - 5}
								width={10}
								height={10}
								transform={`rotate(45 ${tickX(i)} ${LANE_Y})`}
								fill={lit ? "var(--accent-deck)" : "var(--deck-raised)"}
								stroke={lit ? "var(--accent-deck)" : "var(--ink-deck-muted)"}
								strokeWidth={1}
							/>
						) : (
							<circle
								cx={tickX(i)}
								cy={LANE_Y}
								r={5}
								fill={lit ? "var(--accent-deck)" : "var(--deck-raised)"}
								stroke={lit ? "var(--accent-deck)" : "var(--ink-deck-muted)"}
								strokeWidth={1}
							/>
						)}
						<text
							x={tickX(i)}
							y={LANE_Y + 24}
							textAnchor="middle"
							className="font-instrument"
							fontSize={10}
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
					animate={{ cx: tickX(heroCount - 1) }}
					initial={false}
					transition={
						reducedMotion
							? { duration: 0 }
							: { type: "spring", stiffness: 120, damping: 20 }
					}
					cy={LANE_Y - 14}
					r={6}
					fill="var(--accent-deck)"
				/>
			) : null}

			{/* ---- ambient Faltrin lane (handoffId 2), below the bus ---- */}
			{ambientStages.length > 0 ? (
				<g opacity={0.7}>
					<line
						x1={150}
						y1={AMBIENT_Y}
						x2={680}
						y2={AMBIENT_Y}
						stroke="var(--deck-line)"
						strokeWidth={1}
					/>
					<text
						x={150}
						y={AMBIENT_Y + 22}
						className="font-instrument"
						fontSize={10}
						fill="var(--ink-deck-muted)"
						style={{ letterSpacing: "0.12em" }}
					>
						FALTRIN · CLAUDE.AI -&gt; CODEX ·{" "}
						{ambientStages.some((e) => e.stage === "pickup")
							? "ACTIVE (LEASE HELD)"
							: "PENDING"}
					</text>
					{ambientStages.map((e) => (
						<circle
							key={e.id}
							cx={e.stage === "dispatch" ? 150 : 680}
							cy={AMBIENT_Y}
							r={4}
							fill="var(--ink-deck-muted)"
						/>
					))}
				</g>
			) : null}
		</svg>
	);
}
