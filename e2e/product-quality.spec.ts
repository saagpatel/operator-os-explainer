import AxeBuilder from "@axe-core/playwright";
import { expect, test, type Page } from "@playwright/test";
import path from "node:path";

const routes = [
	{ path: "/", heading: "Watch one task travel the whole OS", slug: "opening" },
	{ path: "/fleet", heading: "The Fleet", slug: "fleet" },
	{ path: "/spine", heading: "The Spine", slug: "spine" },
	{ path: "/safety", heading: "The Safety Layers", slug: "safety" },
	{ path: "/finale", heading: "The Fleet in Motion", slug: "finale" },
	{ path: "/hub", heading: "The Hub", slug: "hub" },
	{ path: "/coda", heading: "Coda", slug: "coda" },
	{ path: "/not-a-scene", heading: "Scene not found", slug: "not-found" },
] as const;

const viewports = [
	{ width: 320, height: 720 },
	{ width: 390, height: 844 },
	{ width: 768, height: 1024 },
	{ width: 1024, height: 768 },
	{ width: 1440, height: 900 },
] as const;

const titleFor = (heading: string) =>
	`${heading} — Anatomy of an AI Operator OS`;

/** Mechanism diagrams each scene's deep panel carries (src/diagrams placement). */
const diagramsByRoute: Record<string, number> = {
	"/": 0,
	"/fleet": 0,
	"/spine": 2,
	"/safety": 1,
	"/finale": 0,
	"/hub": 2,
	"/coda": 1,
};

async function openStable(page: Page, route: string) {
	await page.emulateMedia({ reducedMotion: "reduce" });
	await page.goto(route, { waitUntil: "domcontentloaded" });
	await expect(page.locator("h1")).toBeVisible();
	await expect(page.locator("html")).toHaveAttribute(
		"data-reduced-motion",
		"true",
	);
}

test.describe("route identity and semantics", () => {
	test("the declared favicon is available without a console-visible 404", async ({
		page,
	}) => {
		await openStable(page, "/");
		const iconHref = await page.locator("link[rel='icon']").getAttribute("href");
		expect(iconHref).toBe("/favicon.svg");
		const response = await page.request.get(iconHref!);
		expect(response.status()).toBe(200);
		expect(response.headers()["content-type"]).toContain("image/svg+xml");
	});

	for (const route of routes) {
		test(`${route.slug} has a named scene and route-specific title`, async ({
			page,
		}) => {
			await openStable(page, route.path);
			await expect(page.getByRole("heading", { level: 1 })).toHaveText(
				route.heading,
			);
			await expect(page).toHaveTitle(titleFor(route.heading));
			await expect(page.getByRole("main")).toBeVisible();
			await expect(page.locator("[aria-label='Scenes']")).toBeVisible();
		});
	}

	for (const width of [320, 1440] as const) {
		for (const route of routes) {
			test(`${route.slug} passes automated WCAG checks at ${width}px`, async ({
				page,
			}) => {
				await page.setViewportSize({ width, height: width === 320 ? 720 : 900 });
				await openStable(page, route.path);
				const results = await new AxeBuilder({ page })
					.withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa"])
					.analyze();
				expect(results.violations).toEqual([]);
			});
		}
	}
});

test.describe("responsive scene matrix", () => {
	for (const viewport of viewports) {
		test(`all scenes avoid horizontal page overflow at ${viewport.width}px`, async ({
			page,
		}) => {
			await page.setViewportSize(viewport);
			for (const route of routes) {
				await openStable(page, route.path);
				const overflow = await page.evaluate(() => ({
					document: document.documentElement.scrollWidth - document.documentElement.clientWidth,
					body: document.body.scrollWidth - document.body.clientWidth,
				}));
				expect(overflow, `${route.path} overflow at ${viewport.width}px`).toEqual({
					document: 0,
					body: 0,
				});

				const evidenceDir = process.env.EVIDENCE_DIR;
				if (evidenceDir) {
					await page.screenshot({
						path: path.join(evidenceDir, `${route.slug}-${viewport.width}.png`),
						animations: "disabled",
					});
				}
			}
		});
	}

	for (const viewport of [viewports[0], viewports[4]]) {
		test(`interactive targets are usable at ${viewport.width}px`, async ({ page }) => {
			await page.setViewportSize(viewport);
			await openStable(page, "/coda");
			const minimum = viewport.width < 640 ? 44 : 24;
			const targets = page.locator("a[href], button, input[type='range']");
			const failures: string[] = [];
			for (let index = 0; index < (await targets.count()); index += 1) {
				const target = targets.nth(index);
				if (!(await target.isVisible()) || (await target.isDisabled())) continue;
				const box = await target.boundingBox();
				if (!box || (box.width >= minimum && box.height >= minimum)) continue;
				failures.push(
					`${await target.evaluate((element) => element.outerHTML.slice(0, 180))} => ${Math.round(box.width)}x${Math.round(box.height)}`,
				);
			}
			expect(failures).toEqual([]);
		});
	}

	test("320px chrome preserves scene space and keeps the active route visible", async ({
		page,
	}) => {
		await page.setViewportSize(viewports[0]);
		await openStable(page, "/coda");
		const mainBox = await page.getByRole("main").boundingBox();
		expect(mainBox?.height).toBeGreaterThanOrEqual(viewports[0].height * 0.45);

		const navBox = await page.getByRole("navigation", { name: "Scenes" }).boundingBox();
		const activeBox = await page
			.getByRole("link", { name: "06 Coda", current: "page" })
			.boundingBox();
		expect(activeBox && navBox && activeBox.x >= navBox.x).toBe(true);
		expect(
			activeBox && navBox && activeBox.x + activeBox.width <= navBox.x + navBox.width,
		).toBe(true);
	});

	test("all scenes remain operable at 200% text scaling", async ({ page }) => {
		await page.setViewportSize({ width: 390, height: 844 });
		for (const route of routes) {
			await openStable(page, route.path);
			await page.evaluate(() => {
				document.documentElement.style.fontSize = "200%";
			});
			await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
			const overflow = await page.evaluate(() => ({
				document:
					document.documentElement.scrollWidth -
					document.documentElement.clientWidth,
				body: document.body.scrollWidth - document.body.clientWidth,
			}));
			expect(overflow, `${route.path} overflow at 200% text`).toEqual({
				document: 0,
				body: 0,
			});
		}
	});

	test("all scenes avoid page overflow in phone landscape", async ({ page }) => {
		await page.setViewportSize({ width: 844, height: 390 });
		for (const route of routes) {
			await openStable(page, route.path);
			await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
			const overflow = await page.evaluate(() =>
				document.documentElement.scrollWidth -
				document.documentElement.clientWidth,
			);
			expect(overflow, `${route.path} overflow in phone landscape`).toBe(0);
		}
	});
});

test.describe("keyboard, focus, motion, and state", () => {
	test("keyboard route changes move focus to the new scene heading", async ({
		page,
	}) => {
		await openStable(page, "/");
		const fleetLink = page.getByRole("link", { name: "01 Fleet" });
		await fleetLink.focus();
		await page.keyboard.press("Enter");
		await expect(page).toHaveURL(/\/fleet$/);
		await expect(page.getByRole("heading", { level: 1 })).toBeFocused();
		await expect(page.getByRole("heading", { level: 1 })).toHaveText("The Fleet");
	});

	test("transport shortcuts work globally but not inside controls", async ({ page }) => {
		await openStable(page, "/spine?t=0");
		const scrubber = page.getByRole("slider", { name: "Session clock scrubber" });
		await page.locator("h1").click();
		await page.keyboard.press("End");
		await expect(scrubber).toHaveValue(await scrubber.getAttribute("max"));

		await scrubber.focus();
		const before = Number(await scrubber.inputValue());
		await page.keyboard.press("ArrowLeft");
		expect(Number(await scrubber.inputValue())).toBe(before - 100);
		await expect(page.getByRole("button", { name: "Play" })).toBeVisible();
	});

	test("reduced motion prevents autoplay while user transport stays operable", async ({
		page,
	}) => {
		await openStable(page, "/");
		await expect(page.getByRole("button", { name: "Play" })).toBeVisible();
		await page.locator("h1").click();
		await page.keyboard.press("Space");
		await expect(page.getByRole("button", { name: "Pause" })).toBeVisible();
		await page.getByRole("button", { name: "Pause" }).click();
		await expect(page.getByRole("button", { name: "Play" })).toBeVisible();
	});

	test("deep panel is a named disclosure and restores focus on collapse", async ({
		page,
	}) => {
		await openStable(page, "/spine");
		const disclosure = page.getByRole("button", { name: /go deeper/i });
		await disclosure.focus();
		await disclosure.press("Enter");
		await expect(disclosure).toHaveAttribute("aria-expanded", "true");
		const controlledId = await disclosure.getAttribute("aria-controls");
		const region = page.locator(`#${controlledId}`);
		await expect(region).toHaveRole("region");
		await expect(region).toHaveAccessibleName(/the five row shapes/i);
		await disclosure.press("Enter");
		await expect(disclosure).toBeFocused();
	});

	test("deep links validate timeline and interaction parameters", async ({ page }) => {
		await openStable(page, "/fleet?t=5000&chips=feature,not-real");
		await expect(page.getByRole("slider", { name: "Session clock scrubber" })).toHaveValue(
			"5000",
		);
		await expect(page.getByRole("button", { name: /route the feature task/i })).toBeDisabled();
		await expect(page.getByRole("button", { name: /route the sweep task/i })).toBeEnabled();

		await openStable(page, "/safety?t=not-a-time&rule=not-real");
		await expect(page.getByRole("slider", { name: "Session clock scrubber" })).toHaveValue(
			"0",
		);
		await expect(
			page
				.getByRole("group", { name: "Risky action demonstrations" })
				.getByRole("button", { pressed: true }),
		).toHaveCount(0);
	});

	test("back and forward navigation restore route identity and scene focus", async ({
		page,
	}) => {
		await openStable(page, "/");
		await page.getByRole("link", { name: "01 Fleet" }).click();
		await page.getByRole("link", { name: "03 Safety" }).click();
		await page.goBack();
		await expect(page).toHaveURL(/\/fleet$/);
		await expect(page.getByRole("heading", { level: 1 })).toBeFocused();
		await page.goForward();
		await expect(page).toHaveURL(/\/safety$/);
		await expect(page.getByRole("heading", { level: 1 })).toBeFocused();
	});
});

test.describe("scene interaction dispositions", () => {
	test("opening gives a first-time visitor an immediate route into the system", async ({
		page,
	}) => {
		await page.emulateMedia({ reducedMotion: "no-preference" });
		await page.goto("/", { waitUntil: "domcontentloaded" });

		const briefing = page.getByRole("region", {
			name: "First-visit briefing",
		});
		await expect(briefing).toContainText("personal multi-agent Operator OS");
		await expect(briefing).toContainText(
			"Evidence defines what is proven; authority defines what the system may do",
		);
		await expect(briefing).toContainText("deterministic synthetic data");

		const start = page.getByRole("link", { name: /start with routing/i });
		await expect(start).toBeVisible();
		await start.focus();
		await start.press("Enter");
		await expect(page).toHaveURL(/\/fleet$/);
		await expect(page.getByRole("heading", { level: 1 })).toBeFocused();
	});

	test("opening settles deterministically under reduced motion", async ({ page }) => {
		await openStable(page, "/");
		await expect(page.getByTestId("open-caption")).toContainText("Synced to the build log");
		await expect(page.getByTestId("explore-invite")).toBeVisible();
		await expect(
			page.getByRole("img", { name: /whole operator OS as a constellation/i }),
		).toBeVisible();
	});

	test("fleet routes every tray task by keyboard and exposes a named log", async ({
		page,
	}) => {
		await openStable(page, "/fleet?t=0");
		for (const taskClass of ["feature", "sweep", "essay", "audit"]) {
			const button = page.getByRole("button", {
				name: `Route the ${taskClass} task to its owner`,
			});
			await button.focus();
			await button.press("Enter");
			await expect(button).toBeDisabled();
			await expect(page.getByTestId(`chip-docked-${taskClass}`)).toBeVisible();
		}
		await expect(page.getByRole("log", { name: "Dispatch log" })).toBeVisible();
		await expect(page.getByTestId("fleet-takeaway")).toBeVisible();
	});

	test("spine steps the complete handoff and keeps empty/replay states honest", async ({
		page,
	}) => {
		await openStable(page, "/spine?t=0");
		await expect(page.getByText(/feed empty at/i)).toBeVisible();
		await expect(page.getByText(/bridge feed · synthetic replay/i)).toBeVisible();
		const step = page.getByRole("button", { name: "Step the handoff to its next stage" });
		for (let count = 1; count <= 5; count += 1) {
			await step.press("Enter");
			await expect(step).toContainText(`Step handoff ${count}/5`);
		}
		await expect(step).toBeDisabled();
		await expect(page.getByTestId("spine-takeaway")).toBeVisible();
	});

	test("safety gives every fabricated action a pressed state and named outcome", async ({
		page,
	}) => {
		await openStable(page, "/safety?t=0");
		const group = page.getByRole("group", { name: "Risky action demonstrations" });
		const buttons = group.getByRole("button");
		expect(await buttons.count()).toBeGreaterThan(1);
		for (let index = 0; index < (await buttons.count()); index += 1) {
			const button = buttons.nth(index);
			await button.focus();
			await button.press("Enter");
			await expect(button).toHaveAttribute("aria-pressed", "true");
			await expect(page.getByTestId("guard-outcome")).toContainText("blocked by:");
			await expect(page.getByTestId("adaptation")).toBeVisible();
		}
		await expect(page.getByTestId("safety-takeaway")).toBeVisible();
		await expect(page.getByRole("log", { name: "Guard event log" })).toHaveAttribute(
			"aria-live",
			"polite",
		);
	});

	test("finale run/pause and deterministic completion remain keyboard operable", async ({
		page,
	}) => {
		await openStable(page, "/finale?t=6000");
		const run = page.getByRole("button", { name: "Run the mission" });
		await run.focus();
		await run.press("Enter");
		await expect(page.getByRole("button", { name: "Pause the mission" })).toBeVisible();
		await page.getByRole("button", { name: "Pause the mission" }).press("Enter");
		await expect(page.getByRole("button", { name: "Run the mission" })).toBeVisible();

		const scrubber = page.getByRole("slider", { name: "Session clock scrubber" });
		await scrubber.focus();
		await scrubber.press("End");
		await expect(page.getByTestId("finale-takeaway")).toBeVisible();
		await expect(page.getByRole("button", { name: "Replay the mission" })).toBeVisible();
	});

	test("hub exposes empty, staged, unavailable, and stale replay states", async ({ page }) => {
		await openStable(page, "/hub?t=0");
		await expect(page.getByTestId("airlock-note")).toContainText("airlock is empty");
		await expect(page.locator("[data-state='unavailable']")).toHaveCount(5);
		const step = page.getByRole("button", {
			name: "Step the draft through the next airlock chamber",
		});
		for (let count = 1; count <= 3; count += 1) {
			await step.press("Enter");
			await expect(step).toContainText(`Step airlock ${count}/3`);
		}
		await expect(step).toBeDisabled();
		await expect(page.getByTestId("hub-takeaway")).toBeVisible();

		const scrubber = page.getByRole("slider", { name: "Session clock scrubber" });
		await scrubber.focus();
		await scrubber.press("End");
		await expect(page.getByTestId("overlay-stale-note")).toBeVisible();
	});

	test("coda keeps public proof links explicit and replays without opening them", async ({
		page,
	}) => {
		await openStable(page, "/coda");
		const workshop = page.getByRole("region", { name: "Continue into the proof workshop" });
		const proofLinks = workshop.getByRole("link", { name: /opens in a new tab/i });
		await expect(proofLinks).toHaveCount(3);
		for (let index = 0; index < 3; index += 1) {
			await expect(proofLinks.nth(index)).toHaveAttribute("target", "_blank");
			await expect(proofLinks.nth(index)).toHaveAttribute("rel", /noopener/);
		}
		const replay = page.getByRole("link", { name: "Replay from the opening" });
		await replay.focus();
		await replay.press("Enter");
		await expect(page).toHaveURL(/\/$/);
		await expect(page.getByRole("heading", { level: 1 })).toBeFocused();
	});

	test("not-found recovery returns to the opening with restored focus", async ({ page }) => {
		await openStable(page, "/invalid/deep/path?ignored=yes");
		const recovery = page.getByRole("link", { name: "Return to opening" });
		await recovery.focus();
		await recovery.press("Enter");
		await expect(page).toHaveURL(/\/$/);
		await expect(page.getByRole("heading", { level: 1 })).toBeFocused();
	});

	test("every scene deep panel remains named and horizontally contained at 320px", async ({
		page,
	}) => {
		await page.setViewportSize(viewports[0]);
		for (const route of routes.filter((route) => route.slug !== "not-found")) {
			await openStable(page, route.path);
			const disclosure = page.getByRole("button", { name: /go deeper/i });
			await disclosure.press("Enter");
			const region = page.getByRole("region", { name: /go deeper/i });
			await expect(region).toBeVisible();
			const figures = region.locator("figure[data-diagram]");
			await expect(figures).toHaveCount(diagramsByRoute[route.path] ?? 0);
			for (const figure of await figures.all()) {
				const svg = figure.getByRole("img");
				await expect(svg).toBeVisible();
				expect((await svg.getAttribute("aria-label"))?.length ?? 0).toBeGreaterThan(40);
			}
			const overflow = await page.evaluate(() =>
				document.documentElement.scrollWidth - document.documentElement.clientWidth,
			);
			expect(overflow, `${route.path} expanded panel overflow`).toBe(0);
		}
	});

	for (const width of [320, 1440] as const) {
		for (const route of routes.filter((r) => (diagramsByRoute[r.path] ?? 0) > 0)) {
			test(`${route.slug} deep panel with its diagrams passes WCAG checks at ${width}px`, async ({
				page,
			}) => {
				await page.setViewportSize({ width, height: width === 320 ? 720 : 900 });
				await openStable(page, route.path);
				await page.getByRole("button", { name: /go deeper/i }).press("Enter");
				await expect(page.getByRole("region", { name: /go deeper/i })).toBeVisible();
				const results = await new AxeBuilder({ page })
					.withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa"])
					.analyze();
				expect(results.violations).toEqual([]);
			});
		}
	}
});

test("all routes remain free of runtime console and page errors", async ({ page }) => {
	const errors: string[] = [];
	page.on("console", (message) => {
		if (message.type() === "error") errors.push(`console: ${message.text()}`);
	});
	page.on("pageerror", (error) => errors.push(`page: ${error.message}`));
	for (const route of routes) await openStable(page, route.path);
	expect(errors).toEqual([]);
});
