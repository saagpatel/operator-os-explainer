import { act, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { createMemoryRouter } from "react-router";
import { RouterProvider } from "react-router/dom";
import { describe, expect, it } from "vitest";
import { SessionClockProvider } from "../clock/SessionClockProvider.tsx";
import { GUARD_LAYERS, GUARD_MAP, RULE_CONCEPTS } from "../data/vocab.ts";
import { SafetyScene } from "./SafetyScene";

const RULE_LABEL: Record<string, string> = {
	"push-to-main": "push straight to the main branch",
	"credential-read": "read a credential directory",
	"non-local-db-write": "write to a non-local database",
	"harness-self-mutate": "edit its own guard configuration",
	"deep-home-delete": "bulk-delete near the home root",
	"unverified-complete": "call work done without verifying",
};

function renderSafety(path = "/safety") {
	const router = createMemoryRouter(
		[
			{
				path: "/safety",
				element: (
					<SessionClockProvider>
						<SafetyScene />
					</SessionClockProvider>
				),
			},
		],
		{ initialEntries: [path] },
	);
	return { router, ...render(<RouterProvider router={router} />) };
}

describe("SafetyScene guard triggers", () => {
	it("renders all seven layers and all six fabricated triggers", () => {
		renderSafety();
		for (const layer of GUARD_LAYERS) {
			expect(screen.getByTestId(`ring-${layer}`)).toBeInTheDocument();
		}
		for (const rule of RULE_CONCEPTS) {
			expect(screen.getByText(RULE_LABEL[rule])).toBeInTheDocument();
		}
	});

	it.each(
		RULE_CONCEPTS.map((r) => [r] as const),
	)("%s is blocked at its mapped layer and the agent adapts", (rule) => {
		renderSafety();
		fireEvent.click(screen.getByText(RULE_LABEL[rule]));
		const { layer } = GUARD_MAP[rule];
		expect(screen.getByTestId(`ring-${layer}`)).toHaveAttribute(
			"data-blocking",
			"true",
		);
		const outcome = screen.getByTestId("guard-outcome");
		expect(outcome.textContent).toContain(`blocked by: ${layer}`);
		expect(screen.getByTestId("adaptation")).toBeInTheDocument();
		expect(screen.getByTestId("safety-takeaway")).toBeInTheDocument();
	});

	it("keeps copy descriptive: no command syntax ships in this scene", () => {
		const { container } = renderSafety();
		fireEvent.click(screen.getByText(RULE_LABEL["push-to-main"]));
		expect(container.textContent).not.toMatch(
			/git push|rm -rf|sudo|--force|chmod|curl /,
		);
	});

	it("labels a menu-derived trigger as such at t=0, without a replay claim", () => {
		renderSafety();
		fireEvent.click(screen.getByText(RULE_LABEL["credential-read"]));
		expect(screen.getByTestId("guard-outcome").textContent).toContain(
			"menu-derived demonstration",
		);
	});

	it("reconciles the selected rule during same-route history navigation", async () => {
		const { router } = renderSafety("/safety?rule=push-to-main");
		expect(
			screen.getByRole("button", { name: RULE_LABEL["push-to-main"] }),
		).toHaveAttribute("aria-pressed", "true");

		await act(async () => router.navigate("/safety?rule=credential-read"));

		await waitFor(() =>
			expect(
				screen.getByRole("button", { name: RULE_LABEL["credential-read"] }),
			).toHaveAttribute("aria-pressed", "true"),
		);
		expect(
			screen.getByRole("button", { name: RULE_LABEL["push-to-main"] }),
		).toHaveAttribute("aria-pressed", "false");
	});
});
