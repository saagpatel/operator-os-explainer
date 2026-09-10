import { act, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { createMemoryRouter } from "react-router";
import { RouterProvider } from "react-router/dom";
import { afterEach, describe, expect, it, vi } from "vitest";
import { appRoutes } from "../router.tsx";

function renderApp(initialEntries: string | string[], initialIndex?: number) {
	const entries = Array.isArray(initialEntries)
		? initialEntries
		: [initialEntries];
	const router = createMemoryRouter(appRoutes, {
		initialEntries: entries,
		initialIndex: initialIndex ?? entries.length - 1,
	});
	return { router, ...render(<RouterProvider router={router} />) };
}

function clockParam(search: string): string | null {
	return new URLSearchParams(search).get("t");
}

async function waitForClock(ms: number): Promise<HTMLElement> {
	const scrubber = screen.getByRole("slider", {
		name: "Session clock scrubber",
	});
	await waitFor(() => expect(scrubber).toHaveValue(String(ms)));
	return scrubber;
}

describe("canonical transport permalinks", () => {
	afterEach(() => {
		vi.restoreAllMocks();
	});

	it("writes the scrubber position to t with replace semantics", async () => {
		const { router } = renderApp(["/spine", "/hub?chips=feature#details"]);
		const scrubber = await waitForClock(0);

		fireEvent.change(scrubber, { target: { value: "1500" } });
		fireEvent.change(scrubber, { target: { value: "3500" } });

		await waitFor(() => expect(clockParam(router.state.location.search)).toBe("3500"));
		expect(new URLSearchParams(router.state.location.search).get("chips")).toBe(
			"feature",
		);
		expect(router.state.location.hash).toBe("#details");
		expect(router.state.historyAction).toBe("REPLACE");

		await act(async () => {
			await router.navigate(-1);
		});
		expect(router.state.location.pathname).toBe("/spine");
		expect(router.state.location.search).toBe("");

		await act(async () => {
			await router.navigate(1);
		});
		expect(router.state.location.pathname).toBe("/hub");
		expect(clockParam(router.state.location.search)).toBe("3500");
		expect(new URLSearchParams(router.state.location.search).get("chips")).toBe(
			"feature",
		);
		expect(router.state.location.hash).toBe("#details");
	});

	it("writes previous and next event boundaries to t", async () => {
		const { router } = renderApp("/hub?t=800");
		await waitForClock(800);

		fireEvent.click(screen.getByRole("button", { name: "Step to next event" }));
		await waitFor(() => expect(clockParam(router.state.location.search)).toBe("1500"));
		await waitForClock(1500);

		fireEvent.click(
			screen.getByRole("button", { name: "Step to previous event" }),
		);
		await waitFor(() => expect(clockParam(router.state.location.search)).toBe("800"));
		await waitForClock(800);
	});

	it("writes Home, End, and arrow keyboard positions to t", async () => {
		const { router } = renderApp("/hub?t=800");
		await waitForClock(800);

		await act(async () => {
			fireEvent.keyDown(window, { key: "ArrowRight" });
		});
		await waitFor(() =>
			expect(clockParam(router.state.location.search)).toBe("1500"),
		);
		await waitForClock(1500);

		await act(async () => {
			fireEvent.keyDown(window, { key: "End" });
		});
		await waitFor(() =>
			expect(clockParam(router.state.location.search)).toBe("90000"),
		);
		await waitForClock(90_000);

		await act(async () => {
			fireEvent.keyDown(window, { key: "Home" });
		});
		await waitFor(() => expect(clockParam(router.state.location.search)).toBe("0"));
		await waitForClock(0);
	});

	it("preserves unrelated query parameters and the hash while updating t", async () => {
		const { router } = renderApp("/safety?t=0&rule=push-to-main#panel");
		const scrubber = await waitForClock(0);

		fireEvent.change(scrubber, { target: { value: "5000" } });

		await waitFor(() => expect(clockParam(router.state.location.search)).toBe("5000"));
		expect(new URLSearchParams(router.state.location.search).get("rule")).toBe(
			"push-to-main",
		);
		expect(router.state.location.hash).toBe("#panel");
	});

	it("does not rewrite the URL during playback frames", async () => {
		const frames: FrameRequestCallback[] = [];
		vi.spyOn(window, "requestAnimationFrame").mockImplementation((cb) => {
			frames.push(cb);
			return frames.length;
		});
		vi.spyOn(window, "cancelAnimationFrame").mockImplementation(() => {});

		const { router } = renderApp("/hub?t=800");
		await waitForClock(800);

		await act(async () => {
			fireEvent.click(screen.getByRole("button", { name: "Play" }));
		});
		expect(frames.length).toBeGreaterThan(0);

		await act(async () => {
			const tick = frames[frames.length - 1];
			tick(0);
			tick(1_000);
		});

		expect(clockParam(router.state.location.search)).toBe("800");
		expect(screen.getByRole("slider", { name: "Session clock scrubber" })).not.toHaveValue(
			"800",
		);
	});

	it("rehydrates a valid t and leaves malformed values to the scene-start fallback", async () => {
		const valid = renderApp("/hub?t=1500");
		await waitForClock(1500);
		expect(clockParam(valid.router.state.location.search)).toBe("1500");
		valid.unmount();

		const malformed = renderApp("/hub?t=nope");
		await waitForClock(0);
		expect(clockParam(malformed.router.state.location.search)).toBe("nope");
		malformed.unmount();

		const empty = renderApp("/hub?t=");
		await waitForClock(0);
		expect(clockParam(empty.router.state.location.search)).toBe("");
		empty.unmount();

		const negative = renderApp("/hub?t=-1");
		await waitForClock(0);
		expect(clockParam(negative.router.state.location.search)).toBe("-1");
		negative.unmount();

		const outOfRange = renderApp("/finale?t=90001");
		await waitForClock(6_000);
		expect(clockParam(outOfRange.router.state.location.search)).toBe("90001");
	});

	it("applies same-route history t changes without a write-back loop", async () => {
		const { router } = renderApp("/hub?t=800");
		await waitForClock(800);

		let commits = 0;
		const unsubscribe = router.subscribe(() => {
			commits += 1;
		});

		await act(async () => {
			await router.navigate("/hub?t=1500");
		});
		const afterNavigate = commits;
		await waitForClock(1500);

		expect(clockParam(router.state.location.search)).toBe("1500");
		expect(commits).toBe(afterNavigate);
		unsubscribe();
	});
});
