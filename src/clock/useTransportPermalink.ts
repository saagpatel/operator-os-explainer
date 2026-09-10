import { useCallback, useEffect } from "react";
import { useLocation, useNavigate } from "react-router";
import {
	isInteractiveShortcutTarget,
	useSessionClock,
} from "./SessionClockProvider.tsx";

const POSITIONING_KEYS = new Set(["ArrowLeft", "ArrowRight", "Home", "End"]);

function searchWithClockT(search: string, tMs: number): string | null {
	const nextT = String(Math.round(tMs));
	const params = new URLSearchParams(search);
	if (params.get("t") === nextT) return null;
	params.set("t", nextT);
	const query = params.toString();
	return query ? `?${query}` : "";
}

/**
 * Reader-initiated transport writes `?t=` onto the current route. Programmatic
 * seeks (auto-seek, playback, scene interactions) keep using SessionClock.scrub
 * and must not go through this hook.
 */
export function useTransportPermalink(): {
	scrub: (t: number) => void;
	stepBack: () => void;
	stepForward: () => void;
} {
	const { scrub, stepBack, stepForward, tRef } = useSessionClock();
	const location = useLocation();
	const navigate = useNavigate();

	const replaceClockParam = useCallback(
		(tMs: number) => {
			const search = searchWithClockT(location.search, tMs);
			if (search === null) return;
			navigate(
				{
					pathname: location.pathname,
					search,
					hash: location.hash,
				},
				{
					replace: true,
					preventScrollReset: true,
					state: location.state,
				},
			);
		},
		[location.hash, location.pathname, location.search, location.state, navigate],
	);

	const onScrub = useCallback(
		(t: number) => {
			scrub(t);
			replaceClockParam(t);
		},
		[replaceClockParam, scrub],
	);
	const onStepBack = useCallback(() => {
		stepBack();
		replaceClockParam(tRef.current);
	}, [replaceClockParam, stepBack, tRef]);
	const onStepForward = useCallback(() => {
		stepForward();
		replaceClockParam(tRef.current);
	}, [replaceClockParam, stepForward, tRef]);

	useEffect(() => {
		const onKey = (event: KeyboardEvent) => {
			if (isInteractiveShortcutTarget(event.target)) return;
			if (!POSITIONING_KEYS.has(event.key)) return;
			queueMicrotask(() => replaceClockParam(tRef.current));
		};
		window.addEventListener("keydown", onKey);
		return () => window.removeEventListener("keydown", onKey);
	}, [replaceClockParam, tRef]);

	return {
		scrub: onScrub,
		stepBack: onStepBack,
		stepForward: onStepForward,
	};
}
