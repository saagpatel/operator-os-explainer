import { useCallback } from "react";
import { useLocation, useNavigate } from "react-router";

/**
 * The write half of the `?t=` deep link that useAutoSeek reads (DATA-MODEL §5):
 * it makes the reader's transport position canonical and shareable.
 *
 * Three rules make it safe to call on every reader action:
 * - REPLACE, never push: scrubbing is looking around one page, not a trail of
 *   history entries the Back button has to unwind.
 * - The rest of the URL is carried through untouched — `?chips=`, `?rule=`, and
 *   any hash are other owners' state.
 * - An unchanged `t` writes nothing, so a repeated action (stepping back at 0)
 *   raises no navigation at all.
 *
 * Nothing here reads the clock, so playback frames and programmatic seeks
 * cannot reach the URL: only an explicit call can.
 */
export function useClockPermalink(): (t: number) => void {
	const navigate = useNavigate();
	const { pathname, search, hash } = useLocation();

	return useCallback(
		(t: number) => {
			const params = new URLSearchParams(search);
			const next = String(Math.round(t));
			if (params.get("t") === next) return;
			params.set("t", next);
			navigate({ pathname, search: `?${params}`, hash }, { replace: true });
		},
		[navigate, pathname, search, hash],
	);
}
