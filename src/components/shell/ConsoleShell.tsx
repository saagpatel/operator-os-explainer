import { useState } from "react";
import { NavLink, Outlet } from "react-router-dom";
import { SyntheticBadge } from "./SyntheticBadge";
import { type Speed, TransportBar } from "./TransportBar";

const SESSION_LENGTH_MS = 90_000;

const NAV = [
	{ to: "/", label: "00" },
	{ to: "/fleet", label: "01 Fleet" },
	{ to: "/spine", label: "02 Spine" },
	{ to: "/safety", label: "03 Safety" },
	{ to: "/finale", label: "04 Finale" },
	{ to: "/hub", label: "05 Hub" },
	{ to: "/coda", label: "06 Coda" },
] as const;

/**
 * The deck-dominant console shell: graphite deck, mono chrome, the persistent
 * transport bar (always-visible Pause, SC 2.2.2) and the synthetic-data badge.
 * Phase 0 drives the transport from local state; the Phase 2 session-clock
 * provider replaces this state and mounts here, ABOVE the outlet (SPEC 4.1).
 */
export function ConsoleShell() {
	const [t, setT] = useState(0);
	const [playing, setPlaying] = useState(false);
	const [speed, setSpeed] = useState<Speed>(1);

	return (
		<div className="flex h-full flex-col bg-deck text-ink-deck">
			<header className="flex flex-wrap items-center justify-between gap-x-6 gap-y-2 border-b border-deck-line px-4 py-3 sm:px-6">
				<NavLink
					to="/"
					className="select-none font-instrument text-[11px] uppercase tracking-[0.22em] text-ink-deck-muted"
				>
					Anatomy of an <span className="text-ink-deck">AI Operator OS</span>
				</NavLink>

				<nav
					aria-label="Scenes"
					className="order-last flex w-full flex-wrap gap-x-4 gap-y-1 font-instrument text-[11px] uppercase tracking-[0.14em] md:order-none md:w-auto"
				>
					{NAV.map(({ to, label }) => (
						<NavLink
							key={to}
							to={to}
							end={to === "/"}
							className={({ isActive }) =>
								isActive
									? "text-accent-deck"
									: "text-ink-deck-muted hover:text-ink-deck"
							}
						>
							{label}
						</NavLink>
					))}
				</nav>

				<SyntheticBadge />
			</header>

			<main className="min-h-0 flex-1 overflow-auto">
				<Outlet />
			</main>

			<TransportBar
				t={t}
				duration={SESSION_LENGTH_MS}
				playing={playing}
				speed={speed}
				onPlayPause={() => setPlaying((p) => !p)}
				onScrub={setT}
				onSpeedChange={setSpeed}
				onStepBack={() => setT((v) => Math.max(0, v - 5_000))}
				onStepForward={() =>
					setT((v) => Math.min(SESSION_LENGTH_MS, v + 5_000))
				}
			/>
		</div>
	);
}
