import { render, screen, waitFor } from "@testing-library/react";
import { createMemoryRouter, RouterProvider } from "react-router-dom";
import { describe, expect, it } from "vitest";
import {
	SessionClockProvider,
	useSessionClock,
} from "./SessionClockProvider.tsx";
import { useAutoSeek } from "./useAutoSeek.ts";

function AutoSeekProbe({ tStart }: { tStart: number }) {
	useAutoSeek(tStart);
	const { t } = useSessionClock();
	return <span data-testid="clock">{t}</span>;
}

function renderProbe(initialEntry: string, tStart = 6_000) {
	const router = createMemoryRouter(
		[
			{
				path: "/finale",
				element: (
					<SessionClockProvider>
						<AutoSeekProbe tStart={tStart} />
					</SessionClockProvider>
				),
			},
		],
		{ initialEntries: [initialEntry] },
	);
	return render(<RouterProvider router={router} />);
}

describe("useAutoSeek", () => {
	it.each(["/finale", "/finale?t=", "/finale?t=%20", "/finale?t=nope"])(
		"falls back to the scene start for an absent or malformed time: %s",
		async (initialEntry) => {
			renderProbe(initialEntry);
			await waitFor(() =>
				expect(screen.getByTestId("clock")).toHaveTextContent("6000"),
			);
		},
	);

	it.each(["/finale?t=-1", "/finale?t=90001"])(
		"falls back to the scene start for an out-of-session time: %s",
		async (initialEntry) => {
			renderProbe(initialEntry);
			await waitFor(() =>
				expect(screen.getByTestId("clock")).toHaveTextContent("6000"),
			);
		},
	);

	it("honors a finite in-session time", async () => {
		renderProbe("/finale?t=800");
		await waitFor(() =>
			expect(screen.getByTestId("clock")).toHaveTextContent("800"),
		);
	});
});
