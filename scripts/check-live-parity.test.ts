import { describe, expect, it } from "vitest";
import {
	assetContentTypeError,
	extractAssetPaths,
	fetchBytes,
	metadataErrors,
	requiredExpectedDeploymentId,
	requiredVercelScope,
	ROUTES,
} from "./check-live-parity.ts";

const metadata = `
<link href="https://operator.saagarpatel.dev/" rel="canonical">
<meta content="https://operator.saagarpatel.dev/" property="og:url">
<meta property="og:image" content="https://operator.saagarpatel.dev/og.png">
<meta name="twitter:image" content="https://operator.saagarpatel.dev/og.png">
`;

describe("live parity contract", () => {
	it("requires deployment scope without publishing an account fallback", () => {
		expect(() => requiredVercelScope({})).toThrow(
			"VERCEL_TEAM_SCOPE is required",
		);
		expect(requiredVercelScope({ VERCEL_TEAM_SCOPE: " team-scope " })).toBe(
			"team-scope",
		);
	});

	it("requires the promoted deployment identity for live readback", () => {
		expect(() => requiredExpectedDeploymentId({})).toThrow(
			"EXPECTED_DEPLOYMENT_ID is required",
		);
		expect(
			requiredExpectedDeploymentId({ EXPECTED_DEPLOYMENT_ID: " dpl_verified " }),
		).toBe("dpl_verified");
	});

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

	it("rejects the SPA HTML fallback when an asset is missing", () => {
		expect(assetContentTypeError("/assets/app.js", "text/html; charset=utf-8"))
			.toContain("not the expected asset type");
		expect(assetContentTypeError("/assets/app.js", "application/javascript"))
			.toBeNull();
		expect(assetContentTypeError("/assets/app.css", "text/css; charset=utf-8"))
			.toBeNull();
		expect(assetContentTypeError("/og.png", "image/png")).toBeNull();
	});

	it("rejects route redirects instead of hashing the final root shell", async () => {
		let redirectMode: RequestInit["redirect"];
		const redirectingFetch = async (_url: string, init: RequestInit) => {
			redirectMode = init.redirect;
			return new Response(null, {
				status: 302,
				headers: { location: "/" },
			});
		};

		await expect(
			fetchBytes("https://operator.saagarpatel.dev/coda", redirectingFetch),
		).rejects.toThrow("redirected with HTTP 302");
		expect(redirectMode).toBe("manual");
	});

	it("sends the protection bypass secret only when the environment carries one", async () => {
		const seen: Array<Record<string, string>> = [];
		const recordingFetch = async (_url: string, init: RequestInit) => {
			seen.push({ ...(init.headers as Record<string, string>) });
			return new Response("ok", {
				status: 200,
				headers: { "content-type": "text/plain" },
			});
		};

		await fetchBytes("https://example.test/", recordingFetch, {});
		await fetchBytes("https://example.test/", recordingFetch, {
			VERCEL_AUTOMATION_BYPASS_SECRET: " secret-value ",
		});

		expect(seen[0]).not.toHaveProperty("x-vercel-protection-bypass");
		expect(seen[1]["x-vercel-protection-bypass"]).toBe("secret-value");
		expect(seen[1]["user-agent"]).toBe("operator-os-explainer-live-parity/1");
	});

	it("names the bypass variable when a deployment redirects to Vercel SSO", async () => {
		const ssoFetch = async () =>
			new Response(null, {
				status: 302,
				headers: {
					location:
						"https://vercel.com/sso-api?url=https%3A%2F%2Fexample.vercel.app%2F&nonce=abc",
				},
			});

		await expect(
			fetchBytes("https://example.vercel.app/", ssoFetch, {}),
		).rejects.toThrow(
			"behind Vercel Deployment Protection (HTTP 302 to Vercel SSO); set VERCEL_AUTOMATION_BYPASS_SECRET",
		);
	});
});
