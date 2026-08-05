/**
 * The SceneConfig + VizProps + Interaction contract (prep/scene-contract.ts).
 * The shared primitive every scene reuses; changing it means updating all
 * scene configs in one commit (the S&N house rule).
 */
import type { Dataset, SyntheticEvent } from "./data.ts";
import type { ArchitectureClaimId } from "./architecture.ts";

export type Lens =
	| "cold-open"
	| "fleet"
	| "spine"
	| "safety"
	| "finale"
	| "hub"
	| "coda";

// Per-scene interaction state. `kind:'none'` for the coda.
export type Interaction =
	| { kind: "taskChipRoute"; selectedTaskClass: string | null } // Scene 1
	| { kind: "handoffRun"; stageIndex: number } // Scene 2 (0..4 over the 5 stages)
	| { kind: "guardTrigger"; selectedRule: string | null } // Scene 3
	| { kind: "missionRun"; playing: boolean } // Scene 4
	| { kind: "airlockStep"; stageIndex: number } // Scene 5 (0..2)
	| { kind: "none" }; // Scene 0, Coda

export interface SceneConfig {
	slug: string; // route path w/o leading slash ('' = cold open at '/')
	number: number; // 0..6
	lens: Lens;
	title: string;
	subtitle: string;
	hook: string; // one-line framing shown on the overlay card
	architectureClaims: readonly ArchitectureClaimId[]; // provenance IDs in PublicArchitectureManifestV1
	eventKinds: readonly SyntheticEvent["kind"][]; // streams this scene reads (DATA-MODEL §5)
	tStart: number; // clock auto-seeks here on route entry (unless ?t= overrides)
	tEnd: number;
	interaction: Interaction["kind"];
	deepPanel: { title: string; body: string }; // practitioner "go deeper" drawer. UI COPY (hand-authored),
	// NOT part of the guarantee-scoped synthetic dataset.
}

// Every viz component is a PURE function of these props (SPEC 4.3). No component owns domain logic.
export interface VizProps {
	events: SyntheticEvent[]; // PRE-FILTERED by the clock context to this scene's kinds AND at<=t
	t: number; // current clock ms
	interaction: Interaction; // this scene's local interaction state (owned by the scene, React state)
	reducedMotion: boolean; // from matchMedia + in-UI toggle; cuts instead of glides, no particles
	dataset: Dataset; // for entity lookups by id (activity/handoff/snapshot/section/sessionCost)
}
