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
			<a data-testid="link" href="#details">
				<span data-testid="link-child">link child</span>
			</a>
			<button data-testid="button" type="button">
				<span data-testid="button-child">button child</span>
			</button>
			<input data-testid="input" defaultValue="editable input" />
			<div
				contentEditable
				data-testid="contenteditable"
				suppressContentEditableWarning
			>
				<span data-testid="contenteditable-child">editable child</span>
			</div>
			<div data-testid="custom-control" role="slider" tabIndex={0}>
				<span data-testid="custom-control-child">custom control child</span>
			</div>
				<div>
					<span data-testid="non-interactive-child">page content</span>
				</div>
				<h1 data-testid="route-heading" tabIndex={-1}>
					Route heading
				</h1>
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

const transportKeys = [" ", "ArrowLeft", "ArrowRight", "Home", "End"] as const;

function dispatchCancelableKeyDown(target: Element, key: string) {
	const event = new KeyboardEvent("keydown", {
		key,
		bubbles: true,
		cancelable: true,
	});
	fireEvent(target, event);
	return event;
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

	describe.each([
		["link", "link"],
		["button", "button"],
		["input", "input"],
		["contenteditable region", "contenteditable"],
		["custom interactive control", "custom-control"],
	] as const)("interactive target: %s", (_label, testId) => {
		it.each(transportKeys)(
			"leaves %s to the focused control without preventing its default",
			(key) => {
				renderProbe();
				fireEvent.click(screen.getByText("seek800"));

				const target = screen.getByTestId(testId);
				target.focus();
				expect(document.activeElement).toBe(target);
				const event = dispatchCancelableKeyDown(target, key);

				expect(event.defaultPrevented).toBe(false);
				expect(screen.getByTestId("t").textContent).toBe("800");
				expect(screen.getByTestId("playing").textContent).toBe("false");
			},
		);
	});

	it.each([
		["link", "link-child"],
		["button", "button-child"],
		["contenteditable region", "contenteditable-child"],
		["custom interactive control", "custom-control-child"],
	] as const)(
		"applies the interactive guard to a %s descendant",
		(_label, testId) => {
			renderProbe();
			fireEvent.click(screen.getByText("seek800"));

			const event = dispatchCancelableKeyDown(
				screen.getByTestId(testId),
				"ArrowRight",
			);

			expect(event.defaultPrevented).toBe(false);
			expect(screen.getByTestId("t").textContent).toBe("800");
		},
	);

	it.each([
		[" ", "800", "true"],
		["ArrowLeft", "0", "false"],
		["ArrowRight", "1500", "false"],
		["Home", "0", "false"],
		["End", "90000", "false"],
	] as const)(
		"keeps the %s shortcut global on non-interactive page content",
		(key, expectedT, expectedPlaying) => {
			renderProbe();
			fireEvent.click(screen.getByText("seek800"));

			const event = dispatchCancelableKeyDown(
				screen.getByTestId("non-interactive-child"),
				key,
			);

			expect(event.defaultPrevented).toBe(true);
			expect(screen.getByTestId("t").textContent).toBe(expectedT);
			expect(screen.getByTestId("playing").textContent).toBe(expectedPlaying);
		},
	);

	it("keeps transport shortcuts global on a programmatically focused route heading", () => {
		renderProbe();
		const heading = screen.getByTestId("route-heading");
		heading.focus();
		expect(document.activeElement).toBe(heading);

		const event = dispatchCancelableKeyDown(heading, "End");

		expect(event.defaultPrevented).toBe(true);
		expect(screen.getByTestId("t").textContent).toBe("90000");
	});
});
