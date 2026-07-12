import type { Config } from "tailwindcss";

export default {
	content: ["./index.html", "./src/**/*.{ts,tsx}"],
	theme: {
		extend: {
			colors: {
				paper: "var(--paper)",
				ink: "var(--ink)",
				"ink-muted": "var(--ink-muted)",
				deck: "var(--deck)",
				"deck-raised": "var(--deck-raised)",
				"deck-line": "var(--deck-line)",
				"ink-deck": "var(--ink-deck)",
				"ink-deck-muted": "var(--ink-deck-muted)",
				accent: "var(--accent)",
				"accent-deck": "var(--accent-deck)",
			},
			fontFamily: {
				display: "var(--font-display)",
				prose: "var(--font-prose)",
				instrument: "var(--font-instrument)",
			},
		},
	},
	plugins: [],
} satisfies Config;
