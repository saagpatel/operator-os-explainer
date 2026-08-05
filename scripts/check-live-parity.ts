#!/usr/bin/env node

import { createHash } from "node:crypto";
import { spawnSync } from "node:child_process";
import { pathToFileURL } from "node:url";

const CANONICAL_URL = "https://operator.saagarpatel.dev/";
const PLATFORM_URL = "https://operator-os-explainer.vercel.app/";

export const ROUTES = [
	"/",
	"/fleet",
	"/spine",
	"/safety",
	"/finale",
	"/hub",
	"/coda",
	"/scene-that-does-not-exist",
] as const;

type Deployment = {
	id: string;
	name: string;
	readyState: string;
	target: string | null;
	url: string;
};

type SurfaceProof = {
	baseUrl: string;
	routeHashes: Record<string, string>;
	assetHashes: Record<string, string>;
};

export function requiredVercelScope(
	environment: Record<string, string | undefined> = process.env,
): string {
	const scope = environment.VERCEL_TEAM_SCOPE?.trim();
	if (!scope) {
		throw new Error(
			"VERCEL_TEAM_SCOPE is required to resolve deployment identity",
		);
	}
	return scope;
}

function escapeRegex(value: string): string {
	return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function tagHasAttributes(
	html: string,
	tagName: string,
	attributes: Record<string, string>,
): boolean {
	const tags = html.match(new RegExp(`<${tagName}\\b[^>]*>`, "gi")) ?? [];
	return tags.some((tag) =>
		Object.entries(attributes).every(([name, value]) =>
			new RegExp(
				`\\b${escapeRegex(name)}=["']${escapeRegex(value)}["']`,
				"i",
			).test(tag),
		),
	);
}

export function metadataErrors(html: string): string[] {
	const required: Array<[string, Record<string, string>, string]> = [
		[
			"link",
			{ rel: "canonical", href: CANONICAL_URL },
			"canonical link",
		],
		[
			"meta",
			{ property: "og:url", content: CANONICAL_URL },
			"Open Graph URL",
		],
		[
			"meta",
			{ property: "og:image", content: `${CANONICAL_URL}og.png` },
			"Open Graph image",
		],
		[
			"meta",
			{ name: "twitter:image", content: `${CANONICAL_URL}og.png` },
			"Twitter image",
		],
	];

	return required
		.filter(([tag, attributes]) => !tagHasAttributes(html, tag, attributes))
		.map(([, , label]) => `missing or incorrect ${label}`);
}

export function extractAssetPaths(html: string): string[] {
	const paths = Array.from(
		html.matchAll(/\b(?:src|href)=["']([^"'#?]+)["']/gi),
		(match) => match[1],
	).filter((path) => path.startsWith("/assets/") || path === "/og.png");
	// Metadata is intentionally absolute to the canonical host. Fetch the same
	// local path from each alias so a stale share card cannot hide behind that
	// canonical URL while the application bundles happen to match.
	return [...new Set([...paths, "/og.png"])].sort();
}

function sha256(bytes: ArrayBuffer | string): string {
	return createHash("sha256")
		.update(typeof bytes === "string" ? bytes : Buffer.from(bytes))
		.digest("hex");
}

function normalizedBaseUrl(value: string): string {
	const parsed = new URL(value);
	parsed.pathname = "/";
	parsed.search = "";
	parsed.hash = "";
	return parsed.toString();
}

function inspectDeployment(url: string): Deployment {
	const command = process.env.VERCEL_BIN ?? "vercel";
	const scope = requiredVercelScope();
	const result = spawnSync(
		command,
		[
			"inspect",
			url,
			"--format=json",
			"--scope",
			scope,
			"--no-color",
		],
		{ encoding: "utf8" },
	);

	if (result.error) {
		throw new Error(`could not execute ${command}: ${result.error.message}`);
	}
	if (result.status !== 0) {
		throw new Error(
			`Vercel could not resolve ${url}: ${result.stderr.trim() || "unknown error"}`,
		);
	}

	let raw: unknown;
	try {
		raw = JSON.parse(result.stdout);
	} catch {
		throw new Error(`Vercel returned non-JSON deployment data for ${url}`);
	}
	if (!raw || typeof raw !== "object") {
		throw new Error(`Vercel returned no deployment data for ${url}`);
	}

	const candidate = raw as Partial<Deployment>;
	for (const field of ["id", "name", "readyState", "url"] as const) {
		if (typeof candidate[field] !== "string" || candidate[field].length === 0) {
			throw new Error(`Vercel deployment for ${url} is missing ${field}`);
		}
	}
	if (candidate.readyState !== "READY") {
		throw new Error(
			`Vercel deployment for ${url} is ${candidate.readyState}, not READY`,
		);
	}

	return {
		id: candidate.id as string,
		name: candidate.name as string,
		readyState: candidate.readyState,
		target: typeof candidate.target === "string" ? candidate.target : null,
		url: candidate.url as string,
	};
}

async function fetchBytes(url: string): Promise<{ bytes: ArrayBuffer; type: string }> {
	const response = await fetch(url, {
		redirect: "follow",
		headers: { "user-agent": "operator-os-explainer-live-parity/1" },
	});
	if (!response.ok) {
		throw new Error(`${url} returned HTTP ${response.status}`);
	}
	return {
		bytes: await response.arrayBuffer(),
		type: response.headers.get("content-type") ?? "",
	};
}

async function verifySurface(baseUrl: string): Promise<SurfaceProof> {
	const base = normalizedBaseUrl(baseUrl);
	const routeHashes: Record<string, string> = {};
	let rootHtml = "";

	for (const route of ROUTES) {
		const url = new URL(route, base).toString();
		const { bytes, type } = await fetchBytes(url);
		if (!type.toLowerCase().includes("text/html")) {
			throw new Error(`${url} returned ${type || "no content type"}, not HTML`);
		}
		const html = Buffer.from(bytes).toString("utf8");
		if (!html.includes('<div id="root"></div>')) {
			throw new Error(`${url} is not the explainer application shell`);
		}
		const errors = metadataErrors(html);
		if (errors.length > 0) {
			throw new Error(`${url}: ${errors.join("; ")}`);
		}
		routeHashes[route] = sha256(bytes);
		if (route === "/") rootHtml = html;
	}

	if (new Set(Object.values(routeHashes)).size !== 1) {
		throw new Error(`${base} does not serve one SPA shell across all eight routes`);
	}

	const assetPaths = extractAssetPaths(rootHtml);
	if (assetPaths.length < 3) {
		throw new Error(`${base} exposed too few versioned assets to prove parity`);
	}
	const assetHashes: Record<string, string> = {};
	for (const path of assetPaths) {
		const { bytes } = await fetchBytes(new URL(path, base).toString());
		assetHashes[path] = sha256(bytes);
	}

	return { baseUrl: base, routeHashes, assetHashes };
}

function equalRecords(
	left: Record<string, string>,
	right: Record<string, string>,
): boolean {
	return JSON.stringify(left) === JSON.stringify(right);
}

function parseDeploymentUrl(args: string[]): string | null {
	const index = args.indexOf("--deployment-url");
	if (index === -1) return null;
	const value = args[index + 1];
	if (!value || value.startsWith("--")) {
		throw new Error("--deployment-url requires an HTTPS URL");
	}
	if (new URL(value).protocol !== "https:") {
		throw new Error("--deployment-url must use HTTPS");
	}
	return value;
}

async function main(): Promise<void> {
	const deploymentUrl = parseDeploymentUrl(process.argv.slice(2));
	if (deploymentUrl) {
		const deployment = inspectDeployment(deploymentUrl);
		const proof = await verifySurface(deploymentUrl);
		console.log(
			`deployment verified: ${deployment.id} · ${ROUTES.length} routes · ${Object.keys(proof.assetHashes).length} assets`,
		);
		return;
	}

	const canonical = inspectDeployment(CANONICAL_URL);
	const platform = inspectDeployment(PLATFORM_URL);
	if (canonical.id !== platform.id) {
		throw new Error(
			`alias drift: custom=${canonical.id} platform=${platform.id}`,
		);
	}
	const expectedId = process.env.EXPECTED_DEPLOYMENT_ID;
	if (expectedId && canonical.id !== expectedId) {
		throw new Error(
			`deployment drift: expected=${expectedId} actual=${canonical.id}`,
		);
	}

	const [customProof, platformProof] = await Promise.all([
		verifySurface(CANONICAL_URL),
		verifySurface(PLATFORM_URL),
	]);
	if (!equalRecords(customProof.routeHashes, platformProof.routeHashes)) {
		throw new Error("the two hosts serve different route bytes");
	}
	if (!equalRecords(customProof.assetHashes, platformProof.assetHashes)) {
		throw new Error("the two hosts serve different asset names or bytes");
	}

	console.log(
		`live parity verified: ${canonical.id} · ${ROUTES.length} routes · ${Object.keys(customProof.assetHashes).length} assets`,
	);
}

const isDirectRun =
	process.argv[1] !== undefined &&
	import.meta.url === pathToFileURL(process.argv[1]).href;
if (isDirectRun) {
	main().catch((error: unknown) => {
		console.error(`LIVE PARITY FAILED: ${String(error instanceof Error ? error.message : error)}`);
		process.exitCode = 1;
	});
}
