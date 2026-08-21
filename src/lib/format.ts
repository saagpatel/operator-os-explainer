/** Formats a session-clock offset in ms as MM:SS.mmm (e.g. 4500 -> "00:04.500"). */
export function formatClock(ms: number): string {
	const clamped = Math.max(0, Math.round(ms));
	const minutes = Math.floor(clamped / 60_000);
	const seconds = Math.floor((clamped % 60_000) / 1_000);
	const millis = clamped % 1_000;
	return `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}.${String(millis).padStart(3, "0")}`;
}
