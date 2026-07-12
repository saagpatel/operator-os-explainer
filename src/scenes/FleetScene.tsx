import { useEffect, useMemo, useRef, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { useSessionClock } from "../clock/SessionClockProvider.tsx";
import { useAutoSeek } from "../clock/useAutoSeek.ts";
import { ProseCard } from "../components/shell/ProseCard";
import { SceneFrame } from "../components/shell/SceneFrame";
import {
	FleetGraph,
	INJECTED_ID_FLOOR,
	NODES,
} from "../components/viz/FleetGraph";
import {
	ROUTING,
	TASK_CLASSES,
	type TaskClass,
	WHY_HERE,
} from "../data/vocab.ts";
import { formatClock } from "../lib/format";
import type { ModelTier, SyntheticEvent } from "../types/data.ts";
import { SCENES } from "./index.ts";

type Dispatch = Extract<SyntheticEvent, { kind: "dispatch" }>;

/** The four tray chips (storyboard): one per fleet node. */
const TRAY: readonly TaskClass[] = ["feature", "sweep", "essay", "audit"];
/** Model tier each chip's dispatch would carry (mirrors the fixture arcs). */
const CHIP_MODEL: Record<TaskClass, ModelTier> = {
	feature: "Opus",
	bugfix: "Sonnet",
	sweep: "mechanical",
	depbump: "mechanical",
	"ci-fix": "mechanical",
	essay: "Opus",
	handoff: "Opus",
	audit: "Haiku",
};

function mkDispatch(taskClass: TaskClass, at: number, idx: number): Dispatch {
	return {
		kind: "dispatch",
		id: INJECTED_ID_FLOOR + idx,
		at,
		missionId: INJECTED_ID_FLOOR + idx,
		from: taskClass === "audit" ? "cc" : "claude_ai",
		to: ROUTING[taskClass],
		taskClass,
		model: CHIP_MODEL[taskClass],
		durationMs: 1_200,
		status: "ok",
	};
}

/**
 * Scene 1, the reference scene: routing by gravity. The reader releases a
 * task chip anywhere; the chip flies to the system that OWNS it, because
 * gravity routes work, not aim. Each routed chip injects an ephemeral
 * dispatch event at the current t (SPEC 4.3): it drops on scrub-back and
 * resets on unmount. `?chips=feature,sweep` deep-links a pre-routed state.
 */
export function FleetScene() {
	const config = SCENES.fleet;
	const clock = useSessionClock();
	useAutoSeek(config.tStart);

	// Ambient replay autoplays on scene entry, never under reduced motion (SPEC 2.5).
	const autoplayed = useRef(false);
	useEffect(() => {
		if (autoplayed.current || clock.reducedMotion) return;
		autoplayed.current = true;
		clock.play();
	}, [clock]);

	const [params] = useSearchParams();
	const [injected, setInjected] = useState<Dispatch[]>(() => {
		const preset = (params.get("chips") ?? "")
			.split(",")
			.filter((c): c is TaskClass =>
				(TASK_CLASSES as readonly string[]).includes(c),
			);
		return preset.map((tc, i) => mkDispatch(tc, 0, i));
	});
	const [selected, setSelected] = useState<TaskClass | null>(null);

	const route = (taskClass: TaskClass) => {
		setSelected(taskClass);
		setInjected((prev) => {
			const at = clock.tRef.current;
			const rest = prev.filter((e) => e.taskClass !== taskClass);
			return [...rest, mkDispatch(taskClass, at, prev.length)];
		});
	};

	const events = useMemo(() => {
		const base = clock
			.eventsUpTo(clock.t)
			.filter((e) => config.eventKinds.includes(e.kind));
		const visible = injected.filter((e) => e.at <= clock.t);
		return [...base, ...visible].sort((a, b) => a.at - b.at);
	}, [clock, clock.t, injected, config.eventKinds]);

	const dockedClasses = new Set(
		injected.filter((e) => e.at <= clock.t).map((e) => e.taskClass),
	);
	const allRouted = TRAY.every((tc) => dockedClasses.has(tc));
	const corroboration = selected
		? clock
				.eventsOfKind("dispatch", clock.duration)
				.find((d) => d.taskClass === selected && d.id < INJECTED_ID_FLOOR)
		: undefined;

	return (
		<SceneFrame
			config={config}
			deepPanelExtra={
				<table className="w-full font-instrument text-[11px] text-ink-deck-muted">
					<thead>
						<tr className="border-b border-deck-line text-left uppercase tracking-[0.14em]">
							<th className="py-1.5 pr-4 font-normal">task class</th>
							<th className="py-1.5 pr-4 font-normal">owner</th>
							<th className="py-1.5 font-normal">why</th>
						</tr>
					</thead>
					<tbody>
						{TASK_CLASSES.map((tc) => (
							<tr key={tc} className="border-b border-deck-line/60">
								<td className="py-1.5 pr-4 text-ink-deck">{tc}</td>
								<td className="py-1.5 pr-4">{NODES[ROUTING[tc]].label}</td>
								<td className="py-1.5">{WHY_HERE[tc]}</td>
							</tr>
						))}
					</tbody>
				</table>
			}
		>
			<div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_320px]">
				<div className="rounded-sm border border-deck-line bg-deck-raised/40 p-2">
					<FleetGraph
						events={events}
						t={clock.t}
						interaction={{ kind: "taskChipRoute", selectedTaskClass: selected }}
						reducedMotion={clock.reducedMotion}
						dataset={clock.dataset}
					/>

					<div className="flex flex-wrap items-center gap-2 border-t border-deck-line px-3 py-3">
						<span className="mr-1 font-instrument text-[10px] uppercase tracking-[0.2em] text-ink-deck-muted">
							Task tray
						</span>
						{TRAY.map((tc) => {
							const docked = dockedClasses.has(tc);
							return (
								<button
									key={tc}
									type="button"
									onClick={() => route(tc)}
									disabled={docked}
									aria-label={`Route the ${tc} task to its owner`}
									className={`rounded-sm border px-3 py-1.5 font-instrument text-[11px] uppercase tracking-[0.12em] ${
										docked
											? "border-deck-line text-ink-deck-muted opacity-40"
											: "border-ink-deck-muted text-ink-deck hover:border-accent-deck hover:text-accent-deck"
									}`}
								>
									{tc}
								</button>
							);
						})}
						<span className="ml-auto font-instrument text-[10px] text-ink-deck-muted">
							release a chip · gravity does the rest
						</span>
					</div>
				</div>

				<div className="flex flex-col gap-4">
					<ProseCard label="scene 01 · the fleet">
						<p>{config.hook}</p>
						<p className="mt-2">
							Nothing here is assigned by hand. A task declares what it needs,
							and the need itself is the router: a live filesystem, raw
							parallelism, a writing desk, or a quiet night shift.
						</p>
					</ProseCard>

					<div
						aria-live="polite"
						className="min-h-[104px] rounded-sm border border-deck-line p-4 font-instrument text-[12px] leading-relaxed"
					>
						{selected ? (
							<>
								<p className="text-ink-deck">
									{selected.toUpperCase()} -&gt;{" "}
									{NODES[ROUTING[selected]].label}
								</p>
								<p className="mt-1 text-accent-deck">
									why here: {WHY_HERE[selected]}
								</p>
								{corroboration ? (
									<p className="mt-1 text-ink-deck-muted">
										replay corroborates at T+{formatClock(corroboration.at)}
										{corroboration.at > clock.t ? " (scrub forward)" : ""}
									</p>
								) : null}
							</>
						) : (
							<p className="text-ink-deck-muted">
								Route a chip from the tray. The annotation explains why it lands
								where it lands.
							</p>
						)}
						{allRouted ? (
							<p
								data-testid="fleet-takeaway"
								className="mt-3 border-t border-deck-line pt-2 uppercase tracking-[0.14em] text-accent-deck"
							>
								Routing is by gravity, not by hand.
							</p>
						) : null}
					</div>
				</div>
			</div>
		</SceneFrame>
	);
}
