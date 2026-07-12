/**
 * Data contract (prep/DATA-MODEL.md §2, authoritative). Six entity shapes
 * mirroring bridge-db, ten event kinds, and the `missionId` correlation key
 * that threads one mission's events across scenes. Not to be changed.
 */
import type {
	Adaptation,
	Codename,
	GuardLayer,
	Lesson,
	Pattern,
	Phase,
	RuleConcept,
	Spoke,
	TaskClass,
} from "../data/vocab.ts";

export type Caller =
	| "cc"
	| "codex"
	| "claude_ai"
	| "notion_os"
	| "personal_ops";
/** The 4 rendered fleet nodes. `autonomous` renders as a cc sub-mode. */
export type FleetNode = "cc" | "codex" | "claude_ai" | "autonomous";
export type SnapSystem = "cc" | "codex";
export type CostSystem = "cc" | "codex" | "notion_os" | "personal_ops";
export type SectionOwner = "claude_ai" | "cc" | "codex";
export type SourceTrust = "operator" | "agent" | "ingested";
/** Fable is the BUILDER of this piece, never in-world data. */
export type ModelTier = "Opus" | "Sonnet" | "Haiku" | "mechanical";
export type ActivityTag = "SHIPPED" | "LEDGER";

// ---- Entity mirror (bridge-db shapes, invented contents) ----
export interface Activity {
	id: number;
	source: Caller;
	timestamp: string;
	projectName: Codename;
	/** TEMPLATED `${verb} ${artifact}`, never free text. */
	summary: string;
	/** `feat/<slug>` | `fix/<slug>` | null */
	branch: string | null;
	tags: ActivityTag[];
	sourceTrust: SourceTrust;
	missionId: number | null;
}
export interface Handoff {
	id: number;
	projectName: Codename;
	/** `~/workspace/<slug>` only, never a real path root. */
	projectPath: string | null;
	roadmapFile: string | null;
	phase: Phase | null;
	dispatchedFrom: "claude_ai";
	dispatchedAt: string;
	pickedUpAt: string | null;
	clearedAt: string | null;
	status: "pending" | "active" | "cleared";
	claimedBy: Caller | null;
	sourceTrust: SourceTrust;
}
export interface Snapshot {
	id: number;
	system: SnapSystem;
	snapshotDate: string;
	data: { activeProjects: Codename[]; lessons: Lesson[]; patterns: Pattern[] };
	createdAt: string;
	sourceTrust: SourceTrust;
}
export interface CostRecord {
	id: number;
	system: CostSystem;
	month: string;
	amount: number;
	notes: string | null;
}
export interface SessionCost {
	sessionId: string;
	projectName: Codename;
	startedAt: string;
	costUsd: number;
	modelBreakdown: Partial<Record<ModelTier, number>>;
	source: Caller;
	missionId: number | null;
}
export type SectionKey =
	| "career"
	| "capabilities"
	| "research"
	| "speaking"
	| "portfolio";
export interface Section {
	sectionName: SectionKey;
	owner: SectionOwner;
	content: string;
	updatedAt: string;
	version: number;
}

// ---- Timeline events (drive the visuals). EVERY arc-bearing event carries `missionId`. ----
export type SyntheticEvent =
	| {
			kind: "dispatch";
			id: number;
			at: number;
			missionId: number;
			from: Caller;
			to: FleetNode;
			taskClass: TaskClass;
			model: ModelTier;
			durationMs: number;
			status: "ok" | "failed";
	  }
	| {
			/** Reveals an Activity into the bridge feed. */
			kind: "activity";
			id: number;
			at: number;
			missionId: number | null;
			activityId: number;
	  }
	| {
			kind: "handoff";
			id: number;
			at: number;
			missionId: number;
			handoffId: number;
			stage: "dispatch" | "snapshot" | "pickup" | "receipt" | "clear";
	  }
	| {
			kind: "guard";
			id: number;
			at: number;
			missionId: number;
			layer: GuardLayer;
			ruleConcept: RuleConcept;
			outcome: "blocked";
			adaptation: Adaptation;
	  }
	| {
			kind: "fanout";
			id: number;
			at: number;
			missionId: number;
			lane: number;
			worktree: string;
			model: ModelTier;
			phase: "spawn" | "run" | "converge";
	  }
	| {
			kind: "verify";
			id: number;
			at: number;
			missionId: number;
			attempt: number;
			result: "block" | "pass";
	  }
	| {
			kind: "ship";
			id: number;
			at: number;
			missionId: number;
			activityId: number;
			downstreamSystem: "notion";
			downstreamRef: string;
	  }
	| {
			kind: "freshness";
			id: number;
			at: number;
			spoke: Spoke;
			state: "fresh" | "aging" | "stale" | "unavailable";
	  }
	| {
			kind: "hubflow";
			id: number;
			at: number;
			stage: "draft" | "approval" | "send";
			artifactId: string;
	  }
	| {
			kind: "cost";
			id: number;
			at: number;
			missionId: number;
			sessionCostId: string;
			model: ModelTier;
			deltaUsd: number;
	  };

export interface Dataset {
	meta: {
		seed: number;
		version: string;
		sessionLengthMs: number;
		heroMissionId: number;
		synthetic: true;
	};
	activity: Activity[];
	handoffs: Handoff[];
	snapshots: Snapshot[];
	costRecords: CostRecord[];
	sessionCosts: SessionCost[];
	sections: Section[];
	/** Sorted ascending by `at`. */
	events: SyntheticEvent[];
}
