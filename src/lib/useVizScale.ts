import { useCallback, useMemo, useRef, useState } from "react";

/**
 * Rendered size below which a mono label stops being readable on a phone.
 * Everything here is in CSS pixels, not SVG user units: a 10-unit label in a
 * 960-unit viewBox rendered into a 325px container lands at 3.4 CSS px.
 */
export const MIN_LABEL_PX = 10;

/**
 * Phone breakpoint. Deliberately a VIEWPORT question, not a container one:
 * several scenes park a viz in a ~300px sidebar on desktop, and that sidebar
 * still wants the desktop composition.
 */
export const COMPACT_MAX_VIEWPORT = 640;

/** Any per-viz geometry object, so long as it carries the viewBox it belongs to. */
export interface VizVariant {
	viewBox: string;
}

export interface VizScale<T extends VizVariant> {
	/** Attach to the measured element (the <svg> or its wrapper). */
	ref: (el: Element | null) => void;
	compact: boolean;
	/** The geometry for the current width. */
	variant: T;
	/**
	 * Maps a designed label size (user units) to one that renders at least
	 * MIN_LABEL_PX. Identity on the wide variant, so the desktop composition is
	 * unchanged by construction rather than by inspection.
	 */
	fs: (designed: number) => number;
}

/** viewBox is "min-x min-y width height"; the width is what sets the scale. */
function viewBoxWidth(viewBox: string): number {
	return Number.parseFloat(viewBox.trim().split(/\s+/)[2] ?? "");
}

function prefersCompact(): boolean {
	if (typeof window === "undefined" || !window.matchMedia) return false;
	return window.matchMedia(`(max-width: ${COMPACT_MAX_VIEWPORT - 1}px)`).matches;
}

/**
 * Shared responsive scaling for the SVG viz. Each component declares a wide and
 * a compact geometry; this picks one and hands back a label scaler bound to the
 * measured render width.
 *
 * The width is read from a ResizeObserver, so it updates on resize and NEVER on
 * a clock tick: `fs` keeps a stable identity across frames and the scrub path
 * allocates nothing extra.
 */
export function useVizScale<T extends VizVariant>(
	variants: {
		wide: T;
		compact: T;
	},
	opts: {
		/**
		 * Container width in CSS px below which the compact variant is used even
		 * on a desktop viewport, for vizes whose wide labels would otherwise
		 * render under MIN_LABEL_PX in a narrow column. Off by default.
		 */
		minWideWidth?: number;
	} = {},
): VizScale<T> {
	const { minWideWidth } = opts;
	const [width, setWidth] = useState(0);
	const [compact, setCompact] = useState(prefersCompact);
	const observer = useRef<ResizeObserver | null>(null);

	const ref = useCallback(
		(el: Element | null) => {
			observer.current?.disconnect();
			observer.current = null;
			// jsdom implements neither; unmeasured falls through to the wide variant.
			if (!el || typeof ResizeObserver === "undefined") return;
			const ro = new ResizeObserver((entries) => {
				const measured = entries[0]?.contentRect.width ?? 0;
				setWidth(measured);
				setCompact(
					prefersCompact() ||
						(minWideWidth !== undefined && measured > 0 && measured < minWideWidth),
				);
			});
			ro.observe(el);
			observer.current = ro;
		},
		[minWideWidth],
	);

	const variant = compact ? variants.compact : variants.wide;

	const fs = useMemo(() => {
		const identity = (designed: number) => designed;
		if (!compact || width <= 0) return identity;
		const k = width / viewBoxWidth(variant.viewBox);
		if (!Number.isFinite(k) || k <= 0) return identity;
		const floor = MIN_LABEL_PX / k;
		return (designed: number) => (designed < floor ? floor : designed);
	}, [compact, width, variant.viewBox]);

	return { ref, compact, variant, fs };
}
