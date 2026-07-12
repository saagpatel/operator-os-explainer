import { fireEvent, render, screen } from "@testing-library/react";
import { createMemoryRouter, RouterProvider } from "react-router-dom";
import { describe, expect, it } from "vitest";
import {
	SessionClockProvider,
	useSessionClock,
} from "../clock/SessionClockProvider.tsx";
import { HubScene } from "./HubScene";

function ScrubHarness() {
	const clock = useSessionClock();
	return (
		<button type="button" onClick={() => clock.scrub(90_000)}>
			scrub-end
		</button>
	);
}

function renderHub() {
	const router = createMemoryRouter(
		[
			{
				path: "/hub",
				element: (
					<SessionClockProvider>
						<HubScene />
						<ScrubHarness />
					</SessionClockProvider>
				),
			},
		],
		{ initialEntries: ["/hub"] },
	);
	return render(<RouterProvider router={router} />);
}

const stepButton = () =>
	screen.getByRole("button", {
		name: "Step the draft through the next airlock chamber",
	});

describe("HubScene airlock + freshness", () => {
	it("opens honestly empty: no capsule, all five spokes unavailable", () => {
		renderHub();
		expect(screen.queryByTestId("capsule")).toBeNull();
		for (const spoke of [
			"bridge",
			"event-bus",
			"overlay",
			"auditor",
			"evals-ledger",
		]) {
			expect(screen.getByTestId(`spoke-${spoke}`)).toHaveAttribute(
				"data-state",
				"unavailable",
			);
		}
	});

	it("steps DRAFT-71 through draft, approval, and send", () => {
		renderHub();

		fireEvent.click(stepButton()); // draft @40000
		expect(screen.getByTestId("capsule")).toBeInTheDocument();
		expect(screen.getByTestId("chamber-draft")).toHaveAttribute(
			"data-active",
			"true",
		);
		expect(
			screen.getByText("APPROVAL PENDING - TOKEN REQUIRED"),
		).toBeInTheDocument();

		fireEvent.click(stepButton()); // approval @42000
		expect(screen.getByTestId("chamber-approval")).toHaveAttribute(
			"data-active",
			"true",
		);
		expect(
			screen.getByText("TOKEN ACCEPTED · OPERATOR-MINTED"),
		).toBeInTheDocument();

		fireEvent.click(stepButton()); // send @44000
		expect(screen.getByTestId("capsule")).toHaveAttribute("data-sent", "true");
		expect(screen.getByTestId("capsule-sent")).toBeInTheDocument();
		expect(screen.getByText("SEND WINDOW OPEN")).toBeInTheDocument();
		expect(screen.getByTestId("hub-takeaway")).toBeInTheDocument();
		expect(stepButton()).toBeDisabled();
	});

	it("advances the freshness rail with the clock while stepping", () => {
		renderHub();
		fireEvent.click(stepButton()); // t -> 40000: bridge/event-bus fresh, auditor aging
		expect(screen.getByTestId("spoke-bridge")).toHaveAttribute(
			"data-state",
			"fresh",
		);
		expect(screen.getByTestId("spoke-auditor")).toHaveAttribute(
			"data-state",
			"aging",
		);
		expect(screen.getByTestId("spoke-overlay")).toHaveAttribute(
			"data-state",
			"unavailable",
		);
	});

	it("ends the session with overlay stale: the honest imperfect ending", () => {
		renderHub();
		fireEvent.click(screen.getByText("scrub-end"));
		expect(screen.getByTestId("spoke-overlay")).toHaveAttribute(
			"data-state",
			"stale",
		);
		expect(screen.getByTestId("spoke-auditor")).toHaveAttribute(
			"data-state",
			"fresh",
		);
		expect(screen.getByTestId("overlay-stale-note")).toBeInTheDocument();
	});
});
