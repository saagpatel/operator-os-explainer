import "@testing-library/jest-dom/vitest";

// jsdom has no matchMedia; the reduced-motion gate and future hooks query it.
if (typeof window !== "undefined" && !window.matchMedia) {
	window.matchMedia = (query: string): MediaQueryList =>
		({
			matches: false,
			media: query,
			onchange: null,
			addEventListener: () => {},
			removeEventListener: () => {},
			addListener: () => {},
			removeListener: () => {},
			dispatchEvent: () => false,
		}) as MediaQueryList;
}
