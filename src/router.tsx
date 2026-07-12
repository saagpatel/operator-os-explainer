import { createBrowserRouter } from "react-router-dom";
import { ConsoleShell } from "./components/shell/ConsoleShell";
import { FleetScene } from "./scenes/FleetScene";
import { PlaceholderScene } from "./scenes/PlaceholderScene";
import { SpineScene } from "./scenes/SpineScene";

/**
 * Route table (SPEC 4.6). SPA data-router; the session clock provider mounts
 * inside ConsoleShell ABOVE the outlet so it survives scene navigation.
 */
export const router = createBrowserRouter([
	{
		path: "/",
		element: <ConsoleShell />,
		children: [
			{ index: true, element: <PlaceholderScene /> },
			{ path: "fleet", element: <FleetScene /> },
			{ path: "spine", element: <SpineScene /> },
			{ path: "safety", element: <PlaceholderScene /> },
			{ path: "finale", element: <PlaceholderScene /> },
			{ path: "hub", element: <PlaceholderScene /> },
			{ path: "coda", element: <PlaceholderScene /> },
		],
	},
]);
