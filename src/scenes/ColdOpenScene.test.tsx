import { fireEvent, render, screen } from "@testing-library/react";
import { createMemoryRouter } from "react-router";
import { RouterProvider } from "react-router/dom";
import { describe, expect, it } from "vitest";
import {
	SessionClockProvider,
	useSessionClock,
} from "../clock/SessionClockProvider.tsx";
import { ColdOpenScene } from "./ColdOpenScene";

function ScrubHarness() {
	const clock = useSessionClock();
	return (
		<div>
			{[0, 2_500, 12_000, 18_000].map((t) => (
				<button key={t} type="button" onClick={() => clock.scrub(t)}>
					scrub-{t}
				</button>
			))}
			<button type="button" onClick={() => clock.pause()}>
				halt
			</button>
			<span data-testid="harness-playing">{String(clock.playing)}</span>
		</div>
	);
}

function renderOpen() {
	const router = createMemoryRouter(
		[
			{
				path: "/",
				element: (
					<SessionClockProvider>
						<ColdOpenScene />
						<ScrubHarness />
					</SessionClockProvider>
				),
			},
		],
		{ initialEntries: ["/"] },
	);
	return render(<RouterProvider router={router} />);
}

describe("ColdOpenScene", () => {
	it("explains the system, trust boundary, and immediate next step", () => {
		renderOpen();

		const briefing = screen.getByRole("region", {
			name: "First-visit briefing",
		});
		expect(briefing).toHaveTextContent("personal multi-agent Operator OS");
		expect(briefing).toHaveTextContent(
			"Evidence defines what is proven; authority defines what the system may do",
		);
		expect(briefing).toHaveTextContent("deterministic synthetic data");
		expect(
			screen.getByRole("link", { name: /start with routing/i }),
		).toHaveAttribute("href", "/fleet");
	});

	it("autoplays on load (full motion) with the instruction dropped in", () => {
		renderOpen();
		expect(screen.getByTestId("harness-playing").textContent).toBe("true");
		expect(
			screen.getByText(/ship the export pipeline for Corveth/),
		).toBeInTheDocument();
	});

	it("threads the arc: guard, gate, ship light with the clock", () => {
		renderOpen();
		fireEvent.click(screen.getByText("halt"));

		fireEvent.click(screen.getByText("scrub-2500"));
		expect(screen.queryByTestId("co-guard")).toBeNull();
		expect(screen.getByTestId("open-caption").textContent).toContain("spine");

		fireEvent.click(screen.getByText("scrub-12000"));
		expect(screen.getByTestId("co-guard")).toBeInTheDocument();
		expect(screen.getByTestId("open-caption").textContent).toContain("adapts");

		fireEvent.click(screen.getByText("scrub-18000"));
		expect(screen.getByTestId("co-gate")).toHaveAttribute("data-state", "pass");
		expect(screen.getByTestId("co-shipped")).toBeInTheDocument();
	});

	it("keeps the routing invite available while the replay settles", () => {
		renderOpen();
		fireEvent.click(screen.getByText("halt"));
		expect(screen.getByTestId("explore-invite")).toHaveAttribute(
			"href",
			"/fleet",
		);
		fireEvent.click(screen.getByText("scrub-18000"));
		expect(screen.getByText(/replay complete/i)).toBeInTheDocument();
	});
});
