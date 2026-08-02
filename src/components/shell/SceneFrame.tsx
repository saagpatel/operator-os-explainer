import type { ReactNode } from "react";
import type { SceneConfig } from "../../types/scene.ts";
import { DeepPanel } from "./DeepPanel";

/**
 * Shared scene chrome: eyebrow, display title, layout slots, deep panel.
 * Every scene renders inside this frame so the console reads as one
 * instrument (SPEC 2.1).
 */
export function SceneFrame({
	config,
	children,
	deepPanelExtra,
}: {
	config: SceneConfig;
	children: ReactNode;
	deepPanelExtra?: ReactNode;
}) {
	const number = String(config.number).padStart(2, "0");
	return (
		<section className="relative mx-auto flex min-h-full w-full max-w-6xl flex-col px-4 py-8 sm:px-6">
			{/* decorative ghost numeral: pseudo-element content keeps it out of
			    the a11y tree and text-contrast analysis alike */}
			<span
				aria-hidden="true"
				data-number={number}
				className="pointer-events-none absolute right-4 top-2 select-none font-display text-[7rem] leading-none text-ink-deck-muted opacity-10 before:content-[attr(data-number)] sm:text-[9rem]"
			/>

			<header className="mb-6">
				<p className="font-instrument text-[11px] uppercase tracking-[0.22em] text-ink-deck-muted">
					Scene {number} · {config.subtitle}
				</p>
				{/* Fluid below `sm` so a long title breathes at 320 and still reads as
				    the deck's display voice; `sm:` and up is the desktop size. */}
				<h1 className="mt-1 break-words font-display text-[clamp(1.75rem,7vw,2.25rem)] text-ink-deck sm:text-5xl">
					{config.title}
				</h1>
			</header>

			<div className="flex-1">{children}</div>

			<DeepPanel title={config.deepPanel.title} body={config.deepPanel.body}>
				{deepPanelExtra}
			</DeepPanel>
		</section>
	);
}
