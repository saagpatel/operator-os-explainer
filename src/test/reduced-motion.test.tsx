/**
 * Reduced-motion parity contract (SPEC 2.5).
 *
 * The clause under test is the sharp one: reduced motion is NOT a freeze.
 * Nothing may AUTO-play, but the transport stays live and every state the
 * animated path would have reached must still be reachable — and legible as
 * text — by scrubbing. Each scene that autoplays gets all three assertions.
 *
 * These tests drive `matchMedia` directly because the suite-wide stub in
 * setup.ts always answers `matches: false`; nothing else in the suite moves
 * the reduced-motion signal. Inverting `setSystemReducedMotion` is the red
 * proof: the no-autoplay assertions fail when the preference is ignored.
 */
import { fireEvent, render, screen } from "@testing-library/react";
import { createMemoryRouter } from "react-router";
import { RouterProvider } from "react-router/dom";
import { afterEach, describe, expect, it } from "vitest";
import { ConsoleShell } from "../components/shell/ConsoleShell";
import { ColdOpenScene } from "../scenes/ColdOpenScene";
import { FinaleScene } from "../scenes/FinaleScene";
import { FleetScene } from "../scenes/FleetScene";

const REDUCE_QUERY = "(prefers-reduced-motion: reduce)";
const originalMatchMedia = window.matchMedia;

function setSystemReducedMotion(reduce: boolean): void {
	window.matchMedia = ((query: string) =>
		({
			matches: query === REDUCE_QUERY ? reduce : false,
			media: query,
			onchange: null,
			addEventListener: () => {},
			removeEventListener: () => {},
			addListener: () => {},
			removeListener: () => {},
			dispatchEvent: () => false,
		}) as MediaQueryList) as typeof window.matchMedia;
}

afterEach(() => {
	window.matchMedia = originalMatchMedia;
});

/** Mounts the real shell so the global transport is present, as a reader sees it. */
function renderUnderReducedMotion(path: string) {
	setSystemReducedMotion(true);
	const router = createMemoryRouter(
		[
			{
				path: "/",
				element: <ConsoleShell />,
				children: [
					{ index: true, element: <ColdOpenScene /> },
					{ path: "fleet", element: <FleetScene /> },
					{ path: "finale", element: <FinaleScene /> },
				],
			},
		],
		{ initialEntries: [path] },
	);
	return render(<RouterProvider router={router} />);
}

/** The transport's Play/Pause label is the clock's play state, user-visible. */
function expectClockNotPlaying(): void {
	expect(screen.getByRole("button", { name: "Play" })).toBeInTheDocument();
	expect(screen.queryByRole("button", { name: "Pause" })).toBeNull();
}

function scrubTo(ms: number): void {
	fireEvent.change(
		screen.getByRole("slider", { name: "Session clock scrubber" }),
		{ target: { value: String(ms) } },
	);
}

describe("reduced motion: the preference reaches the clock", () => {
	it("reports the OS preference on the shell toggle and the document", () => {
		renderUnderReducedMotion("/");
		expect(screen.getByRole("button", { name: /^Motion/ })).toHaveAttribute(
			"aria-pressed",
			"true",
		);
		expect(document.documentElement.dataset.reducedMotion).toBe("true");
	});

	it("lets the reader override the OS preference back to full motion", () => {
		renderUnderReducedMotion("/");
		const toggle = screen.getByRole("button", { name: /^Motion/ });
		fireEvent.click(toggle);
		expect(toggle).toHaveAttribute("aria-pressed", "false");
		expect(document.documentElement.dataset.reducedMotion).toBe("false");
	});
});

describe("reduced motion: cold open (scene 00)", () => {
	it("never autoplays, opening directly on the final composed state", () => {
		renderUnderReducedMotion("/");
		expectClockNotPlaying();
		expect(screen.getByTestId("open-caption")).toHaveTextContent(
			"Synced to the build log.",
		);
		expect(screen.getByTestId("explore-invite")).toBeInTheDocument();
	});

	it("keeps the scrubber live: the caption tracks the clock", () => {
		renderUnderReducedMotion("/");
		scrubTo(0);
		expect(screen.getByTestId("open-caption")).toHaveTextContent(
			"An operator instruction drops in.",
		);
		scrubTo(5_000);
		expect(screen.getByTestId("open-caption")).toHaveTextContent(
			"Claude Code scopes the mission.",
		);
	});
});

describe("reduced motion: fleet (scene 01)", () => {
	it("never autoplays the ambient replay", () => {
		renderUnderReducedMotion("/fleet");
		expectClockNotPlaying();
	});

	it("keeps routing live and the corroboration hint tracks the scrubber", () => {
		renderUnderReducedMotion("/fleet");
		fireEvent.click(
			screen.getByRole("button", {
				name: "Route the feature task to its owner",
			}),
		);
		// the corroborating replay dispatch sits at T+800ms, ahead of t=0
		expect(screen.getByText(/replay corroborates/)).toHaveTextContent(
			"(scrub forward)",
		);
		scrubTo(5_000);
		expect(screen.getByText(/replay corroborates/)).not.toHaveTextContent(
			"(scrub forward)",
		);
	});

	it("reaches its terminal takeaway state as text", () => {
		renderUnderReducedMotion("/fleet");
		for (const tc of ["feature", "sweep", "essay", "audit"]) {
			fireEvent.click(
				screen.getByRole("button", {
					name: `Route the ${tc} task to its owner`,
				}),
			);
		}
		expect(screen.getByTestId("fleet-takeaway")).toHaveTextContent(
			"Routing is by gravity, not by hand.",
		);
	});
});

describe("reduced motion: finale (scene 04)", () => {
	it("never autoplays: the mission runs only when the reader asks", () => {
		renderUnderReducedMotion("/finale");
		expectClockNotPlaying();
		expect(
			screen.getByRole("button", { name: "Run the mission" }),
		).toBeInTheDocument();
	});

	it("keeps the scrubber live: the beat narration tracks the clock", () => {
		renderUnderReducedMotion("/finale");
		scrubTo(6_000);
		expect(screen.getByTestId("mission-beat")).toHaveTextContent(
			"The lead is scoping lanes.",
		);
		scrubTo(14_500);
		expect(screen.getByTestId("mission-beat")).toHaveTextContent(
			"Converge: three lanes collapse into one mission commit.",
		);
	});

	it("reaches the terminal shipped state as text without motion", () => {
		renderUnderReducedMotion("/finale");
		scrubTo(19_000);
		expect(screen.getByTestId("mission-beat")).toHaveTextContent(
			"Receipt acknowledged, lease cleared.",
		);
		expect(screen.getByTestId("finale-takeaway")).toHaveTextContent("Shipped");
	});
});
