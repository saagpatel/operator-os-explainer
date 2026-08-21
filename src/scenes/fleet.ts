import type { SceneConfig } from "../types/scene.ts";

const fleet: SceneConfig = {
	slug: "fleet",
	number: 1,
	lens: "fleet",
	title: "The Fleet",
	subtitle: "routing by gravity",
	hook: "Four systems, one rule: work flows to the system that owns it.",
	architectureClaims: ["gravity-based-routing"],
	eventKinds: ["dispatch", "activity"],
	tStart: 0,
	tEnd: 90_000,
	interaction: "taskChipRoute",
	deepPanel: {
		title: "the full routing table",
		body:
			"Gravity is the whole routing policy. Eight task classes each have one " +
			"owner, decided by what the work needs rather than by preference: a " +
			"live filesystem and test runner pulls work to Claude Code, raw " +
			"parallelism pulls sweeps to Codex, writing and dispatch stay with " +
			"Claude.ai, and scheduled read-only audits run as the night shift. " +
			"Models route by role, not by system: implementation defaults to a " +
			"Sonnet-tier model, architecture and auth escalate to Opus-tier, " +
			"read-only exploration starts Haiku-tier, and mechanical volume drops " +
			"to the cheap mechanical tier. The table is the contract; nothing is " +
			"routed by hand.",
	},
};

export default fleet;
