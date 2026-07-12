import { fireEvent, render, screen } from "@testing-library/react";
import { createMemoryRouter, RouterProvider } from "react-router-dom";
import { describe, expect, it } from "vitest";
import { SessionClockProvider } from "../clock/SessionClockProvider.tsx";
import { FleetScene } from "./FleetScene";

function renderFleet(path = "/fleet") {
	const router = createMemoryRouter(
		[
			{
				path: "/fleet",
				element: (
					<SessionClockProvider>
						<FleetScene />
					</SessionClockProvider>
				),
			},
		],
		{ initialEntries: [path] },
	);
	return render(<RouterProvider router={router} />);
}

describe("FleetScene routing interaction", () => {
	it("shows the four tray chips", () => {
		renderFleet();
		for (const tc of ["feature", "sweep", "essay", "audit"]) {
			expect(
				screen.getByRole("button", {
					name: `Route the ${tc} task to its owner`,
				}),
			).toBeInTheDocument();
		}
	});

	it.each([
		["feature", "CLAUDE CODE", "live filesystem + test runner"],
		["sweep", "CODEX", "parallelism beats reasoning depth"],
		["essay", "CLAUDE.AI", "no filesystem; writes and dispatches"],
		["audit", "AUTONOMOUS", "scheduled, read-only, night shift"],
	])("routes %s to %s with its why-here line", (tc, owner, why) => {
		renderFleet();
		fireEvent.click(
			screen.getByRole("button", { name: `Route the ${tc} task to its owner` }),
		);
		expect(
			screen.getByText(`${tc.toUpperCase()} -> ${owner}`),
		).toBeInTheDocument();
		expect(screen.getAllByText(`why here: ${why}`).length).toBeGreaterThan(0);
		expect(screen.getByTestId(`chip-docked-${tc}`)).toBeInTheDocument();
	});

	it("reveals the takeaway once all four chips are routed", () => {
		renderFleet();
		expect(screen.queryByTestId("fleet-takeaway")).toBeNull();
		for (const tc of ["feature", "sweep", "essay", "audit"]) {
			fireEvent.click(
				screen.getByRole("button", {
					name: `Route the ${tc} task to its owner`,
				}),
			);
		}
		expect(screen.getByTestId("fleet-takeaway")).toBeInTheDocument();
	});

	it("opens the deep panel with the full routing table", () => {
		renderFleet();
		const toggle = screen.getByRole("button", { name: /go deeper/i });
		expect(toggle).toHaveAttribute("aria-expanded", "false");
		fireEvent.click(toggle);
		expect(toggle).toHaveAttribute("aria-expanded", "true");
		// all 8 task classes surface in the practitioner table
		expect(screen.getByText("depbump")).toBeInTheDocument();
		expect(screen.getByText("ci-fix")).toBeInTheDocument();
	});

	it("pre-routes chips from the ?chips= deep link", () => {
		renderFleet("/fleet?chips=feature,sweep");
		expect(screen.getByTestId("chip-docked-feature")).toBeInTheDocument();
		expect(screen.getByTestId("chip-docked-sweep")).toBeInTheDocument();
		expect(screen.queryByTestId("chip-docked-essay")).toBeNull();
	});
});
