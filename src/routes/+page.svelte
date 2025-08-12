<script lang="ts">

    import { onMount, setContext, } from 'svelte';
    import { on } from 'svelte/events';

    import PdfLoader from '$lib/components/PdfLoader.svelte';
    import PdfHighlighter from '$lib/components/PdfHighlighter.svelte';
    import { HighlightsModel } from '$lib/HighlightsModel.svelte.ts';

    import ContextMenu from './ContextMenu.svelte';
    import Sidebar from './Sidebar.svelte';
    import Toolbar from './Toolbar.svelte';
    import { testHighlights } from './test-highlights.ts';

    import type { DocumentInitParameters } from 'pdfjs-dist/types/src/display/api.d.ts';

    import type {
        Highlight,
        ViewportHighlight,
        CommentedHighlight,
        PdfHighlighterUtils as TPdfHighlighterUtils,
    } from '$lib/types.ts';

    import type { ContextMenuProps } from './ContextMenu.svelte';

    
    const colors = ['#fcf151', '#ff659f', '#83f18d', '#67dfff', '#b581fe'];
    const scrolledTo_color = 'red';
    let contextMenu: ContextMenuProps | null = $state(null);
    let sidebarVisible = $state(true);
    let sidebarScrollToId: (id: string) => void;
    let pdfHighlighterUtils: Partial<TPdfHighlighterUtils> | null = $state(null);

    let workerUrl: string | null = $state(null);
     (async () => {
         workerUrl = (await import("pdfjs-dist/build/pdf.worker?url")).default; // https://vite.dev/guide/assets.html#explicit-url-imports
     })();
    //workerUrl = 'https://unpkg.com/pdfjs-dist@4.4.168/build/pdf.worker.min.mjs';
    let url: string | URL | DocumentInitParameters = $state.raw('https://arxiv.org/pdf/2203.11115');
    //let url: string | URL | DocumentInitParameters = $state('2203.11115v1.pdf');


    /** custom field example */
    // interface MyHighlight extends CommentedHighlight {
    //     custom_field: number;
    // }
    // let _highlights: Array<MyHighlight> = testHighlights['https://arxiv.org/pdf/2203.11115'].map((item) => {
    //     item['custom_field'] = 0;
    //     return item as MyHighlight;
    // });

    let highlightsStore: HighlightsModel<Highlight>|null = $state.raw(null);
    let unsubscribe: () => boolean;

    let setHighlightsModel = (highlights_array?: Array<Highlight>) => {
        if (!highlights_array) highlights_array = testHighlights['https://arxiv.org/pdf/2203.11115'] ?? []
        highlightsStore = new HighlightsModel(highlights_array);
        /** subscribe to highlights model updates  */
        unsubscribe = highlightsStore.subscribe((highlights)=>{
            //save data to server...
            console.log($state.snapshot(highlights));
            if (true) return new Error('Failed to save highlights');
        });
    }


    /** Scroll to highlight based on hash in the URL */
    const parseIdFromHash = () => {
      return document.location.hash.slice('#highlight-'.length);
    };
    const resetHash = () => {
        document.location.hash = '';
    };
    const scrollToHighlightFromHash = () => {
        let id = parseIdFromHash();
        if (id.length < 1) return;
        const highlight = highlightsStore.getHighlightById(id);
        if (highlight && pdfHighlighterUtils.scrollToHighlight) {
            pdfHighlighterUtils.scrollToHighlight(highlight);
        }
    };

    const PRIMARY_PDF_URL = "https://arxiv.org/pdf/2203.11115";
    const SECONDARY_PDF_URL = "https://arxiv.org/pdf/1604.02480";
    const toggleDocument = () => {
        let pdf_url = (url === PRIMARY_PDF_URL) ? SECONDARY_PDF_URL : PRIMARY_PDF_URL;
        pdfHighlighterUtils = {
            textSelectionDelay: 1500,
            selectedColor: colors[0],
            colors: colors,
            scrolledTo_color: scrolledTo_color,
        };
        url = pdf_url;
        setHighlightsModel(testHighlights[pdf_url]);
        //highlightsStore = new HighlightsModel(_highlights);
    };


    /** Event handlers */
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
                    moveDown: () => highlightsStore.moveDown(data),
                    moveUp: () => highlightsStore.moveUp(data),
                    //editComment: () => editComment(data),
                },
            };
        } else if (type === 'document') {
            contextMenu = {
                xPos: event.clientX,
                yPos: event.clientY,
                target: {
                    type: 'document',
                    enableTextSelection: () => {
                        pdfHighlighterUtils.selectedTool = 'text_selection';
                    },
                    enableDragScroll: () => {
                        pdfHighlighterUtils.selectedTool = 'hand';
                    },
                    enableHighlightPen: () => {
                        pdfHighlighterUtils.selectedTool = 'highlight_pen';
                    },
                    enableAreaSelection: () => {
                        pdfHighlighterUtils.selectedTool = 'area_selection';
                    },
                    //pdfHighlighterUtils.selectedTool,
                },
            };
        }
    };
    const handleClick = () => {
        if (contextMenu) {
            contextMenu = null;
        }
    };


    onMount(() => {
        pdfHighlighterUtils = {
            textSelectionDelay: 1500,
            //selectedColor: colors[0],
            //colors: colors,
            scrolledTo_color: scrolledTo_color,
        }
        setHighlightsModel();
        const removeClickHandler = on(
            document,
            'click',
            handleClick,
        );
        // const removeHashChangeHandler = on(
        //     window,
        //     'hashchange',
        //     scrollToHighlightFromHash,
        // );
        return () => {
            removeClickHandler();
            //removeHashChangeHandler();
        };
    });

</script>

<style>
    :global(body) {
        margin: 0;
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Oxygen', 'Ubuntu',
            'Cantarell', 'Fira Sans', 'Droid Sans', 'Helvetica Neue', sans-serif;
        background-color: #ffffff;
        color: #333333;
    }
    :global(.PdfHighlighter) {
        background-color: #DEE2E6;
    }
    /*:global(.TextHighlight__part--scrolledTo) {
        
    }*/
</style>

{#key url}

<!-- svelte-ignore a11y_click_events_have_key_events -->
<!-- svelte-ignore a11y_no_static_element_interactions -->
{#if (highlightsStore !== null)}
<Toolbar  
    bind:pdfHighlighterUtils = {pdfHighlighterUtils}
    bind:sidebarVisible
/>
{/if}
<div class="App" style="display: flex; height: calc(100vh - 2.1rem);">
    {#if (sidebarVisible && highlightsStore !== null)}
    <Sidebar
        highlights={highlightsStore.highlights}
        resetHighlights={highlightsStore.resetHighlights}
        {toggleDocument}
        editHighlight = {highlightsStore.editHighlight}
        deleteHighlight = {highlightsStore.deleteHighlight}
        sidebarScrollToId = {(callback: (id: string) => void) => sidebarScrollToId = callback}
        bind:pdfHighlighterUtils = {pdfHighlighterUtils}
    /> 
    {/if}
    <div style="height: 100%; width: 100%; overflow: hidden; position: relative; flexGrow: 1">
        

        {#if (workerUrl !== null && highlightsStore !== null && pdfHighlighterUtils !== null)}

            <PdfLoader document={url} workerSrc={workerUrl}>

                <!-- Custom error and progress snippets (optional) -->
                <!--
                {#snippet errorMessage(error)}
                    {error}
                {/snippet}
                -->
                <!--
                {#snippet beforeLoad(loadingProgress)}
                    {Math.floor((loadingProgress.loaded / loadingProgress.total) * 100)}%
                {/snippet}
                -->

                {#snippet pdfHighlighterWrapper(pdfDocumentRef)}
                    <PdfHighlighter
                        {highlightsStore}
                        pdfDocument={pdfDocumentRef}
                        pdfViewerOptions = {{
                            //annotationMode: 0,
                        }}
                        style="height: 100%;"
                        onContextMenu={(e)=>handleContextMenu(e,'document',null)}
                        onHighlightContextMenu={(e, data)=>handleContextMenu(e,'highlight',data)}
                        onHighlightClick = {(e, data) => {
                                e.stopPropagation();
                                sidebarScrollToId(data.id);
                            }}
                        bind:pdfHighlighterUtils = {pdfHighlighterUtils}
                        onScrollAway={resetHash}
                        onHighlightsRendered={scrollToHighlightFromHash}
                    >

                        <!-- Custom highlight container (optional) -->
                        <!-- {#snippet highlightContainer()}
                            <HighlightContainer
                                {highlightMixBlendMode}
                                editHighlight = {highlightsStore.editHighlight}
                                onContextMenu={(e, data)=>handleContextMenu(e,'highlight',data)}
                                onClick = {(e, data) => {
                                    e.stopPropagation();
                                    sidebarScrollToId(data.id);
                                    //setTip({highlight: data, show: true, position: data.position}, true, true);
                                }}
                                {pdfHighlighterUtils}
                            />
                        {/snippet} -->

                        <!-- Custom popup snippets (optional) -->
                        <!--
                        {#snippet highlightPopup(highlight, setPinned)}
                            <div class="Highlight__popup">
                                {#if highlight.comment }
                                    <div style="margin: 5px;" onclick={()=>setPinned(true)}> 
                                        {#if highlight.comment.length > 20 }
                                            <span style="mask-image: linear-gradient(to right, rgba(0,0,0,1) 50%, rgba(0,0,0,0));">
                                            {highlight.comment.slice(0, 21) + '...'}</span> (click to expand)
                                        {:else}
                                            {highlight.comment}
                                        {/if}        
                                        <span style="font-size: 0.8em;">(click to edit)</span>
                                    </div>
                                {:else}
                                    <div style="margin: 5px;" onclick={()=>setPinned(true)}>Comment has no Text  <span style="font-size: 0.8em;">(click to edit)</span></div>
                                {/if}
                            </div>
                        {/snippet}
                        -->

                        <!--
                        {#snippet editHighlightPopup(highlight, colors, onEdit, onDelete)}
                            <div class="Highlight__popup">
                                <textarea 
                                    onchange={(e) => onEdit((e.target as HTMLInputElement).value)}
                                    value={highlight.comment ? highlight.comment : ''}
                                ></textarea>
                                <hr>
                                {#each colors as color}
                                    <button 
                                        class="color" 
                                        onclick={()=>setColor(color)} 
                                        style="background-color: {color}" 
                                        onpointerdown={(e) => {e.preventDefault(); e.stopPropagation();}}
                                        onpointerup={(e) => {e.preventDefault(); e.stopPropagation();}} >  
                                    </button>
                                    {/each}
                                <button onclick={() => onDelete(highlight)}>delete</button>
                            </div>
                        {/snippet}
                        -->

                        <!--
                        {#snippet newHighlightPopup(highlight, colors, onAddHighlight)}
                            <div class="Highlight__popup">
                                {#each colors as color}
                                    <button 
                                        class="color"  
                                        onclick={
                                            (e) => {
                                                if (!highlight.id) {
                                                    highlight.color = color;
                                                    onAddHighlight(highlight);
                                                }
                                            }
                                        }
                                        style="background-color: {color}"
                                        onpointerdown={(e) => {e.preventDefault(); e.stopPropagation();}}
                                        onpointerup={(e) => {e.preventDefault(); e.stopPropagation();}}
                                    ></button>
                                {/each}

                                <button 
                                    onclick={(e)=>{
                                        navigator.clipboard.writeText(tipContainerState.highlight.content.text);
                                        clearTextSelection();
                                        hideTip(e, true);
                                    }}
                                >copy</button>
                            </div>
                        {/snippet}
                        -->

                    </PdfHighlighter>
                {/snippet}
            </PdfLoader>
            
        {/if}
    </div>
    {#if contextMenu} <ContextMenu {...contextMenu} /> {/if}
</div>
{/key}
<!-- disable browser default search bar -->
<svelte:window 
    onkeydown={
        (event) => {
            if ((event.code === "KeyF" && event.getModifierState("Control")) || event.code === "F3") {
                event.preventDefault();
            }
            if (event.altKey) {
                    event.preventDefault();
                    pdfHighlighterUtils.selectedTool = 'area_selection';
            }
    }} 
    
    onkeyup={
        (event) => {
            if (event.key === 'Alt') {
                    event.preventDefault();
                    pdfHighlighterUtils.selectedTool = 'text_selection';
                }
    }} 
/>
