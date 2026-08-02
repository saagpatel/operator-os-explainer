/**
 * Scene registry + order (SPEC 4.2). One SceneConfig per scene file; all
 * seven are built and mounted as real routes in router.tsx.
 */
import type { SceneConfig } from "../types/scene.ts";
import coda from "./coda.ts";
import coldOpen from "./coldopen.ts";
import finale from "./finale.ts";
import fleet from "./fleet.ts";
import hub from "./hub.ts";
import safety from "./safety.ts";
import spine from "./spine.ts";

export const SCENES: Record<string, SceneConfig> = {
	"": coldOpen,
	fleet,
	spine,
	safety,
	finale,
	hub,
	coda,
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
