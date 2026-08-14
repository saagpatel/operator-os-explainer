/// <reference types="vitest/config" />
import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";

export default defineConfig({
	plugins: [react()],
	build: {
		// NON-NEGOTIABLE: source maps bake absolute build-machine paths into
		// shipped artifacts (SPEC 3.3 mechanism 5).
		sourcemap: false,
		rolldownOptions: {
			output: {
				codeSplitting: {
					groups: [{ name: "vendor", test: /node_modules/ }],
				},
			},
		},
	},
	test: {
		environment: "jsdom",
		globals: true,
		include: ["src/**/*.test.{ts,tsx}", "scripts/**/*.test.ts"],
		maxWorkers: 1,
		setupFiles: ["./src/test/setup.ts"],
	},
});
