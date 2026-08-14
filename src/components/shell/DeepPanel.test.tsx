import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { DeepPanel } from "./DeepPanel";

describe("DeepPanel", () => {
	it("exposes its controlled content as a named region", () => {
		render(<DeepPanel title="the evidence" body="Details" />);
		const disclosure = screen.getByRole("button", { name: /the evidence/i });
		fireEvent.click(disclosure);

		expect(
			screen.getByRole("region", { name: /the evidence/i }),
		).toBeInTheDocument();
		expect(disclosure).toHaveAttribute("aria-expanded", "true");
	});
});
