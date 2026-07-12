import { motion } from "motion/react";
import type { VizProps } from "../../types/scene.ts";

const W = 960;
const H = 300;
const CHAMBER_W = 200;
const CHAMBER_H = 130;
const CHAMBER_Y = 70;
const CHAMBER_X = [120, 380, 640] as const;
const LABELS = ["DRAFT", "APPROVAL", "SEND"] as const;

/** Capsule x-position per completed hubflow stage count (0..3). */
const capsuleX = (stageCount: number) =>
	stageCount === 0
		? -60
		: stageCount < 3
			? CHAMBER_X[stageCount - 1] + CHAMBER_W / 2
			: 920;

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

	return (
		<svg
			viewBox={`0 0 ${W} ${H}`}
			role="img"
			aria-label="A three-chamber airlock. The draft capsule moves from the draft chamber through operator approval to the send window, and only then releases."
			className="block w-full"
		>
			{/* the outbound track */}
			<line
				x1={30}
				y1={CHAMBER_Y + CHAMBER_H / 2}
				x2={W - 20}
				y2={CHAMBER_Y + CHAMBER_H / 2}
				stroke="var(--deck-line)"
				strokeWidth={1}
			/>
			<text
				x={W - 20}
				y={CHAMBER_Y + CHAMBER_H / 2 - 12}
				textAnchor="end"
				className="font-instrument"
				fontSize={9}
				fill="var(--ink-deck-muted)"
				style={{ letterSpacing: "0.14em" }}
			>
				OUTSIDE
			</text>

			{CHAMBER_X.map((x, i) => {
				const active = stageCount === i + 1;
				const passedThrough = stageCount > i + 1 || (sent && i === 2);
				return (
					<g
						key={LABELS[i]}
						data-testid={`chamber-${LABELS[i].toLowerCase()}`}
						data-active={active}
					>
						<rect
							x={x}
							y={CHAMBER_Y}
							width={CHAMBER_W}
							height={CHAMBER_H}
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
							x={x + CHAMBER_W / 2}
							y={CHAMBER_Y - 12}
							textAnchor="middle"
							className="font-instrument"
							fontSize={11}
							fill={active ? "var(--accent-deck)" : "var(--ink-deck-muted)"}
							style={{ letterSpacing: "0.16em" }}
						>
							{i + 1} · {LABELS[i]}
						</text>

						{/* chamber-specific affordances */}
						{i === 1 ? (
							<text
								x={x + CHAMBER_W / 2}
								y={CHAMBER_Y + CHAMBER_H - 14}
								textAnchor="middle"
								className="font-instrument"
								fontSize={8.5}
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
								x={x + CHAMBER_W / 2}
								y={CHAMBER_Y + CHAMBER_H - 14}
								textAnchor="middle"
								className="font-instrument"
								fontSize={8.5}
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
					animate={{ x: capsuleX(stageCount) }}
					initial={false}
					transition={
						reducedMotion
							? { duration: 0 }
							: { type: "spring", stiffness: 90, damping: 18 }
					}
				>
					<rect
						x={-34}
						y={CHAMBER_Y + CHAMBER_H / 2 - 16}
						width={68}
						height={32}
						rx={16}
						fill="var(--deck)"
						stroke="var(--accent-deck)"
						strokeWidth={1.5}
					/>
					<text
						x={0}
						y={CHAMBER_Y + CHAMBER_H / 2 + 4}
						textAnchor="middle"
						className="font-instrument"
						fontSize={9}
						fill="var(--accent-deck)"
						style={{ letterSpacing: "0.1em" }}
					>
						DRAFT-71
					</text>
				</motion.g>
			) : null}

			{sent ? (
				<text
					x={880}
					y={CHAMBER_Y + CHAMBER_H / 2 + 34}
					textAnchor="middle"
					className="font-instrument"
					fontSize={9.5}
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
