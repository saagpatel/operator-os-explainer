import { useLocation } from "react-router-dom";
import { useSessionClock } from "../clock/SessionClockProvider.tsx";
import { useAutoSeek } from "../clock/useAutoSeek.ts";
import { formatClock } from "../lib/format";

/**
 * Phase 0 placeholder scene route (SPEC 5, Phase 0). Proves deep-linking and
 * shows all three type registers on the two materials for the shell gate.
 * Replaced scene-by-scene as Phases 3-8 land.
 */
const SCENES: Record<
	string,
	{ number: string; title: string; subtitle: string }
> = {
	"/": {
		number: "00",
		title: "Cold open",
		subtitle: "watch one task travel the whole OS",
	},
	"/fleet": {
		number: "01",
		title: "The Fleet",
		subtitle: "routing by gravity",
	},
	"/spine": {
		number: "02",
		title: "The Spine",
		subtitle: "the shared nervous system",
	},
	"/safety": {
		number: "03",
		title: "The Safety Layers",
		subtitle: "guards fire, agent adapts",
	},
	"/finale": {
		number: "04",
		title: "The Fleet in Motion",
		subtitle: "one mission, end to end",
	},
	"/hub": { number: "05", title: "The Hub", subtitle: "the airlock" },
	"/coda": {
		number: "06",
		title: "Coda",
		subtitle: "what this is, and why it is rare",
	},
};

export function PlaceholderScene() {
	const { pathname } = useLocation();
	const scene = SCENES[pathname] ?? SCENES["/"];
	const clock = useSessionClock();
	useAutoSeek(0);
	const visible = clock.eventsUpTo(clock.t).length;
	const total = clock.dataset.events.length;

	return (
		<section className="relative flex min-h-full flex-col items-center justify-center px-6 py-16">
			<span
				aria-hidden="true"
				className="pointer-events-none absolute right-6 top-4 select-none font-display text-[10rem] leading-none text-ink-deck-muted opacity-15"
			>
				{scene.number}
			</span>

			<div className="w-full max-w-xl">
				<p className="font-instrument text-[11px] uppercase tracking-[0.22em] text-ink-deck-muted">
					Scene {scene.number} · {scene.subtitle}
				</p>
				<h1 className="mt-2 font-display text-5xl text-ink-deck sm:text-6xl">
					{scene.title}
				</h1>

				<div className="mt-8 rounded-sm bg-paper p-6 shadow-[0_2px_24px_rgba(0,0,0,0.45)]">
					<p className="font-prose text-[17px] leading-relaxed text-ink">
						Every scene on this console is a lens on the same 90-second
						synthetic session. The instrument is live; the data underneath it is
						invented by construction.
					</p>
					<p className="mt-3 font-instrument text-[10px] uppercase tracking-[0.18em] text-ink-muted">
						Overlay card · paper on deck
					</p>
				</div>

				<p
					data-testid="scene-telemetry"
					className="mt-8 font-instrument text-[12px] tabular-nums text-ink-deck-muted"
				>
					SESSION 2026-03-16 · T+{formatClock(clock.t)} ·{" "}
					<span className="text-accent-deck">
						{visible}/{total} EVENTS
					</span>
				</p>
			</div>
		</section>
	);
}
