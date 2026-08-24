import { useEffect, useRef } from "react";
import { useSearchParams } from "react-router";
import { useSessionClock } from "./SessionClockProvider.tsx";

/**
 * On route entry the clock auto-seeks to the scene's tStart unless a `?t=`
 * query param overrides it (DATA-MODEL §5), so deep links never open empty.
 * Runs once per scene mount; scrubbing afterwards is the reader's.
 */
export function useAutoSeek(tStart: number): void {
	const { duration, scrub } = useSessionClock();
	const [params] = useSearchParams();
	const rawTime = params.get("t");
	const applied = useRef<{ rawTime: string | null } | null>(null);
	useEffect(() => {
		if (applied.current?.rawTime === rawTime) return;
		applied.current = { rawTime };
		const parsed = rawTime?.trim() ? Number(rawTime) : Number.NaN;
		const isInSession =
			Number.isFinite(parsed) && parsed >= 0 && parsed <= duration;
		scrub(isInSession ? parsed : tStart);
	}, [duration, rawTime, scrub, tStart]);
}
