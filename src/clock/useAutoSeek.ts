import { useEffect, useRef } from "react";
import { useSearchParams } from "react-router-dom";
import { useSessionClock } from "./SessionClockProvider.tsx";

/**
 * On route entry the clock auto-seeks to the scene's tStart unless a `?t=`
 * query param overrides it (DATA-MODEL §5), so deep links never open empty.
 * Runs once per scene mount; scrubbing afterwards is the reader's.
 */
export function useAutoSeek(tStart: number): void {
	const { scrub } = useSessionClock();
	const [params] = useSearchParams();
	const done = useRef(false);
	useEffect(() => {
		if (done.current) return;
		done.current = true;
		const q = params.get("t");
		const parsed = q === null ? Number.NaN : Number(q);
		scrub(Number.isFinite(parsed) ? parsed : tStart);
	}, [params, scrub, tStart]);
}
