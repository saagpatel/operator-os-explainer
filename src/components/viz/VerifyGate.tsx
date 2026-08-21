import { formatClock } from "../../lib/format";
import { useVizScale } from "../../lib/useVizScale";
import type { SyntheticEvent } from "../../types/data.ts";
import type { VizProps } from "../../types/scene.ts";

type Verify = Extract<SyntheticEvent, { kind: "verify" }>;
type Ship = Extract<SyntheticEvent, { kind: "ship" }>;
type HandoffEvent = Extract<SyntheticEvent, { kind: "handoff" }>;

const W = 400;
const H = 400;
const LINE_Y = 200;
const GATE_X = 96;
const NOTION = { x: 290, y: 110 };

/**
 * This viz already draws into a 400-unit box, so it needs no re-composition to
 * stay legible on a phone: the shared label floor is enough. What it does need
 * is room for those larger labels, so the left-anchored runs start at the edge
 * and the SHIPPED card spans the full canvas.
 */
interface GateGeometry {
	viewBox: string;
	attemptX: number;
	shipped: { rect: { x: number; width: number }; textX: number };
}

const WIDE: GateGeometry = {
	viewBox: `0 0 ${W} ${H}`,
	attemptX: GATE_X - 24,
	shipped: { rect: { x: 150, width: 220 }, textX: 162 },
};

const COMPACT: GateGeometry = {
	viewBox: `0 0 ${W} ${H}`,
	attemptX: 12,
	shipped: { rect: { x: 12, width: 376 }, textX: 24 },
};

/**
 * Scene 4: the verify gate and the ship ripple. The gate is allowed to say
 * no: attempt 1 blocks (coral, closed, commit bounced), attempt 2 passes
 * (gate opens), then the SHIPPED tag ripples its sync obligation out to the
 * external build log. State is a pure function of (events, t); semantics
 * are carried by icon + mono text, never color alone (SPEC 2.5).
 */
export function VerifyGate({ events, t, reducedMotion, dataset }: VizProps) {
	const verifies = events.filter((e): e is Verify => e.kind === "verify");
	const blockedNow =
		verifies.some((e) => e.result === "block") &&
		!verifies.some((e) => e.result === "pass");
	const passed = verifies.some((e) => e.result === "pass");
	const ship = events.find((e): e is Ship => e.kind === "ship");
	// The SHIPPED card reveals with its tagged activity event (ev26 @17400);
	// the sync ripple belongs to the later ship event (ev27 @18000).
	const shippedActivity = events
		.flatMap((e) => (e.kind === "activity" ? [e.activityId] : []))
		.map((id) => dataset.activity.find((a) => a.id === id))
		.find((a) => a?.tags.includes("SHIPPED"));
	const receipt = events.find(
		(e): e is HandoffEvent => e.kind === "handoff" && e.stage === "receipt",
	);
	const clear = events.find(
		(e): e is HandoffEvent => e.kind === "handoff" && e.stage === "clear",
	);

	const gateStroke = blockedNow
		? "var(--accent-deck)"
		: passed
			? "var(--ink-deck)"
			: "var(--ink-deck-muted)";
	const rippleProgress = ship
		? Math.min(1, Math.max(0, (t - ship.at) / 600))
		: 0;
	const { ref, variant: g, fs } = useVizScale({ wide: WIDE, compact: COMPACT });

	return (
		<svg
			ref={ref}
			viewBox={g.viewBox}
			role="img"
			aria-label="The mission commit meets the verify gate, which blocks attempt one, passes attempt two, and then the SHIPPED tag syncs outward to the external build log."
			className="block h-full w-full"
		>
			{/* the commit line entering from the swarm */}
			<line
				x1={0}
				y1={LINE_Y}
				x2={GATE_X - 14}
				y2={LINE_Y}
				stroke={passed || blockedNow ? "var(--ink-deck)" : "var(--deck-line)"}
				strokeWidth={1.5}
			/>

			{/* the gate: two posts + a bar that opens on pass */}
			<g
				data-testid="verify-gate"
				data-state={blockedNow ? "block" : passed ? "pass" : "neutral"}
			>
				<line
					x1={GATE_X - 14}
					y1={LINE_Y - 34}
					x2={GATE_X - 14}
					y2={LINE_Y + 34}
					stroke={gateStroke}
					strokeWidth={2}
				/>
				<line
					x1={GATE_X + 14}
					y1={LINE_Y - 34}
					x2={GATE_X + 14}
					y2={LINE_Y + 34}
					stroke={gateStroke}
					strokeWidth={2}
				/>
				{passed ? (
					// open: the bar swings up
					<line
						x1={GATE_X - 14}
						y1={LINE_Y - 34}
						x2={GATE_X + 22}
						y2={LINE_Y - 58}
						stroke={gateStroke}
						strokeWidth={2}
					/>
				) : (
					// closed: the bar blocks the line
					<line
						x1={GATE_X - 14}
						y1={LINE_Y - 10}
						x2={GATE_X + 14}
						y2={LINE_Y + 10}
						stroke={gateStroke}
						strokeWidth={2}
					/>
				)}
				<text
					x={GATE_X}
					y={LINE_Y + 56}
					textAnchor="middle"
					className="font-instrument"
					fontSize={fs(10)}
					fill={gateStroke}
					style={{ letterSpacing: "0.12em" }}
				>
					VERIFY GATE
				</text>
			</g>

			{/* attempt status lines */}
			<g className="font-instrument">
				{verifies.map((v) => (
					<text
						key={v.id}
						x={g.attemptX}
						y={LINE_Y + 84 + (v.attempt - 1) * 18}
						className="font-instrument"
						fontSize={fs(10.5)}
						fill={
							v.result === "block" ? "var(--accent-deck)" : "var(--ink-deck)"
						}
						style={{ letterSpacing: "0.1em" }}
					>
						VERIFY ATTEMPT {v.attempt}: {v.result.toUpperCase()}
						{v.result === "block" ? " · BOUNCED BACK" : " · GATE OPEN"}
					</text>
				))}
			</g>

			{/* bounce-back arc while blocked */}
			{blockedNow ? (
				<path
					d={`M ${GATE_X - 16} ${LINE_Y - 6} Q ${GATE_X - 70} ${LINE_Y - 46} ${8} ${LINE_Y - 30}`}
					fill="none"
					stroke="var(--accent-deck)"
					strokeWidth={1}
					strokeDasharray="4 4"
					markerEnd="url(#bounce-arrow)"
				/>
			) : null}
			<defs>
				<marker
					id="bounce-arrow"
					viewBox="0 0 8 8"
					refX={6}
					refY={4}
					markerWidth={6}
					markerHeight={6}
					orient="auto"
				>
					<path d="M 0 0 L 8 4 L 0 8 z" fill="var(--accent-deck)" />
				</marker>
			</defs>

			{/* after the pass: the line continues; the SHIPPED card drops in */}
			{passed ? (
				<line
					x1={GATE_X + 14}
					y1={LINE_Y}
					x2={220}
					y2={LINE_Y}
					stroke="var(--ink-deck)"
					strokeWidth={1.5}
				/>
			) : null}
			{shippedActivity ? (
				<g data-testid="shipped-card">
					<rect
						x={g.shipped.rect.x}
						y={LINE_Y + 16}
						width={g.shipped.rect.width}
						height={44}
						rx={3}
						fill="var(--deck)"
						stroke="var(--accent-deck)"
						strokeWidth={1}
					/>
					<text
						x={g.shipped.textX}
						y={LINE_Y + 34}
						className="font-instrument"
						fontSize={fs(10)}
						fill="var(--ink-deck)"
						style={{ letterSpacing: "0.06em" }}
					>
						{shippedActivity.summary}
					</text>
					<text
						x={g.shipped.textX}
						y={LINE_Y + 50}
						className="font-instrument"
						fontSize={fs(9.5)}
						fill="var(--accent-deck)"
						style={{ letterSpacing: "0.14em" }}
					>
						SHIPPED · {shippedActivity.branch}
					</text>
				</g>
			) : null}

			{/* the sync ripple to the external build log */}
			{ship ? (
				<g data-testid="ship-ripple">
					<line
						x1={220}
						y1={LINE_Y}
						x2={NOTION.x - 34}
						y2={NOTION.y + 24}
						stroke="var(--ink-deck-muted)"
						strokeWidth={1}
						strokeDasharray="3 5"
					/>
					{!reducedMotion && rippleProgress < 1 ? (
						<circle
							cx={220 + (NOTION.x - 34 - 220) * rippleProgress}
							cy={LINE_Y + (NOTION.y + 24 - LINE_Y) * rippleProgress}
							r={5}
							fill="none"
							stroke="var(--accent-deck)"
							strokeWidth={1.5}
						/>
					) : null}
					<rect
						x={NOTION.x - 34}
						y={NOTION.y - 12}
						width={110}
						height={36}
						rx={3}
						fill="var(--deck-raised)"
						stroke={
							rippleProgress >= 1
								? "var(--accent-deck)"
								: "var(--ink-deck-muted)"
						}
						strokeWidth={1}
					/>
					<text
						x={NOTION.x + 21}
						y={NOTION.y + 3}
						textAnchor="middle"
						className="font-instrument"
						fontSize={fs(9.5)}
						fill="var(--ink-deck)"
						style={{ letterSpacing: "0.1em" }}
					>
						BUILD LOG
					</text>
					<text
						x={NOTION.x + 21}
						y={NOTION.y + 16}
						textAnchor="middle"
						className="font-instrument"
						fontSize={fs(8.5)}
						fill="var(--ink-deck-muted)"
						style={{ letterSpacing: "0.06em" }}
					>
						{ship.downstreamRef}
					</text>
				</g>
			) : null}

			{/* epilogue: the Scene 2 lease resolves */}
			{receipt || clear ? (
				<text
					x={12}
					y={H - 18}
					className="font-instrument"
					fontSize={fs(10)}
					fill="var(--ink-deck-muted)"
					style={{ letterSpacing: "0.08em" }}
				>
					{receipt ? `T+${formatClock(receipt.at)} RECEIPT` : ""}
					{clear ? ` · T+${formatClock(clear.at)} LEASE CLEARED` : ""}
				</text>
			) : null}
		</svg>
	);
}
