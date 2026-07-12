import type { SceneConfig } from "../types/scene.ts";

const coldOpen: SceneConfig = {
	slug: "",
	number: 0,
	lens: "cold-open",
	title: "Watch one task travel the whole OS",
	subtitle: "the cold open",
	hook: "ship the export pipeline for Corveth",
	eventKinds: [
		"dispatch",
		"handoff",
		"activity",
		"cost",
		"fanout",
		"guard",
		"verify",
		"ship",
	],
	tStart: 0,
	tEnd: 18_000,
	interaction: "none",
	deepPanel: {
		title: "how this console works",
		body:
			"Everything you just watched is a deterministic replay. One synthetic " +
			"session clock runs the whole console; every scene is a lens on the " +
			"same 90-second timeline, and the transport at the bottom scrubs all " +
			"of them in sync. The architecture shown is the real system. The data " +
			"is invented by construction: every name, number, and summary is " +
			"drawn from a closed, audited vocabulary, generated from a fixed " +
			"seed, and proven closed by a build-time test. The badge in the " +
			"corner is not decoration; it is the contract.",
	},
};

export default coldOpen;
