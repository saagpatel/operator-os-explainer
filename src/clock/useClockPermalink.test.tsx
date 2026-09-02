/**
 * The `?t=` permalink contract: every reader transport action leaves a URL you
 * can paste to somebody else, and nothing else touches the URL at all.
 *
 * These mount the REAL ConsoleShell (transport bar, global shortcuts, provider)
 * over a memory router, because the whole point is the seam between the clock
 * and the router. The scene is a probe rather than a storyboard scene only so
 * the assertions stay deterministic: it still runs the real `useAutoSeek`.
 */
import { act, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { createMemoryRouter } from "react-router";
import { RouterProvider } from "react-router/dom";
import { afterEach, describe, expect, it, vi } from "vitest";
import { ConsoleShell } from "../components/shell/ConsoleShell";
import { useSessionClock } from "./SessionClockProvider.tsx";
import { useAutoSeek } from "./useAutoSeek.ts";

function ProbeScene({ tStart }: { tStart: number }) {
	useAutoSeek(tStart);
	const clock = useSessionClock();
	return (
		<div>
			<h1 tabIndex={-1} data-scene-heading>
				Probe
			</h1>
			<span data-testid="t">{clock.t}</span>
			<button type="button" onClick={() => clock.scrub(12_000)}>
				scene-scrub
			</button>
		</div>
	);
}

function renderConsole(
	initialEntries: string[],
	{ tStart = 0, initialIndex }: { tStart?: number; initialIndex?: number } = {},
) {
	const router = createMemoryRouter(
		[
			{
				path: "/",
				element: <ConsoleShell />,
				children: [
					{ path: "probe", element: <ProbeScene tStart={tStart} /> },
					{ path: "other", element: <ProbeScene tStart={tStart} /> },
				],
			},
		],
		{ initialEntries, initialIndex },
	);
	return { router, ...render(<RouterProvider router={router} />) };
}

const search = (router: { state: { location: { search: string } } }) =>
	router.state.location.search;
const timeParam = (router: { state: { location: { search: string } } }) =>
	new URLSearchParams(search(router)).get("t");

const scrubber = () =>
	screen.getByRole("slider", { name: "Session clock scrubber" });

function scrubTo(ms: number): void {
	fireEvent.change(scrubber(), { target: { value: String(ms) } });
}

/** Hand-driven rAF so a "playing" clock advances a known number of frames. */
function stubAnimationFrames(): { advance: (ms: number) => void } {
	let pending: FrameRequestCallback[] = [];
	vi.stubGlobal("requestAnimationFrame", (cb: FrameRequestCallback) => {
		pending.push(cb);
		return pending.length;
	});
	vi.stubGlobal("cancelAnimationFrame", () => {});
	let now = 0;
	return {
		advance(ms) {
			now += ms;
			const due = pending;
			pending = [];
			act(() => {
				for (const cb of due) cb(now);
			});
		},
	};
}

afterEach(() => vi.unstubAllGlobals());

describe("transport permalinks", () => {
	it("writes the scrubbed position to the route's t parameter", async () => {
		const { router } = renderConsole(["/probe"]);

		scrubTo(5_000);

		await waitFor(() => expect(timeParam(router)).toBe("5000"));
		// And the URL echo does not fight the clock back to somewhere else.
		expect(screen.getByTestId("t")).toHaveTextContent("5000");
	});

	it("writes the boundary chosen by the previous/next event buttons", async () => {
		const { router } = renderConsole(["/probe"]);

		fireEvent.click(screen.getByRole("button", { name: "Step to next event" }));
		await waitFor(() => expect(timeParam(router)).toBe("800"));
		expect(screen.getByTestId("t")).toHaveTextContent("800");

		fireEvent.click(screen.getByRole("button", { name: "Step to next event" }));
		await waitFor(() => expect(timeParam(router)).toBe("1500"));

		fireEvent.click(
			screen.getByRole("button", { name: "Step to previous event" }),
		);
		await waitFor(() => expect(timeParam(router)).toBe("800"));
		expect(screen.getByTestId("t")).toHaveTextContent("800");
	});

	it.each([
		["End", "90000"],
		["Home", "0"],
		["ArrowRight", "4500"],
		["ArrowLeft", "3500"],
	] as const)(
		"writes the position reached by the %s shortcut",
		async (key, expected) => {
			const { router } = renderConsole(["/probe?t=4000"]);
			await waitFor(() =>
				expect(screen.getByTestId("t")).toHaveTextContent("4000"),
			);

			fireEvent.keyDown(window, { key });

			await waitFor(() => expect(timeParam(router)).toBe(expected));
			expect(screen.getByTestId("t")).toHaveTextContent(expected);
		},
	);

	it("carries unrelated parameters and the hash through the write", async () => {
		const { router } = renderConsole([
			"/probe?chips=feature,sweep&rule=push-to-main#go-deeper",
		]);

		scrubTo(5_000);

		await waitFor(() => expect(timeParam(router)).toBe("5000"));
		const params = new URLSearchParams(search(router));
		expect(params.get("chips")).toBe("feature,sweep");
		expect(params.get("rule")).toBe("push-to-main");
		expect(router.state.location.hash).toBe("#go-deeper");
	});

	it("replaces rather than pushes, so Back skips the whole scrub trail", async () => {
		const { router } = renderConsole(["/other", "/probe"], { initialIndex: 1 });

		scrubTo(5_000);
		await waitFor(() => expect(timeParam(router)).toBe("5000"));
		scrubTo(7_000);
		fireEvent.click(screen.getByRole("button", { name: "Step to next event" }));
		fireEvent.keyDown(window, { key: "End" });
		await waitFor(() => expect(timeParam(router)).toBe("90000"));
		expect(router.state.historyAction).toBe("REPLACE");

		await act(async () => router.navigate(-1));

		expect(router.state.location.pathname).toBe("/other");
	});

	it("does not write an unchanged position twice", async () => {
		const { router } = renderConsole(["/probe?t=0"]);
		await waitFor(() => expect(screen.getByTestId("t")).toHaveTextContent("0"));
		const key = router.state.location.key;

		// Already parked at 0: stepping back and pressing Home both land on 0.
		fireEvent.click(
			screen.getByRole("button", { name: "Step to previous event" }),
		);
		fireEvent.keyDown(window, { key: "Home" });

		expect(router.state.location.key).toBe(key);
		expect(search(router)).toBe("?t=0");
	});

	it("leaves the URL alone while playback runs", async () => {
		const frames = stubAnimationFrames();
		const { router } = renderConsole(["/probe?t=1000"]);
		await waitFor(() =>
			expect(screen.getByTestId("t")).toHaveTextContent("1000"),
		);

		fireEvent.click(screen.getByRole("button", { name: "Play" }));
		frames.advance(0);
		frames.advance(16);
		frames.advance(16);

		expect(Number(screen.getByTestId("t").textContent)).toBeGreaterThan(1_000);
		expect(search(router)).toBe("?t=1000");
	});

	it("leaves the URL alone for route-entry auto-seek and scene-local seeks", async () => {
		const { router } = renderConsole(["/probe"], { tStart: 6_000 });
		await waitFor(() =>
			expect(screen.getByTestId("t")).toHaveTextContent("6000"),
		);
		expect(search(router)).toBe("");

		fireEvent.click(screen.getByRole("button", { name: "scene-scrub" }));

		expect(screen.getByTestId("t")).toHaveTextContent("12000");
		expect(search(router)).toBe("");
	});

	it("rehydrates a valid t and keeps the URL untouched", async () => {
		const { router } = renderConsole(["/probe?t=1500"], { tStart: 6_000 });

		await waitFor(() =>
			expect(screen.getByTestId("t")).toHaveTextContent("1500"),
		);
		expect(search(router)).toBe("?t=1500");
	});

	it.each(["/probe?t=", "/probe?t=nope", "/probe?t=-1", "/probe?t=90001"])(
		"falls back to the scene start without rewriting %s",
		async (entry) => {
			const { router } = renderConsole([entry], { tStart: 6_000 });

			await waitFor(() =>
				expect(screen.getByTestId("t")).toHaveTextContent("6000"),
			);
			expect(search(router)).toBe(entry.slice(entry.indexOf("?")));
		},
	);

	it("follows a same-route URL change without writing back", async () => {
		const { router } = renderConsole(["/probe?t=1500"], { tStart: 6_000 });
		await waitFor(() =>
			expect(screen.getByTestId("t")).toHaveTextContent("1500"),
		);

		await act(async () => router.navigate("/probe?t=4200"));

		await waitFor(() =>
			expect(screen.getByTestId("t")).toHaveTextContent("4200"),
		);
		expect(search(router)).toBe("?t=4200");
		expect(router.state.historyAction).toBe("PUSH");
	});
});
