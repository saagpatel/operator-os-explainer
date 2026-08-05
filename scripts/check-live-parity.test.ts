import { describe, expect, it } from "vitest";
import {
	extractAssetPaths,
	metadataErrors,
	ROUTES,
} from "./check-live-parity.ts";

const metadata = `
<link href="https://operator.saagarpatel.dev/" rel="canonical">
<meta content="https://operator.saagarpatel.dev/" property="og:url">
<meta property="og:image" content="https://operator.saagarpatel.dev/og.png">
<meta name="twitter:image" content="https://operator.saagarpatel.dev/og.png">
`;

describe("live parity contract", () => {
	it("covers every routed scene plus the unknown-route recovery shell", () => {
		expect(ROUTES).toEqual([
			"/",
			"/fleet",
			"/spine",
			"/safety",
			"/finale",
			"/hub",
			"/coda",
			"/scene-that-does-not-exist",
		]);
	});

	it("accepts canonical metadata regardless of attribute order", () => {
		expect(metadataErrors(metadata)).toEqual([]);
	});

	it("fails closed when canonical metadata drifts", () => {
		expect(
			metadataErrors(
				metadata.replace(
					"https://operator.saagarpatel.dev/\" property=\"og:url",
					"https://operator-os-explainer.vercel.app/\" property=\"og:url",
				),
			),
		).toContain("missing or incorrect Open Graph URL");
	});

	it("extracts and sorts only deploy-relevant assets", () => {
		const html = `
			<link rel="stylesheet" href="/assets/app-b.css">
			<script src="/assets/app-a.js"></script>
			<meta property="og:image" content="https://operator.saagarpatel.dev/og.png">
			<a href="/coda">Coda</a>
			<script src="/assets/app-a.js"></script>
		`;
		expect(extractAssetPaths(html)).toEqual([
			"/assets/app-a.js",
			"/assets/app-b.css",
			"/og.png",
		]);
	});
});
