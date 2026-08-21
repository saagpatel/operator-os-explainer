import { useEffect, useRef } from "react";
import { useVizScale } from "../../lib/useVizScale";
import type { SyntheticEvent } from "../../types/data.ts";
import type { VizProps } from "../../types/scene.ts";

type Fanout = Extract<SyntheticEvent, { kind: "fanout" }>;
type Guard = Extract<SyntheticEvent, { kind: "guard" }>;

export const SWARM_W = 560;
export const SWARM_H = 400;

/** Deterministic per-particle jitter so scrubbing replays identically. */
const hash = (lane: number, i: number, salt: number) => {
	const x = Math.sin(lane * 127.1 + i * 311.7 + salt * 74.7) * 43758.5453;
	return x - Math.floor(x);
};
const PARTICLES_PER_LANE = 14;

interface SwarmGeometry {
	viewBox: string;
	/** Canvas flow layer maps its pixels through these, so it tracks the viewBox. */
	w: number;
	h: number;
	laneX0: number;
	laneX1: number;
	laneH: number;
	laneY: readonly [number, number, number];
	/** "LEAD" caption and the point its dispatch lines leave from. */
	lead: { x: number; y: number };
	leadFrom: { x: number; y: number };
	/** Baseline offsets inside a lane for its title and its worktree line. */
	titleDy: number;
	subDy: number;
	merge: { x: number; y: number };
	mergeLabel: { x: number; y: number };
	guardRect: { x: number; y: number; width: number; height: number };
	/** The guard caption, broken across lines where the canvas is narrow. */
	guardLines: readonly string[];
	guardText: { x: number; y: number; step: number };
}

/** Wide: three lanes side by side with the lead feeding them from the left. */
const WIDE: SwarmGeometry = {
	viewBox: `0 0 ${SWARM_W} ${SWARM_H}`,
	w: SWARM_W,
	h: SWARM_H,
	laneX0: 130,
	laneX1: 430,
	laneH: 52,
	laneY: [70, 174, 278],
	lead: { x: 16, y: 196 },
	leadFrom: { x: 58, y: 200 },
	titleDy: 20,
	subDy: 38,
	merge: { x: 520, y: 200 },
	mergeLabel: { x: 514, y: 222 },
	guardRect: { x: 130, y: 348, width: 396, height: 24 },
	guardLines: ["GUARD: HARD-DENY / PUSH-TO-MAIN -> OPENED A BRANCH"],
	guardText: { x: 140, y: 364, step: 0 },
};

/**
 * Compact: the lanes get taller and narrower rather than fewer. Three parallel
 * runs converging on one commit is the whole point of the scene, so the count
 * is preserved and the guard caption wraps instead of shrinking.
 */
const COMPACT: SwarmGeometry = {
	viewBox: "0 0 340 480",
	w: 340,
	h: 480,
	laneX0: 60,
	laneX1: 300,
	laneH: 64,
	laneY: [64, 164, 264],
	lead: { x: 14, y: 28 },
	leadFrom: { x: 30, y: 40 },
	titleDy: 24,
	subDy: 44,
	merge: { x: 320, y: 196 },
	// Below the lane stack: at this width the caption would otherwise land
	// inside the middle lane's box.
	mergeLabel: { x: 314, y: 356 },
	guardRect: { x: 20, y: 380, width: 300, height: 46 },
	guardLines: ["GUARD: HARD-DENY / PUSH-TO-MAIN", "-> OPENED A BRANCH"],
	guardText: { x: 28, y: 400, step: 18 },
};

/**
 * Scene 4: the worktree swarm. SVG owns structure (lanes, converge trunk);
 * Canvas owns the dense flow layer (SPEC 4.1) with particle positions as a
 * pure function of t, so the swarm scrubs deterministically. Particles move
 * steadily (no flashing; SC 2.3.1) and vanish under reduced motion.
 */
export function WorktreeSwarm({ events, t, reducedMotion }: VizProps) {
	const fanouts = events.filter((e): e is Fanout => e.kind === "fanout");
	const guard = events.find((e): e is Guard => e.kind === "guard");
	const canvasRef = useRef<HTMLCanvasElement | null>(null);
	const { ref, variant: g, fs } = useVizScale({ wide: WIDE, compact: COMPACT });

	const lanes = ([0, 1, 2] as const).map((lane) => {
		const evts = fanouts.filter((e) => e.lane === lane);
		const runEvent = evts.find((e) => e.phase === "run");
		return {
			lane,
			worktree: evts[0]?.worktree ?? `wt/corveth-${lane}`,
			model: evts[0]?.model ?? "Sonnet",
			spawned: evts.some((e) => e.phase === "spawn"),
			running:
				runEvent !== undefined && !evts.some((e) => e.phase === "converge"),
			converged: evts.some((e) => e.phase === "converge"),
			runAt: runEvent?.at ?? 0,
		};
	});
	const anyConverged = lanes.some((l) => l.converged);

	// ---- Canvas flow layer ----
	useEffect(() => {
		const canvas = canvasRef.current;
		if (!canvas) return;
		const ctx = canvas.getContext("2d");
		if (!ctx) return;
		const dpr = window.devicePixelRatio || 1;
		const rect = canvas.getBoundingClientRect();
		if (canvas.width !== Math.round(rect.width * dpr)) {
			canvas.width = Math.round(rect.width * dpr);
			canvas.height = Math.round(rect.height * dpr);
		}
		ctx.clearRect(0, 0, canvas.width, canvas.height);
		if (reducedMotion) return;

		const sx = canvas.width / g.w;
		const sy = canvas.height / g.h;
		ctx.fillStyle = "#ff7a4d";
		for (const l of lanes) {
			if (!l.running) continue;
			ctx.save();
			ctx.beginPath();
			ctx.rect(
				g.laneX0 * sx,
				(g.laneY[l.lane] + 1) * sy,
				(g.laneX1 - g.laneX0) * sx,
				(g.laneH - 2) * sy,
			);
			ctx.clip();
			for (let i = 0; i < PARTICLES_PER_LANE; i++) {
				const progress = (t - l.runAt) / 1_400 + hash(l.lane, i, 1);
				const frac = progress - Math.floor(progress);
				const x = g.laneX0 + 8 + frac * (g.laneX1 - g.laneX0 - 16);
				const y =
					g.laneY[l.lane] +
					g.laneH / 2 +
					(hash(l.lane, i, 2) - 0.5) * (g.laneH - 18);
				ctx.globalAlpha = 0.35 + 0.45 * hash(l.lane, i, 3);
				ctx.beginPath();
				ctx.arc(x * sx, y * sy, 1.6 * sx, 0, Math.PI * 2);
				ctx.fill();
			}
			ctx.restore();
		}
		ctx.globalAlpha = 1;
	}, [t, reducedMotion, lanes, g]);

	return (
		<div className="relative" ref={ref}>
			<svg
				viewBox={g.viewBox}
				role="img"
				aria-label="Three worktree lanes spawning from the lead, running in parallel, and converging into one mission commit."
				className="block w-full"
			>
				{/* dispatch trunk from the lead into the lanes */}
				<text
					x={g.lead.x}
					y={g.lead.y}
					className="font-instrument"
					fontSize={fs(11)}
					fill="var(--ink-deck)"
					style={{ letterSpacing: "0.12em" }}
				>
					LEAD
				</text>
				{lanes.map((l) => (
					<line
						key={`in-${l.lane}`}
						x1={g.leadFrom.x}
						y1={g.leadFrom.y}
						x2={g.laneX0}
						y2={g.laneY[l.lane] + g.laneH / 2}
						stroke={l.spawned ? "var(--ink-deck-muted)" : "var(--deck-line)"}
						strokeWidth={1}
						strokeDasharray={l.spawned ? undefined : "2 5"}
					/>
				))}

				{/* the three lanes */}
				{lanes.map((l) => (
					<g
						key={l.lane}
						data-testid={`lane-${l.lane}`}
						data-phase={
							l.converged
								? "converge"
								: l.running
									? "run"
									: l.spawned
										? "spawn"
										: "empty"
						}
					>
						<rect
							x={g.laneX0}
							y={g.laneY[l.lane]}
							width={g.laneX1 - g.laneX0}
							height={g.laneH}
							rx={3}
							fill={l.spawned ? "var(--deck-raised)" : "none"}
							stroke={
								l.running
									? "var(--accent-deck)"
									: l.spawned
										? "var(--ink-deck-muted)"
										: "var(--deck-line)"
							}
							strokeWidth={1}
							strokeDasharray={l.spawned ? undefined : "4 6"}
							opacity={l.converged ? 0.45 : 1}
						/>
						<text
							x={g.laneX0 + 10}
							y={g.laneY[l.lane] + g.titleDy}
							className="font-instrument"
							fontSize={fs(10.5)}
							fill={l.running ? "var(--accent-deck)" : "var(--ink-deck)"}
							style={{ letterSpacing: "0.1em" }}
						>
							LANE {l.lane} · {l.model.toUpperCase()}
						</text>
						<text
							x={g.laneX0 + 10}
							y={g.laneY[l.lane] + g.subDy}
							className="font-instrument"
							fontSize={fs(9.5)}
							fill="var(--ink-deck-muted)"
							style={{ letterSpacing: "0.06em" }}
						>
							{l.worktree} ·{" "}
							{l.converged
								? "converged"
								: l.running
									? "running"
									: l.spawned
										? "spawned"
										: "waiting"}
						</text>
					</g>
				))}

				{/* converge trunk: lanes collapse into one mission commit */}
				{lanes.map((l) =>
					l.converged ? (
						<line
							key={`out-${l.lane}`}
							x1={g.laneX1}
							y1={g.laneY[l.lane] + g.laneH / 2}
							x2={g.merge.x}
							y2={g.merge.y}
							stroke="var(--ink-deck)"
							strokeWidth={1}
						/>
					) : null,
				)}
				{anyConverged ? (
					<>
						<circle
							cx={g.merge.x}
							cy={g.merge.y}
							r={5}
							fill="var(--ink-deck)"
						/>
						<line
							x1={g.merge.x}
							y1={g.merge.y}
							x2={g.w}
							y2={g.merge.y}
							stroke="var(--ink-deck)"
							strokeWidth={1.5}
						/>
						<text
							x={g.mergeLabel.x}
							y={g.mergeLabel.y}
							textAnchor="end"
							className="font-instrument"
							fontSize={fs(10)}
							fill="var(--ink-deck-muted)"
							style={{ letterSpacing: "0.1em" }}
						>
							ONE MISSION COMMIT
						</text>
					</>
				) : null}

				{/* the guard moment, mid-run (storyboard beat 3) */}
				{guard ? (
					<g data-testid="swarm-guard">
						<rect
							{...g.guardRect}
							rx={3}
							fill="var(--deck)"
							stroke="var(--accent-deck)"
							strokeWidth={1}
						/>
						{g.guardLines.map((line, i) => (
							<text
								key={line}
								x={g.guardText.x}
								y={g.guardText.y + i * g.guardText.step}
								className="font-instrument"
								fontSize={fs(10)}
								fill="var(--accent-deck)"
								style={{ letterSpacing: "0.08em" }}
							>
								{line}
							</text>
						))}
					</g>
				) : null}
			</svg>
			<canvas
				ref={canvasRef}
				aria-hidden="true"
				className="pointer-events-none absolute inset-0 h-full w-full"
			/>
		</div>
	);
}
