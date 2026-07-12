/**
 * The ONLY data the app reads (SPEC 3.3 mechanism 1): the committed artifact
 * emitted by scripts/generate-dataset.ts. No live wiring, no fetch, no MCP.
 * The cast is sound because closure.test.ts proves the artifact byte-matches
 * generate(SEED), whose return type is Dataset.
 */
import type { Dataset } from "../types/data.ts";
import datasetJson from "./dataset.json";

export const dataset = datasetJson as unknown as Dataset;
