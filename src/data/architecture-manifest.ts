import rawManifest from "../../public/architecture-manifest-v1.json";
import type { PublicArchitectureManifestV1 } from "../types/architecture.ts";

/**
 * Typed view of the public artifact copied verbatim into every production
 * build. Runtime consumers can fetch `/architecture-manifest-v1.json`; source
 * and tests use this import so the public file remains the single authority.
 */
export const architectureManifest =
	rawManifest as PublicArchitectureManifestV1;
