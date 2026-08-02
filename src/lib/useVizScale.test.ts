import { act, renderHook } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { MIN_LABEL_PX, useVizScale } from "./useVizScale";

interface Geometry {
	viewBox: string;
	r: number;
}
const WIDE: Geometry = { viewBox: "0 0 960 560", r: 48 };
const COMPACT: Geometry = { viewBox: "0 0 340 480", r: 32 };

/** Drives the observer callback by hand so width is deterministic. */
function installResizeObserver() {
	let emit: ((width: number) => void) | null = null;
	class FakeResizeObserver {
		constructor(cb: ResizeObserverCallback) {
			emit = (width) =>
				cb(
					[{ contentRect: { width } } as ResizeObserverEntry],
					this as unknown as ResizeObserver,
				);
		}
		observe() {}
		disconnect() {}
		unobserve() {}
	}
	vi.stubGlobal("ResizeObserver", FakeResizeObserver);
	return {
		resizeTo: (width: number) => act(() => emit?.(width)),
	};
}

function setViewport(matches: boolean) {
	vi.stubGlobal("matchMedia", (query: string) => ({
		matches,
		media: query,
		addEventListener: () => {},
		removeEventListener: () => {},
	}));
}

afterEach(() => {
	vi.unstubAllGlobals();
});

describe("useVizScale", () => {
	it("keeps the wide variant and untouched label sizes above the breakpoint", () => {
		setViewport(false);
		const { resizeTo } = installResizeObserver();
		const { result } = renderHook(() =>
			useVizScale({ wide: WIDE, compact: COMPACT }),
		);
		act(() => result.current.ref(document.createElement("div")));
		resizeTo(744);

		expect(result.current.compact).toBe(false);
		expect(result.current.variant).toBe(WIDE);
		// The desktop no-regression guarantee: fs is identity, so the rendered
		// SVG is byte-for-byte what it was before the responsive pass.
		for (const designed of [8, 8.5, 9.5, 10, 10.5, 11, 13]) {
			expect(result.current.fs(designed)).toBe(designed);
		}
	});

	it("switches to the compact variant and floors labels to MIN_LABEL_PX", () => {
		setViewport(true);
		const { resizeTo } = installResizeObserver();
		const { result } = renderHook(() =>
			useVizScale({ wide: WIDE, compact: COMPACT }),
		);
		act(() => result.current.ref(document.createElement("div")));
		resizeTo(325);

		expect(result.current.compact).toBe(true);
		expect(result.current.variant).toBe(COMPACT);

		const k = 325 / 340;
		const floor = MIN_LABEL_PX / k;
		// Anything that would render under 10 CSS px is lifted to exactly 10.
		expect(result.current.fs(8) * k).toBeCloseTo(MIN_LABEL_PX, 5);
		expect(result.current.fs(8)).toBeCloseTo(floor, 5);
		// Anything already large enough is left alone.
		expect(result.current.fs(24)).toBe(24);
	});

	it("falls back to the wide variant while the width is unmeasured", () => {
		setViewport(true);
		installResizeObserver();
		const { result } = renderHook(() =>
			useVizScale({ wide: WIDE, compact: COMPACT }),
		);
		// No resize reported yet: the floor cannot be computed, so labels keep
		// their designed sizes instead of jumping to an arbitrary value.
		expect(result.current.fs(9)).toBe(9);
	});
});
