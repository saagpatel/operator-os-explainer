/**
 * The synthetic session clock (SPEC 2.2, 4.3): ONE global rAF loop hoisted
 * above the router outlet so scrubbing and scene switches read shared state
 * instead of remounting the loop. Every scene is a lens on this clock.
 *
 * Reduced motion (SPEC 2.5): the rAF loop is gated in JS. Under reduced
 * motion nothing ever AUTO-plays; an explicit reader-initiated Play still
 * works (WCAG allows user-initiated motion behind a visible pause control),
 * and the scrubber/step controls always work.
 */
import {
	createContext,
	type ReactNode,
	type RefObject,
	useCallback,
	useContext,
	useEffect,
	useMemo,
	useRef,
	useState,
} from "react";
import { dataset } from "../data/dataset.ts";
import {
	eventBoundaries,
	eventsOfKind,
	eventsUpTo,
	missionEvents,
	nextBoundary,
	prevBoundary,
} from "../lib/selectors.ts";
import type { Dataset, SyntheticEvent } from "../types/data.ts";

export type Speed = 1 | 1.5 | 2;

export interface SessionClock {
	t: number;
	/** Mutable per-frame value for Canvas rAF readers (SPEC 4.1: refs, not setState). */
	tRef: RefObject<number>;
	duration: number;
	playing: boolean;
	speed: Speed;
	reducedMotion: boolean;
	motionOverride: boolean | null;
	dataset: Dataset;
	play: () => void;
	pause: () => void;
	toggle: () => void;
	/** Programmatic clock move (auto-seek, scene defaults): leaves the URL alone. */
	scrub: (t: number) => void;
	/**
	 * Reader-initiated positioning. Identical to `scrub` on the clock, but it
	 * also reports the landing position to `onReaderSeek` so a router-aware
	 * owner can make it the canonical, shareable position (SPEC 4.6).
	 */
	seek: (t: number) => void;
	setSpeed: (s: Speed) => void;
	stepBack: () => void;
	stepForward: () => void;
	setMotionOverride: (v: boolean | null) => void;
	eventsUpTo: (t: number) => SyntheticEvent[];
	eventsOfKind: <K extends SyntheticEvent["kind"]>(
		kind: K,
		t: number,
	) => Extract<SyntheticEvent, { kind: K }>[];
	missionEvents: (missionId: number, t: number) => SyntheticEvent[];
}

const SessionClockContext = createContext<SessionClock | null>(null);

const INTERACTIVE_SHORTCUT_TARGET_SELECTOR = [
	"a[href]",
	"button",
	"input",
	"select",
	"textarea",
	"summary",
	"audio[controls]",
	"video[controls]",
	'[contenteditable]:not([contenteditable="false"])',
	'[tabindex]:not([tabindex="-1"])',
].join(",");

export function isInteractiveShortcutTarget(target: EventTarget | null): boolean {
	return (
		target instanceof Element &&
		target.closest(INTERACTIVE_SHORTCUT_TARGET_SELECTOR) !== null
	);
}

export interface SessionClockProviderProps {
	children: ReactNode;
	/**
	 * Called with the landing position of every READER-initiated move — the
	 * scrubber, the step buttons, the positioning shortcuts — and never for
	 * playback frames or programmatic `scrub`. The clock stays router-agnostic;
	 * the owner decides that this position belongs in the URL.
	 */
	onReaderSeek?: (t: number) => void;
}

export function SessionClockProvider({
	children,
	onReaderSeek,
}: SessionClockProviderProps) {
	const duration = dataset.meta.sessionLengthMs;
	const [t, setT] = useState(0);
	const tRef = useRef(0);
	const [playing, setPlaying] = useState(false);
	const [speed, setSpeed] = useState<Speed>(1);

	// ---- reduced motion: OS preference AND in-UI override (SPEC 2.5) ----
	const [systemReduced, setSystemReduced] = useState(
		() => window.matchMedia("(prefers-reduced-motion: reduce)").matches,
	);
	const [motionOverride, setMotionOverride] = useState<boolean | null>(null);
	useEffect(() => {
		const mql = window.matchMedia("(prefers-reduced-motion: reduce)");
		const onChange = () => setSystemReduced(mql.matches);
		mql.addEventListener("change", onChange);
		return () => mql.removeEventListener("change", onChange);
	}, []);
	const reducedMotion = motionOverride ?? systemReduced;
	useEffect(() => {
		document.documentElement.dataset.reducedMotion = reducedMotion
			? "true"
			: "false";
	}, [reducedMotion]);

	// ---- the single global rAF loop (StrictMode-idempotent via cleanup) ----
	useEffect(() => {
		if (!playing) return;
		let raf = 0;
		let last: number | null = null;
		const tick = (now: number) => {
			if (last !== null) {
				const next = Math.min(duration, tRef.current + (now - last) * speed);
				tRef.current = next;
				setT(next);
				if (next >= duration) {
					setPlaying(false);
					return;
				}
			}
			last = now;
			raf = requestAnimationFrame(tick);
		};
		raf = requestAnimationFrame(tick);
		return () => cancelAnimationFrame(raf);
	}, [playing, speed, duration]);

	// Latest-ref so `seek` (and everything built on it) keeps a stable identity:
	// the keydown listener and the context value must not churn when the owner's
	// callback closes over a new location.
	const readerSeekRef = useRef(onReaderSeek);
	useEffect(() => {
		readerSeekRef.current = onReaderSeek;
	});

	const applyPosition = useCallback(
		(next: number) => {
			const clamped = Math.min(duration, Math.max(0, next));
			tRef.current = clamped;
			setT(clamped);
			return clamped;
		},
		[duration],
	);
	const scrub = useCallback(
		(next: number) => {
			applyPosition(next);
		},
		[applyPosition],
	);
	const seek = useCallback(
		(next: number) => {
			const clamped = applyPosition(next);
			readerSeekRef.current?.(clamped);
		},
		[applyPosition],
	);
	const play = useCallback(() => setPlaying(true), []);
	const pause = useCallback(() => setPlaying(false), []);
	const toggle = useCallback(() => setPlaying((p) => !p), []);

	const boundaries = useMemo(() => eventBoundaries(dataset.events), []);
	const stepBack = useCallback(
		() => seek(prevBoundary(boundaries, tRef.current)),
		[boundaries, seek],
	);
	const stepForward = useCallback(
		() => seek(nextBoundary(boundaries, tRef.current, duration)),
		[boundaries, seek, duration],
	);

	// ---- keyboard transport (SPEC 4.6): Space, arrows, Home/End ----
	useEffect(() => {
		const onKey = (e: KeyboardEvent) => {
			if (isInteractiveShortcutTarget(e.target)) return;
			switch (e.key) {
				case " ":
					e.preventDefault();
					toggle();
					break;
				case "ArrowLeft":
					e.preventDefault();
					stepBack();
					break;
				case "ArrowRight":
					e.preventDefault();
					stepForward();
					break;
				case "Home":
					e.preventDefault();
					seek(0);
					break;
				case "End":
					e.preventDefault();
					seek(duration);
					break;
			}
		};
		window.addEventListener("keydown", onKey);
		return () => window.removeEventListener("keydown", onKey);
	}, [toggle, stepBack, stepForward, seek, duration]);

	const value = useMemo<SessionClock>(
		() => ({
			t,
			tRef,
			duration,
			playing,
			speed,
			reducedMotion,
			motionOverride,
			dataset,
			play,
			pause,
			toggle,
			scrub,
			seek,
			setSpeed,
			stepBack,
			stepForward,
			setMotionOverride,
			eventsUpTo: (at) => eventsUpTo(dataset.events, at),
			eventsOfKind: (kind, at) => eventsOfKind(dataset.events, kind, at),
			missionEvents: (missionId, at) =>
				missionEvents(dataset.events, missionId, at),
		}),
		[
			t,
			duration,
			playing,
			speed,
			reducedMotion,
			motionOverride,
			play,
			pause,
			toggle,
			scrub,
			seek,
			stepBack,
			stepForward,
		],
	);

	return (
		<SessionClockContext.Provider value={value}>
			{children}
		</SessionClockContext.Provider>
	);
}

export function useSessionClock(): SessionClock {
	const clock = useContext(SessionClockContext);
	if (!clock)
		throw new Error("useSessionClock must be used inside SessionClockProvider");
	return clock;
}
