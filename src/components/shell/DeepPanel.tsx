import { type ReactNode, useId, useState } from "react";

/**
 * The "go deeper" drawer (layered-depth decision, SPEC 0.1): an accessible
 * surface for everyone, practitioner depth one click away. Inline drawer,
 * keyboard-operable, cuts (no glide) under reduced motion via the global
 * CSS gate.
 */
export function DeepPanel({
	title,
	body,
	children,
	figures,
}: {
	title: string;
	body: string;
	children?: ReactNode;
	/** Full-width mechanism figures, stacked under the prose and the extra. */
	figures?: ReactNode;
}) {
	const [open, setOpen] = useState(false);
	const regionId = useId();
	const labelId = useId();

	return (
		<div className="mt-8 border-t border-deck-line pt-1">
			<button
				type="button"
				onClick={() => setOpen((o) => !o)}
				aria-expanded={open}
				aria-controls={regionId}
				className="flex min-h-11 w-full items-center justify-between py-3 font-instrument text-[11px] uppercase tracking-[0.2em] text-ink-deck-muted hover:text-ink-deck"
			>
				<span id={labelId}>
					Go deeper <span className="text-accent-deck">·</span> {title}
				</span>
				<span aria-hidden="true">{open ? "−" : "+"}</span>
			</button>
			{open ? (
				<div id={regionId} role="region" aria-labelledby={labelId} className="pb-6 pt-1">
					<div className="grid gap-6 lg:grid-cols-[minmax(0,42ch)_1fr]">
						<p className="font-prose text-[15px] leading-relaxed text-ink-deck">
							{body}
						</p>
						{children ? <div>{children}</div> : null}
					</div>
					{figures ? (
						<div className="mt-10 grid gap-12 border-t border-deck-line pt-8">{figures}</div>
					) : null}
				</div>
			) : null}
		</div>
	);
}
