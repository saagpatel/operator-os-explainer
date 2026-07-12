/**
 * Persistent, quiet SYNTHETIC DATA badge (SPEC 2.2): no viewer should ever
 * mistake the feed for real telemetry. Lives in the chrome on every scene.
 */
export function SyntheticBadge() {
	return (
		<span
			className="inline-flex items-center gap-2 rounded-sm border border-deck-line bg-deck-raised px-2.5 py-1 font-instrument text-[10px] uppercase tracking-[0.2em] text-ink-deck-muted"
			title="Every value on this console is generated from a closed, audited vocabulary. Nothing here is real telemetry."
		>
			<span
				className="inline-block h-1.5 w-1.5 rounded-full bg-accent-deck"
				aria-hidden="true"
			/>
			Synthetic data
		</span>
	);
}
