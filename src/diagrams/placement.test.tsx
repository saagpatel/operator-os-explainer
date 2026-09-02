import { fireEvent, render, screen } from "@testing-library/react";
import { createMemoryRouter } from "react-router";
import { RouterProvider } from "react-router/dom";
import { describe, expect, it } from "vitest";
import { SessionClockProvider } from "../clock/SessionClockProvider.tsx";
import { CodaScene } from "../scenes/CodaScene";
import { FleetScene } from "../scenes/FleetScene";
import { HubScene } from "../scenes/HubScene";
import { SafetyScene } from "../scenes/SafetyScene";
import { SpineScene } from "../scenes/SpineScene";
import { DIAGRAMS, diagramsFor } from "./index.ts";

function renderScene(path: string, element: React.ReactNode) {
	const router = createMemoryRouter(
		[{ path, element: <SessionClockProvider>{element}</SessionClockProvider> }],
		{ initialEntries: [path] },
	);
	return render(<RouterProvider router={router} />);
}

const scenes = [
	["/spine", "spine", <SpineScene key="spine" />],
	["/hub", "hub", <HubScene key="hub" />],
	["/safety", "safety", <SafetyScene key="safety" />],
	["/coda", "coda", <CodaScene key="coda" />],
] as const;

describe("mechanism diagram placement", () => {
	it.each(scenes)("%s carries its diagrams inside the deep panel", (path, lens, element) => {
		renderScene(path, element);
		const expected = diagramsFor(lens);
		expect(expected.length).toBeGreaterThan(0);
		for (const model of expected) {
			expect(screen.queryByRole("img", { name: model.ariaLabel })).not.toBeInTheDocument();
		}
		fireEvent.click(screen.getByRole("button", { name: /go deeper/i }));
		const region = screen.getByRole("region", { name: /go deeper/i });
		for (const model of expected) {
			const figure = screen.getByRole("img", { name: model.ariaLabel });
			expect(region).toContainElement(figure);
			expect(region).toHaveTextContent(model.title);
			expect(region).toHaveTextContent(model.figcaption);
		}
	});

	it("leaves the fleet panel without a figure", () => {
		renderScene("/fleet", <FleetScene />);
		fireEvent.click(screen.getByRole("button", { name: /go deeper/i }));
		for (const model of Object.values(DIAGRAMS)) {
			expect(screen.queryByRole("img", { name: model.ariaLabel })).not.toBeInTheDocument();
		}
	});
});
