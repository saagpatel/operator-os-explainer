import { useEffect, useRef } from "react";
import type { SyntheticEvent } from "../../types/data.ts";
import type { VizProps } from "../../types/scene.ts";

type Fanout = Extract<SyntheticEvent, { kind: "fanout" }>;
type Guard = Extract<SyntheticEvent, { kind: "guard" }>;

export const SWARM_W = 560;
export const SWARM_H = 400;
const LANE_X0 = 130;
const LANE_X1 = 430;
const LANE_H = 52;
const LANE_Y = [70, 174, 278] as const;
const MERGE = { x: 520, y: 200 };

/** Deterministic per-particle jitter so scrubbing replays identically. */
const hash = (lane: number, i: number, salt: number) => {
	const x = Math.sin(lane * 127.1 + i * 311.7 + salt * 74.7) * 43758.5453;
	return x - Math.floor(x);
};
const PARTICLES_PER_LANE = 14;

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

		const sx = canvas.width / SWARM_W;
		const sy = canvas.height / SWARM_H;
		ctx.fillStyle = "#ff7a4d";
		for (const l of lanes) {
			if (!l.running) continue;
			ctx.save();
			ctx.beginPath();
			ctx.rect(
				LANE_X0 * sx,
				(LANE_Y[l.lane] + 1) * sy,
				(LANE_X1 - LANE_X0) * sx,
				(LANE_H - 2) * sy,
			);
			ctx.clip();
			for (let i = 0; i < PARTICLES_PER_LANE; i++) {
				const progress = (t - l.runAt) / 1_400 + hash(l.lane, i, 1);
				const frac = progress - Math.floor(progress);
				const x = LANE_X0 + 8 + frac * (LANE_X1 - LANE_X0 - 16);
				const y =
					LANE_Y[l.lane] +
					LANE_H / 2 +
					(hash(l.lane, i, 2) - 0.5) * (LANE_H - 18);
				ctx.globalAlpha = 0.35 + 0.45 * hash(l.lane, i, 3);
				ctx.beginPath();
				ctx.arc(x * sx, y * sy, 1.6 * sx, 0, Math.PI * 2);
				ctx.fill();
			}
			ctx.restore();
		}
		ctx.globalAlpha = 1;
	}, [t, reducedMotion, lanes]);

	return (
		<div className="relative">
			<svg
				viewBox={`0 0 ${SWARM_W} ${SWARM_H}`}
				role="img"
				aria-label="Three worktree lanes spawning from the lead, running in parallel, and converging into one mission commit."
				className="block w-full"
			>
				{/* dispatch trunk from the lead into the lanes */}
				<text
					x={16}
					y={196}
					className="font-instrument"
					fontSize={11}
					fill="var(--ink-deck)"
					style={{ letterSpacing: "0.12em" }}
				>
					LEAD
				</text>
				{lanes.map((l) => (
					<line
						key={`in-${l.lane}`}
						x1={58}
						y1={200}
						x2={LANE_X0}
						y2={LANE_Y[l.lane] + LANE_H / 2}
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
							x={LANE_X0}
							y={LANE_Y[l.lane]}
							width={LANE_X1 - LANE_X0}
							height={LANE_H}
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
							x={LANE_X0 + 10}
							y={LANE_Y[l.lane] + 20}
							className="font-instrument"
							fontSize={10.5}
							fill={l.running ? "var(--accent-deck)" : "var(--ink-deck)"}
							style={{ letterSpacing: "0.1em" }}
						>
							LANE {l.lane} · {l.model.toUpperCase()}
						</text>
						<text
							x={LANE_X0 + 10}
							y={LANE_Y[l.lane] + 38}
							className="font-instrument"
							fontSize={9.5}
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
							x1={LANE_X1}
							y1={LANE_Y[l.lane] + LANE_H / 2}
							x2={MERGE.x}
							y2={MERGE.y}
							stroke="var(--ink-deck)"
							strokeWidth={1}
						/>
					) : null,
				)}
				{anyConverged ? (
					<>
						<circle cx={MERGE.x} cy={MERGE.y} r={5} fill="var(--ink-deck)" />
						<line
							x1={MERGE.x}
							y1={MERGE.y}
							x2={SWARM_W}
							y2={MERGE.y}
							stroke="var(--ink-deck)"
							strokeWidth={1.5}
						/>
						<text
							x={MERGE.x - 6}
							y={MERGE.y + 22}
							textAnchor="end"
							className="font-instrument"
							fontSize={10}
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
							x={LANE_X0}
							y={348}
							width={396}
							height={24}
							rx={3}
							fill="var(--deck)"
							stroke="var(--accent-deck)"
							strokeWidth={1}
						/>
						<text
							x={LANE_X0 + 10}
							y={364}
							className="font-instrument"
							fontSize={10}
							fill="var(--accent-deck)"
							style={{ letterSpacing: "0.08em" }}
						>
							GUARD: HARD-DENY / PUSH-TO-MAIN -&gt; OPENED A BRANCH
						</text>
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
