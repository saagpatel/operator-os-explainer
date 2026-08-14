import { defineConfig, devices } from "@playwright/test";

const baseURL = process.env.PLAYWRIGHT_BASE_URL ?? "http://127.0.0.1:4173";

export default defineConfig({
	testDir: "./e2e",
	fullyParallel: false,
	workers: 1,
	retries: 0,
	timeout: 60_000,
	reporter: "line",
	outputDir:
		process.env.PLAYWRIGHT_OUTPUT_DIR ??
		"/tmp/operator-os-explainer-playwright-results",
	use: {
		...devices["Desktop Chrome"],
		baseURL,
		channel: "chrome",
		headless: true,
		screenshot: "only-on-failure",
		trace: "retain-on-failure",
	},
	webServer: {
		command: "pnpm dev --host 127.0.0.1 --port 4173 --strictPort",
		url: baseURL,
		reuseExistingServer: true,
		timeout: 30_000,
	},
});
