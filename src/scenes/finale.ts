import type { SceneConfig } from "../types/scene.ts";

const finale: SceneConfig = {
	slug: "finale",
	number: 4,
	lens: "finale",
	title: "The Fleet in Motion",
	subtitle: "one mission, end to end",
	hook: "One mission through the whole machine: fan out, converge, get blocked, adapt, verify, ship, sync.",
	eventKinds: [
		"fanout",
		"guard",
		"verify",
		"ship",
		"cost",
		"activity",
		"handoff",
	],
	tStart: 6_000,
	tEnd: 19_000,
	interaction: "missionRun",
	deepPanel: {
		title: "fan-out mechanics and the cost play",
		body:
			"This is a Tier 2 fan-out: the lead splits the mission into scoped " +
			"lanes, each subagent runs in an isolated worktree so no two writers " +
			"touch the same tree, and the lanes converge into one mission commit " +
			"rather than one commit per agent. The verify gate is allowed to say " +
			"no: attempt one bounced the commit back, the fix re-ran, attempt two " +
			"passed, and only then did the SHIPPED tag fire its sync obligation " +
			"to the external build log. Watch the ledger while it runs: the " +
			"mechanical lane finished its slice for one cent against twenty-six " +
			"cents of Sonnet reasoning. That asymmetry is the whole cost play: " +
			"spend the expensive tokens only where judgment lives.",
	},
};

export default finale;
