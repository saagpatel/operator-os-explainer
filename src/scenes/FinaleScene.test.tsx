import { fireEvent, render, screen } from "@testing-library/react";
import { createMemoryRouter, RouterProvider } from "react-router-dom";
import { describe, expect, it } from "vitest";
import {
	SessionClockProvider,
	useSessionClock,
} from "../clock/SessionClockProvider.tsx";
import { FinaleScene } from "./FinaleScene";

/** Scrub helper exposed next to the scene so tests can drive the clock. */
function ScrubHarness() {
	const clock = useSessionClock();
	return (
		<div>
			{[6_000, 10_500, 12_000, 15_500, 17_000, 17_500, 19_000].map((t) => (
				<button key={t} type="button" onClick={() => clock.scrub(t)}>
					scrub-{t}
				</button>
			))}
		</div>
	);
}

function renderFinale() {
	const router = createMemoryRouter(
		[
			{
				path: "/finale",
				element: (
					<SessionClockProvider>
						<FinaleScene />
						<ScrubHarness />
					</SessionClockProvider>
				),
			},
		],
		{ initialEntries: ["/finale"] },
	);
	return render(<RouterProvider router={router} />);
}

const scrub = (t: number) => fireEvent.click(screen.getByText(`scrub-${t}`));

describe("FinaleScene mission arc", () => {
	it("auto-seeks to t=6000: mission underway, ledger at $0.03, lanes waiting", () => {
		renderFinale();
		expect(screen.getByTestId("ledger-total").textContent).toBe("$0.03");
		expect(screen.getByTestId("lane-0")).toHaveAttribute("data-phase", "empty");
		expect(screen.getByTestId("verify-gate")).toHaveAttribute(
			"data-state",
			"neutral",
		);
	});

	it("runs lanes, fires the guard, blocks then passes verify, ships, reconciles", () => {
		renderFinale();

		scrub(10_500); // lanes running
		expect(screen.getByTestId("lane-0")).toHaveAttribute("data-phase", "run");
		expect(screen.getByTestId("lane-2")).toHaveAttribute("data-phase", "run");

		scrub(12_000); // guard fired mid-run, ledger climbing
		expect(screen.getByTestId("swarm-guard")).toBeInTheDocument();
		expect(screen.getByTestId("ledger-total").textContent).toBe("$0.18");

		scrub(15_500); // verify attempt 1 blocked
		expect(screen.getByTestId("lane-1")).toHaveAttribute(
			"data-phase",
			"converge",
		);
		expect(screen.getByTestId("verify-gate")).toHaveAttribute(
			"data-state",
			"block",
		);
		expect(screen.getByText(/ATTEMPT 1: BLOCK/)).toBeInTheDocument();

		scrub(17_500); // pass + shipped card
		expect(screen.getByTestId("verify-gate")).toHaveAttribute(
			"data-state",
			"pass",
		);
		expect(screen.getByTestId("shipped-card")).toBeInTheDocument();

		scrub(19_000); // complete: ripple docked, ledger reconciled, takeaway
		expect(screen.getByTestId("ship-ripple")).toBeInTheDocument();
		expect(screen.getByTestId("ledger-total").textContent).toBe("$0.27");
		expect(screen.getByTestId("ledger-reconciled")).toBeInTheDocument();
		expect(screen.getByTestId("finale-takeaway")).toBeInTheDocument();
		expect(screen.getByText(/LEASE CLEARED/)).toBeInTheDocument();
	});

	it("scrubbing back rewinds the mission deterministically", () => {
		renderFinale();
		scrub(19_000);
		expect(screen.getByTestId("ledger-total").textContent).toBe("$0.27");
		scrub(6_000);
		expect(screen.getByTestId("ledger-total").textContent).toBe("$0.03");
		expect(screen.getByTestId("verify-gate")).toHaveAttribute(
			"data-state",
			"neutral",
		);
		expect(screen.queryByTestId("shipped-card")).toBeNull();
	});

	it("offers the local mission transport and starts paused", () => {
		renderFinale();
		expect(
			screen.getByRole("button", { name: "Run the mission" }),
		).toBeInTheDocument();
		expect(screen.getByTestId("mission-beat").textContent).toContain(
			"scoping lanes",
		);
	});
});
