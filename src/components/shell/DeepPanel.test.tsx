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

	it("keeps its figures inside the region and hidden until opened", () => {
		render(
			<DeepPanel title="the evidence" body="Details" figures={<figure>a mechanism</figure>} />,
		);
		expect(screen.queryByText("a mechanism")).not.toBeInTheDocument();
		fireEvent.click(screen.getByRole("button", { name: /the evidence/i }));
		const region = screen.getByRole("region", { name: /the evidence/i });
		expect(region).toContainElement(screen.getByText("a mechanism"));
	});
});
