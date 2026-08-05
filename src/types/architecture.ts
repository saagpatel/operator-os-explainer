export const ARCHITECTURE_CLAIM_IDS = [
	"approval-airlock",
	"bridge-sqlite-spine",
	"deterministic-synthetic-replay",
	"freshness-gated-alerts",
	"gravity-based-routing",
	"isolated-worktree-fanout",
	"layered-operation-guards",
	"public-release-closure",
] as const;

export type ArchitectureClaimId = (typeof ARCHITECTURE_CLAIM_IDS)[number];

export type ArchitectureAssurance =
	| "public_source_verified"
	| "private_source_verified"
	| "operator_attested"
	| "explainer_local_verified";

export type ArchitectureSourceVisibility =
	| "public"
	| "private"
	| "operator_attestation";

export interface ArchitectureSource {
	id: string;
	title: string;
	visibility: ArchitectureSourceVisibility;
	repository_url: string | null;
	revision: string | null;
}

export interface ArchitectureClaim {
	id: ArchitectureClaimId;
	summary: string;
	assurance: ArchitectureAssurance;
	evidence: Array<{
		source_id: string;
		locator: string;
	}>;
}

export interface PublicArchitectureManifestV1 {
	schema: "PublicArchitectureManifestV1";
	as_of: string;
	public_safe: true;
	claim_policy: Record<ArchitectureAssurance, string>;
	sources: ArchitectureSource[];
	claims: ArchitectureClaim[];
}
