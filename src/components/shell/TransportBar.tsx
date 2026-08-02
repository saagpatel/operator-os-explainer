import { Pause, Play, SkipBack, SkipForward } from "lucide-react";
import type { Speed } from "../../clock/SessionClockProvider.tsx";
import { formatClock } from "../../lib/format";

export interface TransportBarProps {
	t: number;
	duration: number;
	playing: boolean;
	speed: Speed;
	onPlayPause: () => void;
	onScrub: (t: number) => void;
	onSpeedChange: (speed: Speed) => void;
	onStepBack: () => void;
	onStepForward: () => void;
}

const SPEEDS: readonly Speed[] = [1, 1.5, 2];

/**
 * The global transport. The Play/Pause control is ALWAYS visible (WCAG SC
 * 2.2.2): the bar is a fixed region of the console shell on every scene.
 */
export function TransportBar({
	t,
	duration,
	playing,
	speed,
	onPlayPause,
	onScrub,
	onSpeedChange,
	onStepBack,
	onStepForward,
}: TransportBarProps) {
	return (
		<div className="flex flex-wrap items-center gap-x-4 gap-y-2 border-t border-deck-line bg-deck-raised px-4 py-2.5 sm:flex-nowrap sm:gap-y-0 sm:px-6">
			<div className="flex items-center gap-1">
				<button
					type="button"
					onClick={onPlayPause}
					aria-label={playing ? "Pause" : "Play"}
					className="flex h-11 w-11 items-center justify-center rounded-sm border border-deck-line text-accent-deck hover:bg-deck sm:h-8 sm:w-8"
				>
					{playing ? (
						<Pause size={14} strokeWidth={2} aria-hidden="true" />
					) : (
						<Play size={14} strokeWidth={2} aria-hidden="true" />
					)}
				</button>
				<button
					type="button"
					onClick={onStepBack}
					aria-label="Step to previous event"
					className="flex h-11 w-11 items-center justify-center rounded-sm text-ink-deck-muted hover:text-ink-deck sm:h-8 sm:w-7"
				>
					<SkipBack size={13} strokeWidth={2} aria-hidden="true" />
				</button>
				<button
					type="button"
					onClick={onStepForward}
					aria-label="Step to next event"
					className="flex h-11 w-11 items-center justify-center rounded-sm text-ink-deck-muted hover:text-ink-deck sm:h-8 sm:w-7"
				>
					<SkipForward size={13} strokeWidth={2} aria-hidden="true" />
				</button>
			</div>

			<span className="hidden select-none font-instrument text-[11px] tabular-nums text-ink-deck-muted sm:inline">
				T+<span className="text-ink-deck">{formatClock(t)}</span> /{" "}
				{formatClock(duration)}
			</span>

			<input
				type="range"
				className="transport-scrub order-last min-w-0 flex-1 basis-full sm:order-none sm:basis-0"
				min={0}
				max={duration}
				step={100}
				value={t}
				onChange={(e) => onScrub(Number(e.target.value))}
				aria-label="Session clock scrubber"
				aria-valuetext={`T plus ${formatClock(t)}`}
			/>

			<div
				className="ml-auto flex items-center gap-0.5 sm:ml-0"
				role="group"
				aria-label="Playback speed"
			>
				{SPEEDS.map((s) => (
					<button
						key={s}
						type="button"
						onClick={() => onSpeedChange(s)}
						aria-pressed={speed === s}
						className={`flex h-11 w-11 items-center justify-center rounded-sm font-instrument text-[10px] sm:h-auto sm:w-auto sm:px-1.5 sm:py-1 ${
							speed === s
								? "text-accent-deck"
								: "text-ink-deck-muted hover:text-ink-deck"
						}`}
					>
						{s}x
					</button>
				))}
			</div>
		</div>
	);
}
