import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
import { AtlasStoreProvider } from "react-iiif-vault";
import App from "./App.tsx";

createRoot(document.getElementById("root")!).render(
	<StrictMode>
		<AtlasStoreProvider>
			<App />
		</AtlasStoreProvider>
	</StrictMode>,
);
