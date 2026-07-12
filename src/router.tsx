import { createBrowserRouter } from "react-router-dom";
import { ConsoleShell } from "./components/shell/ConsoleShell";
import { PlaceholderScene } from "./scenes/PlaceholderScene";

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
			{ path: "fleet", element: <PlaceholderScene /> },
			{ path: "spine", element: <PlaceholderScene /> },
			{ path: "safety", element: <PlaceholderScene /> },
			{ path: "finale", element: <PlaceholderScene /> },
			{ path: "hub", element: <PlaceholderScene /> },
			{ path: "coda", element: <PlaceholderScene /> },
		],
	},
]);
