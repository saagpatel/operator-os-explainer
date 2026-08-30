import { act, render, screen, waitFor } from "@testing-library/react";
import { createMemoryRouter } from "react-router";
import { RouterProvider } from "react-router/dom";
import { describe, expect, it } from "vitest";
import { CodaScene } from "../../scenes/CodaScene";
import { FleetScene } from "../../scenes/FleetScene";
import { ConsoleShell } from "./ConsoleShell";

function renderShell(initialPath = "/coda") {
	const router = createMemoryRouter(
		[
			{
				path: "/",
				element: <ConsoleShell />,
				children: [
					{ path: "coda", element: <CodaScene /> },
					{ path: "fleet", element: <FleetScene /> },
				],
			},
		],
		{ initialEntries: [initialPath] },
	);
	return { router, ...render(<RouterProvider router={router} />) };
}

describe("ConsoleShell", () => {
	it("always shows the transport Play/Pause control (SC 2.2.2)", () => {
		renderShell();
		expect(screen.getByRole("button", { name: "Play" })).toBeInTheDocument();
	});

	it("shows the synthetic-data badge in the chrome", () => {
		renderShell();
		expect(screen.getAllByText(/synthetic data/i).length).toBeGreaterThan(0);
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

	it("updates route identity and focuses the new scene heading", async () => {
		const { router } = renderShell();
		await waitFor(() =>
			expect(document.title).toBe("Coda — Anatomy of an AI Operator OS"),
		);

		await act(async () => router.navigate("/fleet"));

		const heading = await screen.findByRole("heading", { name: "The Fleet" });
		expect(document.title).toBe("The Fleet — Anatomy of an AI Operator OS");
		await waitFor(() => expect(heading).toHaveFocus());
	});
});
