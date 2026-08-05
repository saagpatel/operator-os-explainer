import { Link } from "react-router";
import { useSessionClock } from "../clock/SessionClockProvider.tsx";
import { useAutoSeek } from "../clock/useAutoSeek.ts";
import { ProseCard } from "../components/shell/ProseCard";
import { SceneFrame } from "../components/shell/SceneFrame";
import { SCENES } from "./index.ts";

const PROOF_LINKS = [
	{
		href: "https://saagarpatel.dev/receipts",
		label: "Receipts room",
		detail: "Read the public gate results, corrections, and verification records.",
	},
	{
		href: "https://saagarpatel.dev/instruments",
		label: "Instruments room",
		detail: "Inspect the graders, packages, and exhibits behind the workshop.",
	},
	{
		href: "https://saagarpatel.dev/writing/who-audits-the-auditor",
		label: "Who audits the auditor?",
		detail: "Follow one cited explanation of how the proof chain is checked.",
	},
] as const;

/**
 * Scene 6: the coda. The one deliberately paper-calm moment on the deck:
 * the claim, then the honesty note, then the point. No timeline.
 */
export function CodaScene() {
	const config = SCENES.coda;
	useSessionClock(); // keeps the shell transport coherent on this route
	useAutoSeek(config.tStart);

	return (
		<SceneFrame config={config}>
			<div className="mx-auto max-w-2xl">
				<ProseCard label="coda · the honest ending">
					<p>
						Almost nobody runs a personal multi-agent operator OS at this depth:
						four cooperating systems routed by gravity, a shared spine they all
						read and write, an autonomous night shift, seven independent guard
						layers, and an airlock on everything outbound. What you just toured
						is a faithful map of a real one, drawn scene by scene at the level
						the architecture actually works.
					</p>
					<p className="mt-3">
						And every number on the way was invented. The architecture is real;
						the data is synthetic <em>by construction</em>, not by redaction.
						Every project name, summary, and dollar figure is drawn from a
						closed, audited vocabulary. A fixed seed makes the replay
						deterministic. A build-time closure test fails the build if a single
						value escapes its allowlist, and a pattern scanner sweeps the
						source, the dataset, and the shipped bundle behind it. The full
						mechanics are one click down, in the drawer below.
					</p>
					<p className="mt-3">
						That is the point of this console. The fleet ships real work every
						day; what you watched is how it stays legible, safe, and honest
						while doing it. Real practice, not a demo.
					</p>
				</ProseCard>

				<section
					className="mt-6 border-t border-deck-line pt-5"
					aria-labelledby="proof-workshop-heading"
				>
					<h2
						id="proof-workshop-heading"
						className="font-instrument text-[11px] uppercase tracking-[0.2em] text-accent-deck"
					>
						Continue into the proof workshop
					</h2>
					<p className="mt-2 text-sm leading-relaxed text-ink-deck-muted">
						These links open real public artifacts in a new tab, so this
						synthetic tour stays here. Nothing is fetched until you choose one.
					</p>

					<ul className="mt-4 grid gap-3 sm:grid-cols-3">
						{PROOF_LINKS.map((proof) => (
							<li key={proof.href} className="border border-deck-line bg-deck-raised p-3">
								<a
									href={proof.href}
									target="_blank"
									rel="noopener noreferrer"
									className="inline-flex min-h-11 w-full items-center font-instrument text-[11px] uppercase tracking-[0.14em] text-accent-deck hover:text-ink-deck sm:min-h-0"
								>
									{proof.label} · opens in a new tab
								</a>
								<p className="mt-1 text-xs leading-relaxed text-ink-deck-muted">
									{proof.detail}
								</p>
							</li>
						))}
					</ul>

					<div className="mt-4 flex justify-center">
						<Link
							to="/"
							className="inline-flex min-h-11 items-center px-3 font-instrument text-[11px] uppercase tracking-[0.16em] text-ink-deck-muted hover:text-accent-deck sm:min-h-0"
						>
							Replay from the opening
						</Link>
					</div>
				</section>

				<p className="mt-6 text-center font-instrument text-[11px] uppercase tracking-[0.2em] text-ink-deck-muted">
					Synthetic data · deterministic replay ·{" "}
					<span className="text-accent-deck">guards on</span>
				</p>
			</div>
		</SceneFrame>
	);
}
