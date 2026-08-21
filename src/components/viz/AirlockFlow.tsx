import { motion } from "motion/react";
import { useVizScale } from "../../lib/useVizScale";
import type { VizProps } from "../../types/scene.ts";

const LABELS = ["DRAFT", "APPROVAL", "SEND"] as const;

interface AirlockGeometry {
	viewBox: string;
	/** Top-left of each chamber, in order. */
	chambers: readonly { x: number; y: number }[];
	w: number;
	h: number;
	/** The outbound track, drawn through every chamber. */
	track: { x1: number; y1: number; x2: number; y2: number };
	outside: { x: number; y: number; anchor: "end" | "middle" };
	/** Where the capsule rests once `stageCount` chambers are complete. */
	capsule: (stageCount: number) => { x: number; y: number };
	/** Baseline the capsule body is drawn at inside its translated group. */
	capsuleY: number;
	/** Offsets from the chamber origin for its title and its affordance line. */
	title: { dx: number; dy: number };
	affordance: { dx: number; dy: number };
	sent: { x: number; y: number };
}

/** Wide: three chambers left to right, the capsule travels along x. */
const WIDE: AirlockGeometry = {
	viewBox: "0 0 960 300",
	chambers: [
		{ x: 120, y: 70 },
		{ x: 380, y: 70 },
		{ x: 640, y: 70 },
	],
	w: 200,
	h: 130,
	track: { x1: 30, y1: 135, x2: 940, y2: 135 },
	outside: { x: 940, y: 123, anchor: "end" },
	capsule: (n) => ({
		x: n === 0 ? -60 : n < 3 ? 120 + (n - 1) * 260 + 100 : 920,
		y: 0,
	}),
	capsuleY: 135,
	title: { dx: 100, dy: -12 },
	affordance: { dx: 100, dy: 116 },
	sent: { x: 880, y: 169 },
};

/**
 * Compact: the same airlock stood on end. Chambers stack, the track runs down
 * the page and the capsule descends through it, which keeps the "nothing
 * leaves until it clears every chamber" reading intact on a phone.
 */
const COMPACT: AirlockGeometry = {
	viewBox: "0 0 340 520",
	chambers: [
		{ x: 30, y: 60 },
		{ x: 30, y: 216 },
		{ x: 30, y: 372 },
	],
	w: 280,
	h: 112,
	track: { x1: 170, y1: 18, x2: 170, y2: 508 },
	outside: { x: 170, y: 506, anchor: "middle" },
	capsule: (n) => ({
		x: 170,
		y: n === 0 ? -50 : n < 3 ? 60 + (n - 1) * 156 + 56 : 490,
	}),
	capsuleY: 0,
	title: { dx: 140, dy: -10 },
	affordance: { dx: 140, dy: 98 },
	sent: { x: 170, y: 470 },
};

/**
 * Scene 5 hero viz: the draft -> approval -> send airlock as three literal
 * chambers. The capsule's position is a pure function of the hubflow events
 * visible at t. The token slot and send-window chip are UI affordances of
 * the real discipline: nothing leaves without an operator token inside an
 * open send window.
 */
export function AirlockFlow({ events, reducedMotion }: VizProps) {
	const stageCount = events.filter((e) => e.kind === "hubflow").length;
	const sent = stageCount >= 3;
	const { ref, variant: g, fs } = useVizScale({ wide: WIDE, compact: COMPACT });

	return (
		<svg
			ref={ref}
			viewBox={g.viewBox}
			role="img"
			aria-label="A three-chamber airlock. The draft capsule moves from the draft chamber through operator approval to the send window, and only then releases."
			className="block w-full"
		>
			{/* the outbound track */}
			<line
				x1={g.track.x1}
				y1={g.track.y1}
				x2={g.track.x2}
				y2={g.track.y2}
				stroke="var(--deck-line)"
				strokeWidth={1}
			/>
			<text
				x={g.outside.x}
				y={g.outside.y}
				textAnchor={g.outside.anchor}
				className="font-instrument"
				fontSize={fs(9)}
				fill="var(--ink-deck-muted)"
				style={{ letterSpacing: "0.14em" }}
			>
				OUTSIDE
			</text>

			{g.chambers.map((c, i) => {
				const active = stageCount === i + 1;
				const passedThrough = stageCount > i + 1 || (sent && i === 2);
				return (
					<g
						key={LABELS[i]}
						data-testid={`chamber-${LABELS[i].toLowerCase()}`}
						data-active={active}
					>
						<rect
							x={c.x}
							y={c.y}
							width={g.w}
							height={g.h}
							rx={4}
							fill={active ? "var(--deck-raised)" : "none"}
							stroke={
								active
									? "var(--accent-deck)"
									: passedThrough
										? "var(--ink-deck-muted)"
										: "var(--deck-line)"
							}
							strokeWidth={active ? 1.5 : 1}
						/>
						<text
							x={c.x + g.title.dx}
							y={c.y + g.title.dy}
							textAnchor="middle"
							className="font-instrument"
							fontSize={fs(11)}
							fill={active ? "var(--accent-deck)" : "var(--ink-deck-muted)"}
							style={{ letterSpacing: "0.16em" }}
						>
							{i + 1} · {LABELS[i]}
						</text>

						{/* chamber-specific affordances */}
						{i === 1 ? (
							<text
								x={c.x + g.affordance.dx}
								y={c.y + g.affordance.dy}
								textAnchor="middle"
								className="font-instrument"
								fontSize={fs(8.5)}
								fill={
									stageCount >= 2
										? "var(--accent-deck)"
										: "var(--ink-deck-muted)"
								}
								style={{ letterSpacing: "0.08em" }}
							>
								{stageCount >= 2
									? "TOKEN ACCEPTED · OPERATOR-MINTED"
									: "APPROVAL PENDING - TOKEN REQUIRED"}
							</text>
						) : null}
						{i === 2 ? (
							<text
								x={c.x + g.affordance.dx}
								y={c.y + g.affordance.dy}
								textAnchor="middle"
								className="font-instrument"
								fontSize={fs(8.5)}
								fill={sent ? "var(--accent-deck)" : "var(--ink-deck-muted)"}
								style={{ letterSpacing: "0.08em" }}
							>
								{sent ? "SEND WINDOW OPEN" : "SEND WINDOW CLOSED"}
							</text>
						) : null}
					</g>
				);
			})}

			{/* the capsule */}
			{stageCount > 0 ? (
				<motion.g
					data-testid="capsule"
					data-sent={sent}
					animate={g.capsule(stageCount)}
					initial={false}
					transition={
						reducedMotion
							? { duration: 0 }
							: { type: "spring", stiffness: 90, damping: 18 }
					}
				>
					<rect
						x={-34}
						y={g.capsuleY - 16}
						width={68}
						height={32}
						rx={16}
						fill="var(--deck)"
						stroke="var(--accent-deck)"
						strokeWidth={1.5}
					/>
					<text
						x={0}
						y={g.capsuleY + 4}
						textAnchor="middle"
						className="font-instrument"
						fontSize={fs(9)}
						fill="var(--accent-deck)"
						style={{ letterSpacing: "0.1em" }}
					>
						DRAFT-71
					</text>
				</motion.g>
			) : null}

			{sent ? (
				<text
					x={g.sent.x}
					y={g.sent.y}
					textAnchor="middle"
					className="font-instrument"
					fontSize={fs(9.5)}
					fill="var(--ink-deck)"
					style={{ letterSpacing: "0.12em" }}
					data-testid="capsule-sent"
				>
					SENT
				</text>
			) : null}
		</svg>
	);
}
