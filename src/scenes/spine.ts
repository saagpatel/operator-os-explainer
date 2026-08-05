import type { SceneConfig } from "../types/scene.ts";

const spine: SceneConfig = {
	slug: "spine",
	number: 2,
	lens: "spine",
	title: "The Spine",
	subtitle: "the shared nervous system",
	hook: "One store every system reads and writes. Nothing moves between systems except through it.",
	architectureClaims: ["bridge-sqlite-spine"],
	eventKinds: ["activity", "handoff", "cost"],
	tStart: 0,
	tEnd: 90_000,
	interaction: "handoffRun",
	deepPanel: {
		title: "the five row shapes",
		body:
			"The spine is a single SQLite store with full-text search, and these " +
			"are the only shapes that cross it: activity rows (session telemetry, " +
			"searchable), handoffs (work moving between systems, held like a " +
			"lease), snapshots (state saved on completion, read first on " +
			"takeover), cost records (spend piped from every system so the cost " +
			"play is measured, not assumed), and long-lived context sections. Two " +
			"tags are retention-protected: SHIPPED creates a downstream sync " +
			"obligation to the external build log, LEDGER is a durable record " +
			"with none. Every row you can inspect here is synthetic to the last " +
			"character.",
	},
};

export default spine;
