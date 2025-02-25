<script lang="ts"> 
    import ContextMenu from "./ContextMenu.svelte";
    import type { ContextMenuProps } from "./ContextMenu.svelte";
    import HighlightContainer from "./HighlightContainer.svelte";
    import Sidebar from "./Sidebar.svelte";
    import Toolbar from "./Toolbar.svelte";
    import PdfLoader from "$lib/components/PdfLoader.svelte";
    import PdfHighlighter from "$lib/components/PdfHighlighter.svelte";

    import { testHighlights as _testHighlights } from "./test-highlights.ts";
    const TEST_HIGHLIGHTS = _testHighlights;

    import type {
        Highlight, 
        ViewportHighlight, 
        CommentedHighlight, 
        Tip, 
        PdfScaleValue
    } from "$lib/types.ts";

    import type { DocumentInitParameters } from "pdfjs-dist/types/src/display/api.d.ts";

    import { onMount, setContext, getContext } from 'svelte';
    import { HighlightsModel } from "$lib/HighlightsModel.svelte.ts";

    //let s_hash = $state('');
    //const parseIdFromHash = () => {
    //  return s_hash.slice("#highlight-".length);
    //};
    //const resetHash = () => {
    //  s_hash = "";
    //};

    let colors = setContext('colors', ['#fcf151', '#ff659f', '#83f18d', '#67dfff', '#b581fe']);
    let url: string | URL | DocumentInitParameters = $state("https://arxiv.org/pdf/2203.11115");
    setContext('document', url);
    //document: string | URL | TypedArray | DocumentInitParameters;


    let pdfScaleValue: {val: PdfScaleValue} = $state({val: 1});
    setContext('pdfScaleValue', pdfScaleValue)
    const setPdfScaleValue = (value: PdfScaleValue) => {
        if (typeof value === "string") {
            pdfScaleValue.val = value;
        } else if (value >= 2 || value <= 0) {
            pdfScaleValue.val = 1;
        } else {
            pdfScaleValue.val = parseFloat(value.toFixed(1));
        } 
    }

    let _highlights: Array<Highlight> = TEST_HIGHLIGHTS["https://arxiv.org/pdf/2203.11115"] ?? [];
    let highlightsStore = new HighlightsModel(_highlights);
    //let unsubscribe = highlightsStore.subscribe((h)=>{})

    let contextMenu: ContextMenuProps|null = $state(null);

    type tool = 'text_selection'|'hand'|'highlight_pen'|'area_selection';
    let selectedTool: tool = $state('text_selection');

    let workerUrl: string | null = $state(null);
    // (async () => {
    //     workerUrl = (await import("pdfjs-dist/build/pdf.worker?url")).default; //vite.dev/guide/assets.html#explicit-url-imports
    // })();
    workerUrl = "https://unpkg.com/pdfjs-dist@4.4.168/build/pdf.worker.min.mjs";

    onMount(() => {
        const handleClick = () => {
            if (contextMenu) {
                contextMenu = null;
            }
        };
        document.addEventListener("click", handleClick);

        return () => {
            document.removeEventListener("click", handleClick);
        };
    });
    //, [contextMenu]

    const handleContextMenu = (
        event: MouseEvent,
        type: 'highlight' | 'document',
        data: ViewportHighlight<CommentedHighlight> | null,
    ) => {
        event.stopPropagation();
        event.preventDefault();
        if (type === 'highlight' && data) {
            contextMenu = {
                xPos: event.clientX,
                yPos: event.clientY,
                target: {
                    type: 'highlight',
                    deleteHighlight: () => highlightsStore.deleteHighlight(data),
                    //editComment: () => editComment(data),
                },
            };
        } else if (type === 'document') {
            contextMenu = {
                xPos: event.clientX,
                yPos: event.clientY,
                target: {
                    type: 'document',
                    enableTextSelection: () => {selectedTool = 'text_selection'},
                    enableDragScroll: () => {selectedTool = 'hand'},
                    enableHighlightPen: () => {selectedTool = 'highlight_pen'},
                    enableAreaSelection: () => {selectedTool = 'area_selection'},
                    selectedTool,
                },
            }
        }
        
    };

    let sidebarScrollToId: (id:string)=>void;
    
    let setTip = $state(()=>{});

    let searchInPdf = $state({search: null});
    const onSearch = (callback) => {
        searchInPdf.search = callback;
    }

    const resetHighlights = () => {
        highlightsStore.highlights = [];
    };

    let pdfHighlighterUtils = $state.raw({utils: null});
    const setPdfHighlighterUtils = (obj) => {
        pdfHighlighterUtils = obj;
    }

    // Scroll to highlight based on hash in the URL
    /*const scrollToHighlightFromHash = () => {
        //TODO
        const highlight = highlightsStore.getHighlightById(parseIdFromHash());

        if (highlight && pdfHighlighterUtils.utils) {
            pdfHighlighterUtils.utils.scrollToHighlight(highlight);
        }
    };*/

    // const setSelection = (selection) {
    // 	highlightPen ? (selection) =>  : undefined;
    // }

    let resetHash = "";
    console.log(url);

</script>

<style>
    :global(body) {
        margin: 0;
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Oxygen', 'Ubuntu',
            'Cantarell', 'Fira Sans', 'Droid Sans', 'Helvetica Neue', sans-serif;
        background-color: #ffffff;
        color: #333333;
    }
</style>

<div class="App" style="display: flex; height: 100vh;">
    <Sidebar
    	bind:highlights={highlightsStore.highlights}
        resetHighlights={resetHighlights}
        toggleDocument={()=>{}}
        editHighlight = {highlightsStore.editHighlight}
        deleteHighlight = {highlightsStore.deleteHighlight}
        sidebarScrollToId = {(callback: (id: string) => void) => sidebarScrollToId = callback}
        {pdfHighlighterUtils}
        {colors}
    />
    <div
        style="height: 100vh; width: 75vw; overflow: hidden; position: relative; flexGrow: 1"
    >
    <Toolbar setPdfScaleValue = {setPdfScaleValue}
             pdfScaleValue = {pdfScaleValue}
        	 bind:selectedTool = {selectedTool}
             searchInPdf = {searchInPdf} />

    {#if workerUrl !== null}         
    <PdfLoader document={url} workerSrc={workerUrl}>
       	{#snippet pdfHighlighterWrapper(pdfDocumentRef)}
        <!-- {pdfDocumentRef?._pdfInfo?.numPages} -->
			<PdfHighlighter
                bind:highlightsStore
                bind:selectedTool 
		        pdfDocument={pdfDocumentRef}
		        style="height: calc(100% - 41px)"
                onContextMenu={(e)=>handleContextMenu(e,'document',null)}
                {pdfScaleValue}
                {setPdfScaleValue}
                onTipUpdate={(tipUpdater) => setTip = tipUpdater}
                {setTip}
                {onSearch}
                {setPdfHighlighterUtils}
            >
            <HighlightContainer
                {setTip}
               	editHighlight = {highlightsStore.editHighlight}
                onContextMenu={(e, data)=>handleContextMenu(e,'highlight',data)}
                onClick = {(e, data) => {
                    e.stopPropagation();
                    sidebarScrollToId(data.id);
                    //setTip({highlight: data, show: true, position: data.position}, true, true);
                }}
                {pdfHighlighterUtils}
            /> 
            </PdfHighlighter>
		{/snippet}
          
        </PdfLoader>
    {/if}
      </div>

      {#if contextMenu} <ContextMenu {...contextMenu} /> {/if}
    </div>

<!-- disable browser default search bar -->
<svelte:window 
    onkeydown={
        (event) => {
            if ((event.code === "KeyF" && event.getModifierState("Control")) || event.code === "F3") {
                event.preventDefault();
            }
    }} 
/>
