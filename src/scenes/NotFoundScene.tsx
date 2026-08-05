import { Link } from "react-router";

export function NotFoundScene() {
	return (
		<section className="mx-auto flex min-h-full w-full max-w-3xl items-center px-4 py-12 sm:px-6">
			<div className="border-l-2 border-accent-deck pl-6 sm:pl-8">
				<p className="font-instrument text-[11px] uppercase tracking-[0.22em] text-ink-deck-muted">
					Scene unavailable
				</p>
				<h1 className="mt-2 font-display text-4xl text-ink-deck sm:text-5xl">
					Scene not found
				</h1>
				<p className="mt-4 max-w-xl font-prose text-base leading-relaxed text-ink-deck-muted">
					That route is not part of this synthetic session. Return to the
					opening scene to restart the guided replay.
				</p>
				<Link
					to="/"
					className="mt-6 inline-flex min-h-11 items-center rounded-sm border border-deck-line px-4 py-2 font-instrument text-[11px] uppercase tracking-[0.16em] text-accent-deck hover:bg-deck-raised"
				>
					Return to opening
				</Link>
			</div>
		</section>
	);
}
