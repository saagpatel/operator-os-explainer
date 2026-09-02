/**
 * Mechanism 01: how the console stays honest. Closed vocabularies feed a
 * pure seeded generator, one committed dataset is the app's only import,
 * three gates fail the build on any escape, the bundle ships without source
 * maps, and the release lineage is an orphan tree.
 */
import { sketch } from "./draw.ts";
import { datasetCounts, seedHex, vocabSizes } from "./facts.ts";
import type { DiagramModel } from "./model.ts";

const v = vocabSizes();
const n = datasetCounts();

const L = {
	stores: "bridge-db · personal-ops",
	storesSub: "the real stores",
	noWire: "no import · no fetch · no MCP",
	vocab: "src/data/vocab.ts",
	vocabSub: "closed vocabularies",
	vocabA: `${v.codenames} codenames · ${v.taskClasses} task classes`,
	vocabB: `${v.guardLayers} guard layers · ${v.ruleConcepts} rules`,
	gen: "src/data/generate.ts",
	genSub: "pure: seed -> data",
	genA: `SEED ${seedHex()} · mulberry32`,
	genB: "no Date.now, no Math.random",
	data: "src/data/dataset.json",
	dataSub: "committed artifact",
	dataA: `${n.events} events · ${n.activity} activity · ${n.handoffs} handoffs`,
	dataB: "the app's only data import",
	build: "pnpm build",
	buildSub: "vite · sourcemap: false",
	buildA: "no build-machine paths",
	buildB: "in the shipped bundle",
	rel: "release lineage",
	relSub: "orphan root · neutral author",
	relA: "no merge base with dev, ever",
	relB: "log -p scanned, not just tree",
	e1a: "may only",
	e1b: "emit members",
	e2a: "written once,",
	e2b: "at authoring",
	e3: "bundled",
	e4a: "tree copied,",
	e4b: "never merged",
	gates: "GATES · any one failing fails the build",
	gatesA: "the load-bearing gate is closure,",
	gatesB: "not the scanner",
	closure: "closure.test.ts",
	closureA: "every value in its allowlist",
	closureB: "cost deltas sum to session cost",
	closureC: "byte-identical · plants must fail",
	prop: "property.test.ts",
	propA: "closure holds across",
	propB: "sampled seeds",
	scan: "scripts/guard-scan.ts",
	scanA: "source + dataset + dist",
	scanB: "self-test: planted violations first",
	scanC: "forbidden names stored as hashes",
};

function wide() {
	const s = sketch("0 0 1120 350");
	// the real stores: present, and not wired
	s.rect(472, 12, 176, 46, { fill: "none", stroke: "muted", dash: "4 4" });
	s.text(560, 31, L.stores, 11, "muted", { anchor: "middle", bold: true });
	s.text(560, 47, L.storesSub, 10, "muted", { anchor: "middle" });
	s.line(560, 58, 560, 92, "muted", { dash: "3 4" });
	s.line(553, 100, 567, 114, "muted", { sw: 1.5 });
	s.line(567, 100, 553, 114, "muted", { sw: 1.5 });
	s.text(576, 111, L.noWire, 10, "muted");

	const stations: [number, string, string, string, string][] = [
		[0, L.vocab, L.vocabSub, L.vocabA, L.vocabB],
		[236, L.gen, L.genSub, L.genA, L.genB],
		[472, L.data, L.dataSub, L.dataA, L.dataB],
		[708, L.build, L.buildSub, L.buildA, L.buildB],
		[944, L.rel, L.relSub, L.relA, L.relB],
	];
	for (const [x, title, sub, a, b] of stations) {
		s.station(x, 140, 176, 64, title, sub);
		s.text(x + 88, 224, a, 9.5, "muted", { anchor: "middle" });
		s.text(x + 88, 238, b, 9.5, "muted", { anchor: "middle" });
	}
	const edges: [number, string, string | null][] = [
		[178, L.e1a, L.e1b],
		[414, L.e2a, L.e2b],
		[650, L.e3, null],
		[886, L.e4a, L.e4b],
	];
	for (const [x, a, b] of edges) {
		s.line(x, 172, x + 54, 172, "fg", { arrow: true });
		if (b) {
			s.text(x + 28, 118, a, 10, "muted", { anchor: "middle" });
			s.text(x + 28, 130, b, 10, "muted", { anchor: "middle" });
		} else {
			s.text(x + 28, 130, a, 10, "muted", { anchor: "middle" });
		}
	}

	// gates hanging off the dataset and the build
	s.line(560, 248, 560, 262, "line");
	s.line(440, 262, 650, 262, "line");
	s.line(440, 262, 440, 278, "line");
	s.line(650, 262, 650, 278, "line");
	s.line(796, 248, 796, 262, "line");
	s.line(796, 262, 870, 262, "line");
	s.line(870, 262, 870, 278, "line");

	s.rect(330, 278, 220, 66, { stroke: "accent", sw: 1.5 });
	s.text(440, 298, L.closure, 11.5, "accent", { anchor: "middle", bold: true });
	s.text(440, 314, L.closureA, 10, "muted", { anchor: "middle" });
	s.text(440, 327, L.closureB, 10, "muted", { anchor: "middle" });
	s.text(440, 340, L.closureC, 10, "muted", { anchor: "middle" });
	s.rect(570, 278, 160, 66);
	s.text(650, 298, L.prop, 11.5, "fg", { anchor: "middle", bold: true });
	s.text(650, 314, L.propA, 10, "muted", { anchor: "middle" });
	s.text(650, 327, L.propB, 10, "muted", { anchor: "middle" });
	s.rect(750, 278, 240, 66);
	s.text(870, 298, L.scan, 11.5, "fg", { anchor: "middle", bold: true });
	s.text(870, 314, L.scanA, 10, "muted", { anchor: "middle" });
	s.text(870, 327, L.scanB, 10, "muted", { anchor: "middle" });
	s.text(870, 340, L.scanC, 10, "muted", { anchor: "middle" });
	s.text(0, 300, L.gates, 10, "muted");
	s.text(0, 314, L.gatesA, 10, "muted");
	s.text(0, 328, L.gatesB, 10, "muted");
	return s.done();
}

/**
 * Phone layout. Drawn at the label floor useVizScale applies on a 320px
 * viewport (about 11.8 units), so every line is 14 units apart and at most
 * 44 glyphs wide.
 */
function compact() {
	const s = sketch("0 0 340 910");
	s.rect(20, 6, 300, 40, { fill: "none", stroke: "muted", dash: "4 4" });
	s.text(170, 22, L.stores, 10.5, "muted", { anchor: "middle", bold: true });
	s.text(170, 37, L.storesSub, 10, "muted", { anchor: "middle" });
	s.line(170, 46, 170, 58, "muted", { dash: "3 4" });
	s.line(164, 62, 176, 74, "muted", { sw: 1.5 });
	s.line(176, 62, 164, 74, "muted", { sw: 1.5 });
	s.text(170, 90, L.noWire, 10, "muted", { anchor: "middle" });

	const station = (y: number, title: string, sub: string, a: string, b: string) => {
		s.rect(20, y, 300, 72);
		s.text(170, y + 19, title, 11, "fg", { anchor: "middle", bold: true });
		s.text(170, y + 34, sub, 10, "muted", { anchor: "middle" });
		s.text(170, y + 48, a, 10, "muted", { anchor: "middle" });
		s.text(170, y + 62, b, 10, "muted", { anchor: "middle" });
	};
	const edge = (y: number, a: string, b: string | null) => {
		s.line(170, y, 170, y + 32, "fg", { arrow: true });
		if (b) {
			s.text(182, y + 13, a, 10, "muted");
			s.text(182, y + 27, b, 10, "muted");
		} else {
			s.text(182, y + 20, a, 10, "muted");
		}
	};
	station(102, L.vocab, L.vocabSub, L.vocabA, L.vocabB);
	edge(176, L.e1a, L.e1b);
	station(210, L.gen, L.genSub, L.genA, L.genB);
	edge(284, L.e2a, L.e2b);
	station(318, L.data, L.dataSub, L.dataA, L.dataB);
	// gates sit on the way from the dataset to the build
	s.line(170, 392, 170, 404, "line");
	s.text(20, 420, L.gates, 10, "muted");
	s.text(20, 434, L.gatesA, 10, "muted");
	s.text(20, 448, L.gatesB, 10, "muted");
	s.rect(20, 460, 300, 72, { stroke: "accent", sw: 1.5 });
	s.text(170, 479, L.closure, 11, "accent", { anchor: "middle", bold: true });
	s.text(170, 494, L.closureA, 10, "muted", { anchor: "middle" });
	s.text(170, 508, L.closureB, 10, "muted", { anchor: "middle" });
	s.text(170, 522, L.closureC, 10, "muted", { anchor: "middle" });
	s.rect(20, 542, 300, 58);
	s.text(170, 561, L.prop, 11, "fg", { anchor: "middle", bold: true });
	s.text(170, 576, L.propA, 10, "muted", { anchor: "middle" });
	s.text(170, 590, L.propB, 10, "muted", { anchor: "middle" });
	s.rect(20, 610, 300, 72);
	s.text(170, 629, L.scan, 11, "fg", { anchor: "middle", bold: true });
	s.text(170, 644, L.scanA, 10, "muted", { anchor: "middle" });
	s.text(170, 658, L.scanB, 10, "muted", { anchor: "middle" });
	s.text(170, 672, L.scanC, 10, "muted", { anchor: "middle" });
	s.line(170, 682, 170, 694, "line");
	edge(694, L.e3, null);
	station(728, L.build, L.buildSub, L.buildA, L.buildB);
	edge(802, L.e4a, L.e4b);
	station(836, L.rel, L.relSub, L.relA, L.relB);
	return s.done();
}

export const closure: DiagramModel = {
	id: "closure",
	eyebrow: "Mechanism 01 · public-release-closure · deterministic-synthetic-replay",
	title: "How the console stays honest",
	ariaLabel:
		"Closed vocabularies feed a pure seeded generator that writes one committed dataset; the app imports only that file, three gates fail the build on any escape, the bundle ships without source maps, and the release lineage is an orphan tree. The real stores have no wire into the app.",
	figcaption:
		"Every shipped value is a member of an audited finite set by construction: the generator can only emit vocabulary members, the closure test proves nothing escaped, and the app has no wire to the real stores. The scanner is a backstop for mistakes in the allowlists themselves.",
	verify:
		"pnpm test (closure, property, contrast, manifest) · pnpm guard · pnpm build, then inspect dist for .map files",
	claims: ["public-release-closure", "deterministic-synthetic-replay"],
	scene: "coda",
	wide: wide(),
	compact: compact(),
};
