/**
 * Emits src/data/dataset.json from the deterministic generator. Run at
 * authoring time only (node scripts/generate-dataset.ts); the app imports
 * the JSON artifact, never the generator. Asserts run-to-run determinism
 * before writing.
 */
import { writeFileSync } from "node:fs";
import { generate } from "../src/data/generate.ts";

const first = JSON.stringify(generate(), null, "\t");
const second = JSON.stringify(generate(), null, "\t");
if (first !== second) {
	console.error("FATAL: generator is not deterministic across two runs");
	process.exit(1);
}

const artifact = `${first}\n`;
writeFileSync("src/data/dataset.json", artifact);
console.log(
	`wrote src/data/dataset.json (${artifact.length} bytes, seed fixed)`,
);
