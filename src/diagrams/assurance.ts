/**
 * A diagram's badge is the weakest assurance among the manifest claims it
 * depicts, so a picture can never promise more than its evidence does.
 */
import { architectureManifest } from "../data/architecture-manifest.ts";
import type {
	ArchitectureAssurance,
	ArchitectureClaimId,
} from "../types/architecture.ts";

/** Higher is stronger. */
export const ASSURANCE_RANK: Record<ArchitectureAssurance, number> = {
	operator_attested: 0,
	private_source_verified: 1,
	explainer_local_verified: 2,
	public_source_verified: 3,
};

export const ASSURANCE_LABEL: Record<ArchitectureAssurance, string> = {
	operator_attested: "Operator attested",
	private_source_verified: "Private source verified",
	explainer_local_verified: "Explainer-local verified",
	public_source_verified: "Public source verified",
};

export function claimAssurance(id: ArchitectureClaimId): ArchitectureAssurance {
	const claim = architectureManifest.claims.find((c) => c.id === id);
	if (!claim) throw new Error(`claim ${id} is not in the architecture manifest`);
	return claim.assurance;
}

export function assuranceFor(
	claims: readonly ArchitectureClaimId[],
): ArchitectureAssurance {
	if (claims.length === 0) throw new Error("a diagram must depict at least one claim");
	return claims
		.map(claimAssurance)
		.reduce((weakest, a) =>
			ASSURANCE_RANK[a] < ASSURANCE_RANK[weakest] ? a : weakest,
		);
}
