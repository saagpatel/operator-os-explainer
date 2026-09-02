/**
 * Registry of the mechanism diagrams. Each model names the scene whose deep
 * panel carries it; registry.test.ts binds every claim to the manifest and
 * every placement to a scene that declares those claims.
 */
import { airlock } from "./airlock.ts";
import { closure } from "./closure.ts";
import { freshness } from "./freshness.ts";
import { guards } from "./guards.ts";
import { lease } from "./lease.ts";
import type { DiagramId, DiagramModel } from "./model.ts";
import { spineRows } from "./spine-rows.ts";

export const DIAGRAMS: Record<DiagramId, DiagramModel> = {
	closure,
	lease,
	airlock,
	freshness,
	"spine-rows": spineRows,
	guards,
};

/** Diagrams in presentation order for a scene's deep panel. */
export function diagramsFor(scene: DiagramModel["scene"]): DiagramModel[] {
	return Object.values(DIAGRAMS).filter((d) => d.scene === scene);
}
