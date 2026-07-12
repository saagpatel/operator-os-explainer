import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import {
	SessionClockProvider,
	useSessionClock,
} from "./SessionClockProvider.tsx";

/** Probe scene: renders the cumulative event count at the current t. */
function Probe() {
	const clock = useSessionClock();
	return (
		<div>
			<span data-testid="count">{clock.eventsUpTo(clock.t).length}</span>
			<span data-testid="t">{clock.t}</span>
			<span data-testid="playing">{String(clock.playing)}</span>
			<button type="button" onClick={() => clock.scrub(0)}>
				seek0
			</button>
			<button type="button" onClick={() => clock.scrub(800)}>
				seek800
			</button>
			<button type="button" onClick={() => clock.scrub(5000)}>
				seek5000
			</button>
			<button type="button" onClick={() => clock.stepForward()}>
				step
			</button>
		</div>
	);
}

function renderProbe() {
	return render(
		<SessionClockProvider>
			<Probe />
		</SessionClockProvider>,
	);
}

describe("SessionClockProvider", () => {
	it("event counts change monotonically with t and rewind deterministically", () => {
		renderProbe();
		expect(screen.getByTestId("count").textContent).toBe("0");

		fireEvent.click(screen.getByText("seek800"));
		expect(screen.getByTestId("count").textContent).toBe("1");

		fireEvent.click(screen.getByText("seek5000"));
		expect(screen.getByTestId("count").textContent).toBe("7");

		// scrub back: injected past states drop, same t -> same count
		fireEvent.click(screen.getByText("seek800"));
		expect(screen.getByTestId("count").textContent).toBe("1");
		fireEvent.click(screen.getByText("seek0"));
		expect(screen.getByTestId("count").textContent).toBe("0");
	});

	it("step-to-event lands on the next boundary", () => {
		renderProbe();
		fireEvent.click(screen.getByText("step"));
		expect(screen.getByTestId("t").textContent).toBe("800");
		fireEvent.click(screen.getByText("step"));
		expect(screen.getByTestId("t").textContent).toBe("1500");
	});

	it("Space toggles play/pause from the keyboard", () => {
		renderProbe();
		expect(screen.getByTestId("playing").textContent).toBe("false");
		fireEvent.keyDown(window, { key: " " });
		expect(screen.getByTestId("playing").textContent).toBe("true");
		fireEvent.keyDown(window, { key: " " });
		expect(screen.getByTestId("playing").textContent).toBe("false");
	});

	it("Home/End seek the clock ends", () => {
		renderProbe();
		fireEvent.keyDown(window, { key: "End" });
		expect(screen.getByTestId("t").textContent).toBe("90000");
		expect(screen.getByTestId("count").textContent).toBe("46");
		fireEvent.keyDown(window, { key: "Home" });
		expect(screen.getByTestId("t").textContent).toBe("0");
	});
});
