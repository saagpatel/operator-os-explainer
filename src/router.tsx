import { createBrowserRouter } from "react-router-dom";
import { ConsoleShell } from "./components/shell/ConsoleShell";
import { CodaScene } from "./scenes/CodaScene";
import { ColdOpenScene } from "./scenes/ColdOpenScene";
import { FinaleScene } from "./scenes/FinaleScene";
import { FleetScene } from "./scenes/FleetScene";
import { HubScene } from "./scenes/HubScene";
import { SafetyScene } from "./scenes/SafetyScene";
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
			{ index: true, element: <ColdOpenScene /> },
			{ path: "fleet", element: <FleetScene /> },
			{ path: "spine", element: <SpineScene /> },
			{ path: "safety", element: <SafetyScene /> },
			{ path: "finale", element: <FinaleScene /> },
			{ path: "hub", element: <HubScene /> },
			{ path: "coda", element: <CodaScene /> },
		],
	},
]);
