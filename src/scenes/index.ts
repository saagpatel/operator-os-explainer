/**
 * Scene registry + order (SPEC 4.2). One SceneConfig per scene file;
 * routes not yet built fall back to the placeholder in the router.
 */
import type { SceneConfig } from "../types/scene.ts";
import fleet from "./fleet.ts";

export const SCENES: Record<string, SceneConfig> = {
	fleet,
};

export const SCENE_ORDER: readonly string[] = [
	"",
	"fleet",
	"spine",
	"safety",
	"finale",
	"hub",
	"coda",
];
