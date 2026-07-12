/**
 * Forbidden-pattern backstop scanner (SPEC 3.3 mechanism 5). The closure test
 * is the real guarantee; this catches mistakes in the allowlists themselves.
 *
 * Scope: src/, scripts/, repo-root config, and dist/ when present.
 * `--git` extends the scan to full `git log -p` history: run that on the
 * publish branch (Phase 9). The working branch's history deliberately carries
 * prep/build docs whose real-looking documentation paths never ship.
 *
 * Detection patterns are assembled from string fragments so this scanner's
 * own source never matches them. The known-real-names denylist is stored as
 * SHA-256 of lowercased tokens and matched hashed (SPEC 3.3 mechanism 6);
 * plaintext real names never ship.
 */
import { execFileSync } from "node:child_process";
import { createHash } from "node:crypto";
import { existsSync, readdirSync, readFileSync, statSync } from "node:fs";
import { extname, join } from "node:path";

const TEXT_EXT = new Set([
	".ts",
	".tsx",
	".css",
	".html",
	".json",
	".js",
	".map",
	".md",
	".txt",
	".svg",
	".yaml",
	".yml",
]);
const ROOT_FILES = ["index.html", "vercel.json", "package.json"];
const ROOT_DIRS = ["src", "scripts"];

// Home-directory path indicators (fragment-assembled; NFKC+lowercase applied).
const HOME_FRAGMENTS = ["/us" + "ers/", "c:\\us" + "ers", "%user" + "profile%"];
// Any tilde path outside the sanctioned fake root `~/workspace/`.
const TILDE = new RegExp("~" + "/(?!workspace/)");
const EMAIL = /[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}/g;
// The neutral commit identity is blessed (prep/STACK.md §7).
const EMAIL_ALLOW = new Set(["noreply@operator-os-explainer.local"]);
// Suspiciously precise dollar amounts (synthetic money is rounded to cents).
const DOLLARS = /\$\d+\.\d{3,}/;

// SHA-256 of lowercased forbidden tokens: real-product collisions rejected in
// the codename audit, reserve names, and operator-identity tokens.
const TOKEN_DENY = new Set([
	"b6c4ac412ac8822355239dd717c11ca5b07373e4db550d0423c1b6aeceef8493",
	"84e2cdb7a166d1671bc5e2abc1e78b59777dd1f863d3c5b05d09c2dd088444c2",
	"98d58cb407748b75dfcc05384d2d98024379f6d37dde03f3bbd961b60db3e6f4",
	"15c58d49590e7c0db11e004bb220260ddaf3dd88290da75f98c71f9fd38484f8",
	"709378e85b74c3d09ca4f097ef3b11af52695c7929fcd141c112b84db4b64f7a",
	"6ccc367fb7630b32b488b1891c38f595c768cace1aa782c9781debedeba130a2",
	"6290ca8940fa2d8af4d270b0fa14427c1946e680b9a91d35fb75da34559f5c67",
	"d709fd8faf1ea2ea1d64d644ede3c9940b56934ef550352488d000c6611245a8",
	"9c9ca94114426ece8a0d441c18b0b1c0fd31402a2aec67782b19bf7ba0016e20",
	"1868061c5d373226a9f6529fb70cabcb247c4f0f5ba4e15b3bbc08b92234ab66",
	"179ef9ce8ce7249b519e55356b040d84cf68c8150b13dc225cdc021cd3f9540d",
	"2458ed749d4795acf310e75a395766c4646b10b6bfd27a84282830ad013d580f",
	"f0a2b71f1a269a6f0090ba6e5b17eaa35049f226b3a42822624e56d798a7cfa1",
	"b26d28f46ceba1518fad6a7122320240084a5fe4fe73a5128fffcfffa86f2907",
]);

const sha256 = (s: string): string =>
	createHash("sha256").update(s).digest("hex");

export function scanText(label: string, raw: string): string[] {
	const violations: string[] = [];
	const normalized = raw.normalize("NFKC").toLowerCase();

	for (const fragment of HOME_FRAGMENTS) {
		if (normalized.includes(fragment))
			violations.push(`${label}: home-directory path indicator (${fragment})`);
	}
	if (TILDE.test(normalized))
		violations.push(`${label}: tilde path outside the fake workspace root`);
	for (const match of raw.match(EMAIL) ?? []) {
		if (!EMAIL_ALLOW.has(match.toLowerCase()))
			violations.push(`${label}: email address (${match})`);
	}
	if (DOLLARS.test(raw))
		violations.push(`${label}: over-precise dollar amount`);

	const tokens = new Set(normalized.match(/[a-z]{4,}/g) ?? []);
	for (const token of tokens) {
		if (TOKEN_DENY.has(sha256(token)))
			violations.push(`${label}: forbidden token (hash-matched, not printed)`);
	}
	return violations;
}

function* walk(dir: string): Generator<string> {
	for (const entry of readdirSync(dir)) {
		const path = join(dir, entry);
		if (statSync(path).isDirectory()) yield* walk(path);
		else yield path;
	}
}

/** The backstop must provably catch plants before it is trusted with a pass. */
function selfTest(): void {
	const plants = [
		["home path", "/Us" + "ers/nobody/leak.txt"],
		["windows path", "C:\\Us" + "ers\\nobody"],
		["env home", "%USER" + "PROFILE%\\x"],
		["tilde", "~" + "/Projects/leak"],
		["email", "leak" + "@example.com"],
		["dollars", "$1." + "2345"],
		["denied token", "Meri" + "dian"],
	] as const;
	for (const [name, plant] of plants) {
		if (scanText("self-test", plant).length === 0) {
			console.error(
				`FATAL: guard-scan self-test failed to catch plant: ${name}`,
			);
			process.exit(2);
		}
	}
	const clean = scanText(
		"self-test",
		"shipped the export pipeline ~/workspace/corveth $0.27",
	);
	if (clean.length !== 0) {
		console.error(
			`FATAL: guard-scan self-test flagged sanctioned content:\n${clean.join("\n")}`,
		);
		process.exit(2);
	}
}

function main(): void {
	selfTest();

	const violations: string[] = [];
	const targets: string[] = [];
	for (const dir of ROOT_DIRS) if (existsSync(dir)) targets.push(...walk(dir));
	for (const file of ROOT_FILES) if (existsSync(file)) targets.push(file);
	if (existsSync("dist")) targets.push(...walk("dist"));

	let scanned = 0;
	for (const file of targets) {
		if (!TEXT_EXT.has(extname(file))) continue;
		scanned += 1;
		violations.push(...scanText(file, readFileSync(file, "utf8")));
	}

	if (process.argv.includes("--git")) {
		const history = execFileSync("git", ["log", "-p", "--all"], {
			encoding: "utf8",
			maxBuffer: 256 * 1024 * 1024,
		});
		violations.push(...scanText("git log -p", history));
		scanned += 1;
	}

	if (violations.length > 0) {
		console.error(`GUARD SCAN FAILED (${violations.length} violation(s)):`);
		for (const v of violations) console.error(`  ${v}`);
		process.exit(1);
	}
	console.log(
		`guard-scan clean: self-test passed, ${scanned} target(s) scanned`,
	);
}

main();
