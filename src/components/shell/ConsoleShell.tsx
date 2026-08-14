import { useEffect, useRef } from "react";
import { NavLink, Outlet, useLocation } from "react-router";
import {
	SessionClockProvider,
	useSessionClock,
} from "../../clock/SessionClockProvider.tsx";
import { SyntheticBadge } from "./SyntheticBadge";
import { TransportBar } from "./TransportBar";
import { SCENES } from "../../scenes/index.ts";

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
	const location = useLocation();
	const mainRef = useRef<HTMLElement | null>(null);
	const navRef = useRef<HTMLElement | null>(null);
	const previousPath = useRef(location.pathname);

	useEffect(() => {
		const slug = location.pathname.replace(/^\/+|\/+$/g, "");
		const sceneTitle = SCENES[slug]?.title ?? "Scene not found";
		document.title = `${sceneTitle} — Anatomy of an AI Operator OS`;
		const currentLink = navRef.current?.querySelector<HTMLElement>(
			'[aria-current="page"]',
		);
		if (currentLink && navRef.current) {
			navRef.current.scrollLeft = Math.max(0, currentLink.offsetLeft - 16);
		}

		if (previousPath.current !== location.pathname) {
			const main = mainRef.current;
			if (main) {
				main.scrollTop = 0;
				main.scrollLeft = 0;
				main.querySelector<HTMLElement>("[data-scene-heading]")?.focus();
			}
		}
		previousPath.current = location.pathname;
	}, [location.pathname]);

	return (
		<div className="flex h-full flex-col bg-deck text-ink-deck">
			<header className="flex flex-wrap items-center justify-between gap-x-6 gap-y-2 border-b border-deck-line px-4 py-3 sm:px-6">
				<NavLink
					to="/"
					className="inline-flex min-h-11 select-none items-center font-instrument text-[11px] uppercase tracking-[0.22em] text-ink-deck-muted sm:min-h-6"
				>
					{/* One span so the label stays a single flex item (flex would
					    otherwise swallow the whitespace between text and span). */}
					<span>
						Anatomy of an <span className="text-ink-deck">AI Operator OS</span>
					</span>
				</NavLink>

				<nav
					ref={navRef}
					aria-label="Scenes"
					className="order-last flex w-full flex-nowrap gap-x-4 overflow-x-auto font-instrument text-[11px] uppercase tracking-[0.14em] md:order-none md:w-auto md:overflow-visible"
				>
					{NAV.map(({ to, label }) => (
						<NavLink
							key={to}
							to={to}
							end={to === "/"}
							className={({ isActive }) =>
								`inline-flex min-h-11 min-w-11 items-center justify-center sm:min-h-6 sm:min-w-6 ${
									isActive
										? "text-accent-deck"
										: "text-ink-deck-muted hover:text-ink-deck"
								}`
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
						className="min-h-11 font-instrument text-[10px] uppercase tracking-[0.18em] text-ink-deck-muted hover:text-ink-deck sm:min-h-6"
					>
						Motion{" "}
						<span className={clock.reducedMotion ? "text-accent-deck" : ""}>
							{clock.reducedMotion ? "reduced" : "full"}
						</span>
					</button>
					<SyntheticBadge />
				</div>
			</header>

			<main ref={mainRef} className="min-h-0 flex-1 overflow-auto">
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
