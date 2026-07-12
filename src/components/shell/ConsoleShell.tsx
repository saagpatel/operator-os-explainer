import { NavLink, Outlet } from "react-router-dom";
import {
	SessionClockProvider,
	useSessionClock,
} from "../../clock/SessionClockProvider.tsx";
import { SyntheticBadge } from "./SyntheticBadge";
import { TransportBar } from "./TransportBar";

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
 * The deck-dominant console shell. The session-clock provider mounts here,
 * ABOVE the outlet (SPEC 4.1), so the single rAF loop and clock state survive
 * scene navigation. The transport bar with its always-visible Pause
 * (SC 2.2.2) is part of the fixed chrome on every scene.
 */
export function ConsoleShell() {
	return (
		<SessionClockProvider>
			<ShellChrome />
		</SessionClockProvider>
	);
}

function ShellChrome() {
	const clock = useSessionClock();

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

				<div className="flex items-center gap-3">
					<button
						type="button"
						onClick={() => clock.setMotionOverride(!clock.reducedMotion)}
						aria-pressed={clock.reducedMotion}
						title="Reduced motion: transitions cut instead of glide, ambient motion off, nothing autoplays. The scrubber keeps working."
						className="font-instrument text-[10px] uppercase tracking-[0.18em] text-ink-deck-muted hover:text-ink-deck"
					>
						Motion{" "}
						<span className={clock.reducedMotion ? "text-accent-deck" : ""}>
							{clock.reducedMotion ? "reduced" : "full"}
						</span>
					</button>
					<SyntheticBadge />
				</div>
			</header>

			<main className="min-h-0 flex-1 overflow-auto">
				<Outlet />
			</main>

			<TransportBar
				t={clock.t}
				duration={clock.duration}
				playing={clock.playing}
				speed={clock.speed}
				onPlayPause={clock.toggle}
				onScrub={clock.scrub}
				onSpeedChange={clock.setSpeed}
				onStepBack={clock.stepBack}
				onStepForward={clock.stepForward}
			/>
		</div>
	);
}
