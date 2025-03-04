// Reexport your entry components here

export { default as PdfLoader } from '$lib/components/PdfLoader.svelte';
export { default as PdfHighlighter } from '$lib/components/PdfHighlighter.svelte';
export { default as AreaHighlight } from '$lib/components/AreaHighlight.svelte';
export { default as TextHighlight } from '$lib/components/TextHighlight.svelte';
export { default as MonitoredHighlightContainer } from '$lib/components/MonitoredHighlightContainer.svelte';

export { HighlightsModel } from '$lib/HighlightsModel.svelte';
export * from '$lib/types';

/*export { PdfHighlighter } from "./components/PdfHighlighter";
export { Tip } from "./components/Tip";
export { Highlight } from "./components/Highlight";
export { Popup } from "./components/Popup";
export { AreaHighlight } from "./components/AreaHighlight";
export { PdfLoader } from "./components/PdfLoader";

import "./style/index.css";

export * from "./types";*/
