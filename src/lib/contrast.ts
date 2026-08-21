/**
 * WCAG 2.1 relative luminance + contrast ratio (pure, no DOM).
 * Standing gate from Phase 0: src/lib/contrast.test.ts asserts every text
 * pairing in prep/design-tokens.md against these functions.
 */
const HEX = /^#([0-9a-f]{6})$/i;

export function relativeLuminance(hex: string): number {
	const match = HEX.exec(hex);
	if (!match) throw new Error(`expected #rrggbb color, got: ${hex}`);
	const channels = [0, 2, 4].map((offset) => {
		const c = parseInt(match[1].slice(offset, offset + 2), 16) / 255;
		return c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
	});
	return 0.2126 * channels[0] + 0.7152 * channels[1] + 0.0722 * channels[2];
}

export function contrastRatio(a: string, b: string): number {
	const la = relativeLuminance(a);
	const lb = relativeLuminance(b);
	const lighter = Math.max(la, lb);
	const darker = Math.min(la, lb);
	return (lighter + 0.05) / (darker + 0.05);
}
