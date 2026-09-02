/**
 * Emits public/diagrams/<id>-<ground>.svg and docs/mechanisms.md from the
 * diagram models. Run at authoring time (node scripts/render-diagrams.ts);
 * src/diagrams/render.test.ts proves the committed files match a fresh
 * render byte for byte. Asserts run-to-run determinism before writing, like
 * the dataset generator.
 */
import { mkdirSync, readdirSync, rmSync, writeFileSync } from "node:fs";
import { DIAGRAMS } from "../src/diagrams/index.ts";
import { renderDocs } from "../src/diagrams/render-docs.ts";
import { renderSvgString } from "../src/diagrams/render-string.ts";

const OUT = "public/diagrams";
mkdirSync(OUT, { recursive: true });
mkdirSync("docs", { recursive: true });

// A renamed or removed diagram must not leave its old file behind, or the
// byte-for-byte check would bless an orphan the registry no longer knows.
for (const stale of readdirSync(OUT).filter((f) => f.endsWith(".svg"))) {
	rmSync(`${OUT}/${stale}`);
}

function deterministic(label: string, render: () => string): string {
	const first = render();
	if (first !== render()) {
		console.error(`FATAL: ${label} is not deterministic across two runs`);
		process.exit(1);
	}
	return first;
}

const written: string[] = [];
const models = Object.values(DIAGRAMS);
for (const model of models) {
	for (const ground of ["deck", "paper"] as const) {
		const path = `${OUT}/${model.id}-${ground}.svg`;
		const svg = deterministic(path, () => renderSvgString(model, "wide", ground));
		writeFileSync(path, svg);
		written.push(`${path} (${svg.length} bytes)`);
	}
}
const docs = deterministic("docs/mechanisms.md", () => renderDocs(models));
writeFileSync("docs/mechanisms.md", docs);
written.push(`docs/mechanisms.md (${docs.length} bytes)`);
console.log(written.join("\n"));
