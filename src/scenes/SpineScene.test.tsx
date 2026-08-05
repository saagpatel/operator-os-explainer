import { fireEvent, render, screen } from "@testing-library/react";
import { createMemoryRouter } from "react-router";
import { RouterProvider } from "react-router/dom";
import { describe, expect, it } from "vitest";
import { SessionClockProvider } from "../clock/SessionClockProvider.tsx";
import { SpineScene } from "./SpineScene";

function renderSpine() {
	const router = createMemoryRouter(
		[
			{
				path: "/spine",
				element: (
					<SessionClockProvider>
						<SpineScene />
					</SessionClockProvider>
				),
			},
		],
		{ initialEntries: ["/spine"] },
	);
	return render(<RouterProvider router={router} />);
}

const stepButton = () =>
	screen.getByRole("button", { name: "Step the handoff to its next stage" });

describe("SpineScene handoff run", () => {
	it("starts with the lane unlit and the feed empty", () => {
		renderSpine();
		expect(screen.getByTestId("stage-dispatch")).toHaveAttribute(
			"data-lit",
			"false",
		);
		expect(screen.getByText(/feed empty/i)).toBeInTheDocument();
	});

	it("steps through all five stages, driving the clock and the feed", () => {
		renderSpine();

		fireEvent.click(stepButton()); // -> dispatch @1500
		expect(screen.getByTestId("stage-dispatch")).toHaveAttribute(
			"data-lit",
			"true",
		);
		expect(screen.getByTestId("stage-note").textContent).toContain("PLAN.md");

		fireEvent.click(stepButton()); // -> snapshot @2200
		expect(screen.getByTestId("stage-snapshot")).toHaveAttribute(
			"data-lit",
			"true",
		);
		expect(screen.getByTestId("stage-note").textContent).toContain(
			"snapshot before takeover",
		);

		fireEvent.click(stepButton()); // -> pickup @3000
		expect(screen.getByTestId("stage-pickup")).toHaveAttribute(
			"data-lit",
			"true",
		);

		fireEvent.click(stepButton()); // -> receipt @18500: the 15.5s mission gap
		expect(screen.getByTestId("stage-receipt")).toHaveAttribute(
			"data-lit",
			"true",
		);
		expect(screen.getByTestId("stage-note").textContent).toContain("Scene 04");
		// the feed has revealed the SHIPPED activity from inside the gap
		expect(screen.getByText("shipped the export pipeline")).toBeInTheDocument();
		expect(screen.getByText("SHIPPED")).toBeInTheDocument();

		fireEvent.click(stepButton()); // -> clear @19000
		expect(screen.getByTestId("stage-clear")).toHaveAttribute(
			"data-lit",
			"true",
		);
		expect(screen.getByTestId("spine-takeaway")).toBeInTheDocument();
		expect(stepButton()).toBeDisabled();
	});

	it("shows the five row shapes in the schema inspector, synthetic only", () => {
		renderSpine();
		fireEvent.click(screen.getByRole("button", { name: /go deeper/i }));
		const panel = screen.getByText(/single SQLite store/i).closest("div");
		expect(panel).not.toBeNull();
		// the inspector renders real dataset rows; spot-check synthetic markers
		expect(
			screen.getAllByText(/"projectName": "Corveth"/).length,
		).toBeGreaterThan(0);
		expect(screen.getByText(/~\/workspace\/corveth/)).toBeInTheDocument();
		expect(
			screen.getByText(/"content": "Synthetic career section body\."/),
		).toBeInTheDocument();
	});
});
