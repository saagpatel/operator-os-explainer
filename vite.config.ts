/// <reference types="vitest/config" />
import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";

export default defineConfig({
	plugins: [react()],
	build: {
		// NON-NEGOTIABLE: source maps bake /Users/ build-machine paths into
		// shipped artifacts (SPEC 3.3 mechanism 5).
		sourcemap: false,
	},
	test: {
		environment: "jsdom",
		globals: true,
		setupFiles: ["./src/test/setup.ts"],
	},
});
