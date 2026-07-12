import { render, screen } from "@testing-library/react";
import { createMemoryRouter, RouterProvider } from "react-router-dom";
import { describe, expect, it } from "vitest";
import { PlaceholderScene } from "../../scenes/PlaceholderScene";
import { ConsoleShell } from "./ConsoleShell";

function renderShell(initialPath = "/") {
	const router = createMemoryRouter(
		[
			{
				path: "/",
				element: <ConsoleShell />,
				children: [
					{ index: true, element: <PlaceholderScene /> },
					{ path: "fleet", element: <PlaceholderScene /> },
				],
			},
		],
		{ initialEntries: [initialPath] },
	);
	return render(<RouterProvider router={router} />);
}

describe("ConsoleShell", () => {
	it("always shows the transport Play/Pause control (SC 2.2.2)", () => {
		renderShell();
		expect(screen.getByRole("button", { name: "Play" })).toBeInTheDocument();
	});

	it("shows the synthetic-data badge in the chrome", () => {
		renderShell();
		expect(screen.getByText(/synthetic data/i)).toBeInTheDocument();
	});

	it("resolves a deep-linked scene route", () => {
		renderShell("/fleet");
		expect(
			screen.getByRole("heading", { name: "The Fleet" }),
		).toBeInTheDocument();
	});

	it("exposes the scrubber bound to the 90s session", () => {
		renderShell();
		const scrub = screen.getByRole("slider", {
			name: "Session clock scrubber",
		});
		expect(scrub).toHaveAttribute("max", "90000");
	});
});
