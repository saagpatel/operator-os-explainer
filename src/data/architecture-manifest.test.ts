// @vitest-environment node
import { describe, expect, it } from "vitest";
import { DIAGRAMS } from "../diagrams/index.ts";
import { SCENES } from "../scenes/index.ts";
import {
	ARCHITECTURE_CLAIM_IDS,
	type ArchitectureAssurance,
	type ArchitectureSourceVisibility,
} from "../types/architecture.ts";
import { architectureManifest } from "./architecture-manifest.ts";

const SHA40 = /^[0-9a-f]{40}$/;
const SAFE_LOCATOR = /^(?!.*(?:\/Users\/|~\/|[A-Za-z]:\\)).+$/;

describe("PublicArchitectureManifestV1", () => {
	it("is closed, public-safe, and source-resolvable", () => {
		expect(architectureManifest.schema).toBe("PublicArchitectureManifestV1");
		expect(architectureManifest.public_safe).toBe(true);
		expect(architectureManifest.as_of).toMatch(/^\d{4}-\d{2}-\d{2}$/);

		const expectedAssurances: ArchitectureAssurance[] = [
			"explainer_local_verified",
			"operator_attested",
			"private_source_verified",
			"public_source_verified",
		];
		expect(Object.keys(architectureManifest.claim_policy).sort()).toEqual(
			expectedAssurances,
		);

		const sourceById = new Map(
			architectureManifest.sources.map((source) => [source.id, source]),
		);
		expect(sourceById.size).toBe(architectureManifest.sources.length);

		const expectedVisibility: Record<
			ArchitectureAssurance,
			ArchitectureSourceVisibility
		> = {
			explainer_local_verified: "public",
			operator_attested: "operator_attestation",
			private_source_verified: "private",
			public_source_verified: "public",
		};

		const claimIds = architectureManifest.claims.map((claim) => claim.id);
		expect(new Set(claimIds).size).toBe(claimIds.length);
		expect([...claimIds].sort()).toEqual([...ARCHITECTURE_CLAIM_IDS]);

		for (const claim of architectureManifest.claims) {
			expect(claim.summary.trim().length).toBeGreaterThan(0);
			expect(claim.evidence.length).toBeGreaterThan(0);
			for (const evidence of claim.evidence) {
				const source = sourceById.get(evidence.source_id);
				expect(source, `${claim.id} has an unknown source`).toBeDefined();
				expect(source?.visibility).toBe(expectedVisibility[claim.assurance]);
				expect(evidence.locator).toMatch(SAFE_LOCATOR);
			}
		}

		for (const source of architectureManifest.sources) {
			if (source.visibility === "public") {
				expect(source.repository_url).toMatch(/^https:\/\/github\.com\//);
				expect(source.revision).toMatch(SHA40);
			} else {
				expect(source.repository_url).toBeNull();
				expect(source.revision).toBeNull();
			}
		}
	});

	it("binds every scene reference and every manifest claim", () => {
		const manifestIds = new Set(
			architectureManifest.claims.map((claim) => claim.id),
		);
		const referencedIds = new Set<string>();

		for (const scene of Object.values(SCENES)) {
			expect(
				scene.architectureClaims.length,
				`scene ${scene.slug || "cold-open"} needs provenance`,
			).toBeGreaterThan(0);
			for (const claimId of scene.architectureClaims) {
				expect(
					manifestIds.has(claimId),
					`scene ${scene.slug || "cold-open"} references ${claimId}`,
				).toBe(true);
				referencedIds.add(claimId);
			}
		}

		expect([...referencedIds].sort()).toEqual([...ARCHITECTURE_CLAIM_IDS]);
	});

	it("binds every mechanism diagram's claims", () => {
		const manifestIds = new Set(
			architectureManifest.claims.map((claim) => claim.id),
		);
		for (const diagram of Object.values(DIAGRAMS)) {
			expect(diagram.claims.length, `diagram ${diagram.id} needs provenance`).toBeGreaterThan(0);
			for (const claimId of diagram.claims) {
				expect(manifestIds.has(claimId), `diagram ${diagram.id} references ${claimId}`).toBe(true);
			}
		}
	});
});
