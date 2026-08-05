import { render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { createMemoryRouter } from "react-router";
import { RouterProvider } from "react-router/dom";
import { SessionClockProvider } from "../clock/SessionClockProvider.tsx";
import { CodaScene } from "./CodaScene.tsx";

function renderCoda() {
	const router = createMemoryRouter(
		[
			{
				path: "/coda",
				element: (
					<SessionClockProvider>
						<CodaScene />
					</SessionClockProvider>
				),
			},
		],
		{ initialEntries: ["/coda"] },
	);
	return render(<RouterProvider router={router} />);
}

afterEach(() => {
	vi.unstubAllGlobals();
});

describe("CodaScene proof continuation", () => {
	it("offers three explicit public proof paths and keeps the tour open", () => {
		renderCoda();

		const links = [
			[
				/Receipts room · opens in a new tab/i,
				"https://saagarpatel.dev/receipts",
			],
			[
				/Instruments room · opens in a new tab/i,
				"https://saagarpatel.dev/instruments",
			],
			[
				/Who audits the auditor\? · opens in a new tab/i,
				"https://saagarpatel.dev/writing/who-audits-the-auditor",
			],
		] as const;

		for (const [name, href] of links) {
			const link = screen.getByRole("link", { name });
			expect(link).toHaveAttribute("href", href);
			expect(link).toHaveAttribute("target", "_blank");
			expect(link).toHaveAttribute("rel", "noopener noreferrer");
		}

		expect(
			screen.getByRole("link", { name: "Replay from the opening" }),
		).toHaveAttribute("href", "/");
		expect(screen.getAllByText(/synthetic/i).length).toBeGreaterThan(0);
	});

	it("does not make a passive request before a visitor chooses a link", () => {
		const fetchSpy = vi.fn();
		vi.stubGlobal("fetch", fetchSpy);
		renderCoda();
		expect(fetchSpy).not.toHaveBeenCalled();
	});
});
