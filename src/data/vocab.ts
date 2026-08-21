/**
 * The closed vocabularies (SPEC 3.3 mechanism 2). Every identity-bearing
 * value in the shipped dataset is a member of one of these audited sets;
 * the generator can only emit members, and src/data/closure.ts proves it.
 * Extend only by adding members. NEVER open a field to free text.
 */
import type { FleetNode } from "../types/data.ts";

/**
 * Frozen codename pool (prep/codenames.md, audited 2026-07-11 against
 * npm / PyPI / crates.io / GitHub for real-product collisions).
 * Hero mission codename: Corveth.
 */
export const CODENAMES = [
	"Corveth",
	"Elstra",
	"Faltrin",
	"Grevan",
	"Halvane",
	"Jorvel",
	"Kestrine",
	"Lorvath",
	"Nevrell",
	"Oquist",
	"Pelloran",
	"Quorven",
	"Rhessin",
	"Tavrin",
	"Ulcaster",
	"Vandrel",
	"Brindal",
	"Thessom",
	"Belweather",
	"Dwennon",
	"Ferrun",
	"Gomarr",
	"Ilvane",
	"Josker",
] as const;
export type Codename = (typeof CODENAMES)[number];

/** slug rule (prep/codenames.md): lowercase only, used for branches/paths. */
export function slug(name: Codename): string {
	return name.toLowerCase();
}

export const TASK_CLASSES = [
	"feature",
	"bugfix",
	"sweep",
	"depbump",
	"ci-fix",
	"essay",
	"handoff",
	"audit",
] as const;
export const PHASES = [
	"scope",
	"scaffold",
	"implement",
	"verify",
	"ship",
] as const;
export const GUARD_LAYERS = [
	"permission-mode",
	"deny-list",
	"pretooluse-hook",
	"hard-deny",
	"confidence-gate",
	"verify-gate",
	"integrity-floor",
] as const;
export const RULE_CONCEPTS = [
	"push-to-main",
	"credential-read",
	"non-local-db-write",
	"harness-self-mutate",
	"deep-home-delete",
	"unverified-complete",
] as const;
export const ADAPTATIONS = [
	"rerouted",
	"reworded",
	"escalated-to-operator",
	"opened-a-branch",
	"ran-verify-first",
] as const;
export const SPOKES = [
	"bridge",
	"event-bus",
	"overlay",
	"auditor",
	"evals-ledger",
] as const;

export type Phase = (typeof PHASES)[number];
export type TaskClass = (typeof TASK_CLASSES)[number];
export type GuardLayer = (typeof GUARD_LAYERS)[number];
export type RuleConcept = (typeof RULE_CONCEPTS)[number];
export type Adaptation = (typeof ADAPTATIONS)[number];
export type Spoke = (typeof SPOKES)[number];

// ---- Derived maps the scenes need (also closed) ----
export const ROUTING: Record<TaskClass, FleetNode> = {
	feature: "cc",
	bugfix: "cc",
	sweep: "codex",
	depbump: "codex",
	"ci-fix": "codex",
	essay: "claude_ai",
	handoff: "claude_ai",
	audit: "autonomous",
};

/** Hand-authored, reviewed closed set (DATA-MODEL §3). */
export const WHY_HERE: Record<TaskClass, string> = {
	feature: "live filesystem + test runner",
	bugfix: "needs the repo and a repro",
	sweep: "parallelism beats reasoning depth",
	depbump: "mechanical, high-volume, self-contained",
	"ci-fix": "scripted, parallelizable",
	essay: "no filesystem; writes and dispatches",
	handoff: "the only write path into CC/Codex",
	audit: "scheduled, read-only, night shift",
};

export const GUARD_MAP: Record<
	RuleConcept,
	{ layer: GuardLayer; adaptation: Adaptation }
> = {
	"push-to-main": { layer: "hard-deny", adaptation: "opened-a-branch" },
	"credential-read": {
		layer: "deny-list",
		adaptation: "escalated-to-operator",
	},
	"non-local-db-write": { layer: "pretooluse-hook", adaptation: "reworded" },
	"harness-self-mutate": {
		layer: "hard-deny",
		adaptation: "escalated-to-operator",
	},
	"deep-home-delete": { layer: "pretooluse-hook", adaptation: "rerouted" },
	"unverified-complete": {
		layer: "verify-gate",
		adaptation: "ran-verify-first",
	},
};

// Templated summary word lists. summary = `${VERB} ${ARTIFACT}`.
export const VERBS = [
	"shipped",
	"hardened",
	"refactored",
	"migrated",
	"patched",
	"benchmarked",
	"wired",
	"gated",
	"audited",
	"scaffolded",
	"deduplicated",
	"backfilled",
	"instrumented",
	"pruned",
	"reconciled",
	"pinned",
] as const;
export const ARTIFACTS = [
	"the export pipeline",
	"the auth adapter",
	"the retry budget",
	"the cache layer",
	"the schema migration",
	"the ingest worker",
	"the rate limiter",
	"the token gate",
	"the sync guard",
	"the config loader",
	"the diff viewer",
	"the event bus",
	"the freshness poller",
	"the cost ledger",
	"the replay engine",
] as const;
export const LESSONS = [
	"verify on bytes, not on exit code",
	"guards fire, agent adapts",
	"snapshot before takeover",
	"dispatch clears the economic floor first",
	"one scoped task per lane",
] as const;
export const PATTERNS = [
	"branch-as-lease",
	"builder plus read-only validator",
	"closed-vocabulary generation",
	"pipeline over barrier",
	"deterministic seed",
] as const;
export type Lesson = (typeof LESSONS)[number];
export type Pattern = (typeof PATTERNS)[number];

/** Closed set of cost-record notes (nullable field). */
export const COST_NOTES = ["sweeps"] as const;
export type CostNote = (typeof COST_NOTES)[number];

/** The single hub-airlock artifact id in the authored timeline. */
export const HUB_ARTIFACT_ID = "draft-71" as const;

/** Closed set of roadmap file names (nullable field). */
export const ROADMAP_FILES = ["PLAN.md"] as const;

// ---- Runtime allowlists for the closure checker (mirror types/data.ts) ----
export const CALLERS = [
	"cc",
	"codex",
	"claude_ai",
	"notion_os",
	"personal_ops",
] as const;
export const FLEET_NODES = ["cc", "codex", "claude_ai", "autonomous"] as const;
export const SNAP_SYSTEMS = ["cc", "codex"] as const;
export const COST_SYSTEMS = [
	"cc",
	"codex",
	"notion_os",
	"personal_ops",
] as const;
export const SECTION_OWNERS = ["claude_ai", "cc", "codex"] as const;
export const SOURCE_TRUSTS = ["operator", "agent", "ingested"] as const;
export const MODEL_TIERS = ["Opus", "Sonnet", "Haiku", "mechanical"] as const;
export const ACTIVITY_TAGS = ["SHIPPED", "LEDGER"] as const;
export const SECTION_KEYS = [
	"career",
	"capabilities",
	"research",
	"speaking",
	"portfolio",
] as const;
export const HANDOFF_STATUSES = ["pending", "active", "cleared"] as const;
export const HANDOFF_STAGES = [
	"dispatch",
	"snapshot",
	"pickup",
	"receipt",
	"clear",
] as const;
export const FANOUT_PHASES = ["spawn", "run", "converge"] as const;
export const FRESHNESS_STATES = [
	"fresh",
	"aging",
	"stale",
	"unavailable",
] as const;
export const HUBFLOW_STAGES = ["draft", "approval", "send"] as const;
export const VERIFY_RESULTS = ["block", "pass"] as const;
export const DISPATCH_STATUSES = ["ok", "failed"] as const;

/** Section bodies are templated, never free text (SPEC 3.3 mechanism 3). */
export function sectionBody(sectionName: string): string {
	return `Synthetic ${sectionName} section body.`;
}
