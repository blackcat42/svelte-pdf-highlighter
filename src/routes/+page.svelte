<script lang="ts">
    import ContextMenu from './ContextMenu.svelte';
    import type { ContextMenuProps } from './ContextMenu.svelte';
    import HighlightContainer from './HighlightContainer.svelte';
    import Sidebar from './Sidebar.svelte';
    import Toolbar from './Toolbar.svelte';
    import PdfLoader from '$lib/components/PdfLoader.svelte';
    import PdfHighlighter from '$lib/components/PdfHighlighter.svelte';

    import { testHighlights as _testHighlights } from './test-highlights.ts';
    const TEST_HIGHLIGHTS = _testHighlights;

    import type {
        Highlight,
        ViewportHighlight,
        CommentedHighlight,
        Tip,
        PdfScaleValue,
    } from '$lib/types.ts';

    import type { DocumentInitParameters } from 'pdfjs-dist/types/src/display/api.d.ts';

    import { onMount, setContext, getContext } from 'svelte';
    import { HighlightsModel } from '$lib/HighlightsModel.svelte.ts';

    //let s_hash = $state('');
    //const parseIdFromHash = () => {
    //  return s_hash.slice("#highlight-".length);
    //};
    //const resetHash = () => {
    //  s_hash = "";
    //};

    let colors = setContext('colors', ['#fcf151', '#ff659f', '#83f18d', '#67dfff', '#b581fe']);
    let url: string | URL | DocumentInitParameters = $state('https://arxiv.org/pdf/2203.11115');
    setContext('document', url);
    //document: string | URL | TypedArray | DocumentInitParameters;

    //custom field example
    // interface MyHighlight extends CommentedHighlight {
    //     custom_field: number;
    // }
    // let _highlights: Array<MyHighlight> = TEST_HIGHLIGHTS['https://arxiv.org/pdf/2203.11115'].map((item) => {
    //     item['custom_field'] = 0;
    //     return item as MyHighlight;
    // });

    let _highlights: Array<Highlight> = TEST_HIGHLIGHTS['https://arxiv.org/pdf/2203.11115'] ?? [];
    let highlightsStore = new HighlightsModel(_highlights);
    //let unsubscribe = highlightsStore.subscribe((array_of_all_highlights_including_new_or_updated)=>{
    //    //save data to server...
    //    if (true) return new Error('Failed to save highlights');
    //});

    let contextMenu: ContextMenuProps | null = $state(null);

    type tool = 'text_selection' | 'hand' | 'highlight_pen' | 'area_selection';
    let selectedTool: tool = $state('text_selection');

    let workerUrl: string | null = $state(null);
     (async () => {
         workerUrl = (await import("pdfjs-dist/build/pdf.worker?url")).default; //vite.dev/guide/assets.html#explicit-url-imports
     })();
    //workerUrl = 'https://unpkg.com/pdfjs-dist@4.4.168/build/pdf.worker.min.mjs';

    onMount(() => {
        const handleClick = () => {
            if (contextMenu) {
                contextMenu = null;
            }
        };
        document.addEventListener('click', handleClick);

        return () => {
            document.removeEventListener('click', handleClick);
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
                        selectedTool = 'text_selection';
                    },
                    enableDragScroll: () => {
                        selectedTool = 'hand';
                    },
                    enableHighlightPen: () => {
                        selectedTool = 'highlight_pen';
                    },
                    enableAreaSelection: () => {
                        selectedTool = 'area_selection';
                    },
                    selectedTool,
                },
            };
        }
    };

    let sidebarScrollToId: (id: string) => void;

    let pdfHighlighterUtils = $state({});
    let selectionDelay = $state(1500); //-1 to disable


    // Scroll to highlight based on hash in the URL
    /*const scrollToHighlightFromHash = () => {
        //TODO
        const highlight = highlightsStore.getHighlightById(parseIdFromHash());

        if (highlight && pdfHighlighterUtils) {
            pdfHighlighterUtils.scrollToHighlight(highlight);
        }
    };*/

    // const setSelection = (selection) {
    //  highlightPen ? (selection) =>  : undefined;
    // }

    let resetHash = '';
    //console.log(url);

    let highlightMixBlendMode = $state('normal');
    let sidebarVisible = $state(true);
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
</style>
<!-- svelte-ignore a11y_click_events_have_key_events -->
<!-- svelte-ignore a11y_no_static_element_interactions -->
<Toolbar  
    bind:selectedTool = {selectedTool}
    searchInPdf = {pdfHighlighterUtils.search}
    {pdfHighlighterUtils} 
    bind:sidebarVisible
/>
<div class="App" style="display: flex; height: calc(100vh - 2.1rem);">
    {#if (sidebarVisible)}
    <Sidebar
        bind:highlights={highlightsStore.highlights}
        resetHighlights={highlightsStore.resetHighlights}
        toggleDocument={()=>{}}
        editHighlight = {highlightsStore.editHighlight}
        deleteHighlight = {highlightsStore.deleteHighlight}
        sidebarScrollToId = {(callback: (id: string) => void) => sidebarScrollToId = callback}
        {pdfHighlighterUtils}
        {colors}
        bind:selectionDelay
        bind:highlightMixBlendMode
    /> 
    {/if}
    <div style="height: 100%; width: 100%; overflow: hidden; position: relative; flexGrow: 1">
        

        {#if workerUrl !== null}         
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
                        bind:highlightsStore
                        bind:selectedTool 
                        pdfDocument={pdfDocumentRef}
                        style="height: 100%; padding-top: 0.7rem;"
                        onContextMenu={(e)=>handleContextMenu(e,'document',null)}
                        onSearch = {(callback) => pdfHighlighterUtils.search = callback}
                        bind:pdfHighlighterUtils = {pdfHighlighterUtils}
                        bind:selectionDelay = {selectionDelay}
                    >
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

<!-- disable browser default search bar -->
<svelte:window 
    onkeydown={
        (event) => {
            if ((event.code === "KeyF" && event.getModifierState("Control")) || event.code === "F3") {
                event.preventDefault();
            }
            if (event.altKey) {
                    event.preventDefault();
                    selectedTool = 'area_selection';
            }
    }} 
    
    onkeyup={
        (event) => {
            if (event.key === 'Alt') {
                    event.preventDefault();
                    selectedTool = 'text_selection';
                }
    }} 
/>
