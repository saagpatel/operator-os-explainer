import type { SceneConfig } from "../types/scene.ts";

const coda: SceneConfig = {
	slug: "coda",
	number: 6,
	lens: "coda",
	title: "Coda",
	subtitle: "what this is, and why it is rare",
	hook: "Real practice, made legible.",
	architectureClaims: [
		"deterministic-synthetic-replay",
		"public-release-closure",
	],
	eventKinds: [],
	tStart: 90_000,
	tEnd: 90_000,
	interaction: "none",
	deepPanel: {
		title: "the guarantee, mechanically",
		body:
			"Six mechanisms, and the load-bearing one is closure, not scanning. " +
			"The app has zero live wiring: it imports one committed JSON artifact " +
			"and nothing else. Every identity-bearing field is typed to a closed, " +
			"audited vocabulary, so the generator can only emit members. No " +
			"model-authored free text ships: summaries are templates over closed " +
			"word lists and numbers are hand-set. A build-time closure test " +
			"asserts every emitted value is a member of its field's allowlist, " +
			"and a property test holds that closed across sampled seeds. A " +
			"pattern scanner backstops the allowlists themselves over source, " +
			"dataset, and bundle, with source maps disabled. And the repo " +
			"publishes from a clean branch under a neutral identity, because a " +
			"clean working tree is not a clean history.",
	},
};

export default coda;
