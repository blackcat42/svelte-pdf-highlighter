// Reexport your entry components here

export { default as PdfLoader} from "./components/PdfLoader.svelte";
export { default as PdfHighlighter} from "./components/PdfHighlighter.svelte";
export { default as AreaHighlight} from "./components/AreaHighlight.svelte";
export { default as TextHighlight} from "./components/TextHighlight.svelte";
export { default as MonitoredHighlightContainer} from "./components/MonitoredHighlightContainer.svelte";

export { HighlightsModel } from "./HighlightsModel.svelte.ts";
export * from "./types.ts"

/*export { PdfHighlighter } from "./components/PdfHighlighter";
export { Tip } from "./components/Tip";
export { Highlight } from "./components/Highlight";
export { Popup } from "./components/Popup";
export { AreaHighlight } from "./components/AreaHighlight";
export { PdfLoader } from "./components/PdfLoader";

import "./style/index.css";

export * from "./types";*/