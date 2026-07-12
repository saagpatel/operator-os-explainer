import { useSessionClock } from "../clock/SessionClockProvider.tsx";
import { useAutoSeek } from "../clock/useAutoSeek.ts";
import { ProseCard } from "../components/shell/ProseCard";
import { SceneFrame } from "../components/shell/SceneFrame";
import { SCENES } from "./index.ts";

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

				<p className="mt-6 text-center font-instrument text-[11px] uppercase tracking-[0.2em] text-ink-deck-muted">
					Synthetic data · deterministic replay ·{" "}
					<span className="text-accent-deck">guards on</span>
				</p>
			</div>
		</SceneFrame>
	);
}
