import type { ReactNode } from "react";

/**
 * Paper overlay card: the ONLY paper surface on the deck (SPEC 4.4).
 * Prose inside uses --ink / --ink-muted / --accent (paper-only tokens).
 */
export function ProseCard({
	children,
	label,
}: {
	children: ReactNode;
	label?: string;
}) {
	return (
		<div className="rounded-sm bg-paper p-5 shadow-[0_2px_24px_rgba(0,0,0,0.45)]">
			<div className="font-prose text-[16px] leading-relaxed text-ink [&_em]:italic">
				{children}
			</div>
			{label ? (
				<p className="mt-3 font-instrument text-[10px] uppercase tracking-[0.18em] text-ink-muted">
					{label}
				</p>
			) : null}
		</div>
	);
}
