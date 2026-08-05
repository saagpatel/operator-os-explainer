import type { SceneConfig } from "../types/scene.ts";

const safety: SceneConfig = {
	slug: "safety",
	number: 3,
	lens: "safety",
	title: "The Safety Layers",
	subtitle: "guards fire, agent adapts",
	hook: "The system runs autonomously because it is wrapped in independent, overlapping guards.",
	architectureClaims: ["layered-operation-guards"],
	eventKinds: ["guard"],
	tStart: 0,
	tEnd: 90_000,
	interaction: "guardTrigger",
	deepPanel: {
		title: "seven independent layers",
		body:
			"Each layer works alone, so no single failure unlocks the system: an " +
			"intent level is chosen before any work runs, a deny-list screens " +
			"known-bad patterns, deterministic hooks fire before every tool call, " +
			"a hard floor of rules holds regardless of instruction, a confidence " +
			"gate turns uncertainty into a question for the operator, a verify " +
			"gate refuses to call unproven work done, and an integrity floor " +
			"checks that the guards themselves are present and untampered. The " +
			"design philosophy is the through-line of this whole console: a " +
			"blocked action is a signal to adapt, not a wall to fight.",
	},
};

export default safety;
