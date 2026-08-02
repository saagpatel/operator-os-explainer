import { render, screen } from "@testing-library/react";
import { createMemoryRouter, RouterProvider } from "react-router-dom";
import { describe, expect, it } from "vitest";
import { appRoutes } from "./router.tsx";

describe("app routes", () => {
	it("keeps an unknown scene inside the console with a recovery action", () => {
		const router = createMemoryRouter(appRoutes, {
			initialEntries: ["/scene-that-does-not-exist"],
		});
		render(<RouterProvider router={router} />);

		expect(
			screen.getByRole("heading", { name: "Scene not found" }),
		).toBeInTheDocument();
		expect(
			screen.getByRole("link", { name: "Return to opening" }),
		).toHaveAttribute("href", "/");
		expect(screen.getByRole("button", { name: "Play" })).toBeInTheDocument();
		expect(screen.getAllByText(/synthetic data/i).length).toBeGreaterThan(0);
	});
});
