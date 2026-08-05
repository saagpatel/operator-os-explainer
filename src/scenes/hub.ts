import type { SceneConfig } from "../types/scene.ts";

const hub: SceneConfig = {
	slug: "hub",
	number: 5,
	lens: "hub",
	title: "The Hub",
	subtitle: "the airlock",
	hook: "Outbound never goes straight out. Draft, approval, token, send window: an airlock, not a door.",
	architectureClaims: ["approval-airlock", "freshness-gated-alerts"],
	eventKinds: ["hubflow", "freshness"],
	tStart: 0,
	tEnd: 90_000,
	interaction: "airlockStep",
	deepPanel: {
		title: "hub-and-spoke, and why alerts stay honest",
		body:
			"The hub is a local control plane over the operator's work surface: " +
			"mail, reviews, approvals, worklists, calendar. It never calls " +
			"external services directly; every producer keeps its own store as " +
			"the system of record and the hub reads it through an adapter with a " +
			"freshness state machine. That machine is why the rail matters: " +
			"alerts fire only from fresh data, so an aging or stale spoke goes " +
			"quiet instead of lying. And every outbound action crosses the " +
			"airlock: a draft artifact, an approval raised for review, an " +
			"operator-minted confirmation token, and a timed send window. The " +
			"agent can prepare everything; it can release nothing on its own.",
	},
};

export default hub;
