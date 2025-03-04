<script module lang="ts">
    import type { Snippet } from 'svelte';
    import type { PDFViewer } from 'pdfjs-dist/types/web/pdf_viewer';
    import type { HighlightsModel } from '$lib/HighlightsModel.svelte.ts';

    import type {
        Highlight,
    } from '$lib/types';

    export interface TipContainerProps {
        viewer: PDFViewer;
        highlightsStore: HighlightsModel;
        onTipUpdate: any;
        colors: [string];
        clearTextSelection: () => void;

        highlightPopup?: Snippet<[highlight: Highlight, setPinned: (flag: boolean) => void]>;
        editHighlightPopup?: Snippet<[highlight: Highlight, colors: [string], onEdit: (comment: string) => void, onDelete: (highlight: Highlight) => void]>;
        newHighlightPopup?: Snippet<[highlight: Highlight, colors: [string], onAddHighlight: (highlight: Highlight) => void]>;
    }
</script>

<script lang="ts">
    import { debounce } from "$lib/utils.ts";

    let {
        viewer,
        highlightsStore,
        onTipUpdate,
        colors,
        clearTextSelection,

        highlightPopup = defaultHighlightPopup,
        editHighlightPopup = defaultEditHighlightPopup,
        newHighlightPopup = defaultNewHighlightPopup,
    }: TipContainerProps = $props();

    const clamp = (value: number, left: number, right: number) =>
        Math.min(Math.max(value, left), right);

    let content;

    let top = $state(0);
    let bottom = $state(0);
    let clampedLeft = $state(0);
    let width = $state(0);
    let height = $state(0);
    let show = $state(false);
    let pinned = $state(false);
    let mouseInRef = $state(false);

    let tipContainerState: any = $state({ show: false });
    let highlight: Highlight = $derived.by(() => {
        if (tipContainerState?.tip?.content.highlight) {
            return tipContainerState.tip.content.highlight;
        } else if (tipContainerState.highlight) {
            return tipContainerState.highlight;
        } else {
            return undefined;
        }
    });
    let tipPosition = $derived.by(() => {
        if (tipContainerState?.tip?.position) {
            return tipContainerState.tip?.position;
        } else if (tipContainerState.position) {
            return tipContainerState.position;
        } else {
            return undefined;
        }
    });

    const hideTip = (e, force = false) => {
        //handler for mouse click outside of the tip
        if (!force && e.target?.closest('.hl_tip_container')) return;
        if (show) {
            show = false;
            pinned = false;
            mouseInRef = false;
        }
    };

    onTipUpdate(debounce((_tipContainerState, is_edit = false, is_pinned = false) => {        
        if (pinned && !is_pinned) return;
        pinned = is_pinned;
        if (mouseInRef) return;
        show = _tipContainerState.show;
        tipContainerState = _tipContainerState;
        updatePosition();        
    }, 150));

    const updatePosition = () => {
        //console.log('run tipContainer effect');
        if (!tipContainerState.show) return;

        const position = tipPosition;
        const { boundingRect } = position;
        const pageNumber = boundingRect.pageNumber;
        const pageNode = viewer.getPageView(pageNumber - 1)?.div; // Account for 1 indexing of pdf documents
        const pageBoundingClientRect = pageNode.getBoundingClientRect();
        const { left: pageLeft, width: pageWidth } = pageBoundingClientRect;

        // Calculate the position and dimensions of the tip container
        const scrollTop = viewer.container.scrollTop; // How much the viewer has been scrolled vertically
        const left = pageNode.offsetLeft + boundingRect.left + boundingRect.width / 2; // center tip over highlight
        const highlightTop = boundingRect.top + pageNode.offsetTop;
        const highlightBottom = highlightTop + boundingRect.height;

        // Determine whether the tip should be moved below the highlight
        const shouldMove = highlightTop - height - 10 < scrollTop; // Would the tip render beyond the top of the visible document?
        top = shouldMove ? highlightBottom + height - 1 : highlightTop - 5;
        bottom = highlightBottom;
        //top = top - 1;

        // Ensure the tip stays within the left edge of the viewer and the right edge of the page
        clampedLeft = clamp(left - width / 2, 0, pageLeft + pageWidth - width);
    };

    const setColor = (color) => {
        highlight.color = color;
        highlightsStore.editHighlight(highlight.id, { color: color });
    };
    
</script>

<style type="text/css">
    :global(.hl_tip_container) {
        position: absolute;
        z-index: 999;
        text-align: center;

        :global(button.color) {
            border: none;
            padding: 8px;
            text-align: center;
            text-decoration: none;
            display: inline-block;
            margin: 3px 3px;
            border-radius: 50%;
            cursor: pointer;
        }
    }

    :global(.Highlight__popup) {
        background-color: #2c3e50;
        border: 1px solid rgba(255, 255, 255, 0.15);
        color: #fff;
        padding: 2px;
        border-radius: 4px;
        max-width: 300px;
        max-height: 200px;
        overflow-y: auto;
        box-shadow: 0 2px 5px rgba(0, 0, 0, 0.2);
        font-size: 0.9rem;
    }

    :global(.Highlight__popup::-webkit-scrollbar) {
        width: 8px;
    }

    :global(.Highlight__popup::-webkit-scrollbar-thumb) {
        background-color: #4b6270;
        border-radius: 5px;
    }

    :global(.Highlight__popup::-webkit-scrollbar-thumb:hover) {
        background-color: #576c7a;
    }

    :global(.Highlight__popup::-webkit-scrollbar-track) {
        background-color: #2c3e50;
        border-radius: 5px;
    }
</style>

<!-- svelte-ignore a11y_click_events_have_key_events -->
<!-- svelte-ignore a11y_no_static_element_interactions -->
<!-- svelte-ignore a11y_consider_explicit_label -->
{#snippet defaultHighlightPopup(hl: any, setPinned: (flag: boolean) => void)}
    <div class="Highlight__popup">
    {#if hl.comment }
        <div style="margin: 5px;" onclick={()=>setPinned(true)}> 
            {#if hl.comment.length > 20 }
                <span style="mask-image: linear-gradient(to right, rgba(0,0,0,1) 50%, rgba(0,0,0,0));">
                {hl.comment.slice(0, 21) + '...'}</span> (click to expand)
            {:else}
                {hl.comment}
            {/if}        
            <span style="font-size: 0.8em;">(click to edit)</span>
        </div>
    {:else}
        <div style="margin: 5px;" onclick={()=>setPinned(true)}>Comment has no Text  <span style="font-size: 0.8em;">(click to edit)</span></div>
    {/if}
    </div>
{/snippet}

{#snippet defaultEditHighlightPopup(highlight, colors, onEdit, onDelete)}
    <div class="Highlight__popup">
        <textarea 
            onchange={(e) => onEdit((e.target as HTMLInputElement).value)}
            value={highlight.comment ? highlight.comment : ''}
        ></textarea>
        <hr>
        <!--<button onclick={()=>{highlightsStore.editHighlight(highlight.id)}}>edit</button>-->
        {#each colors as color}
            <!-- svelte-ignore a11y_consider_explicit_label -->
            <button 
                class="color" 
                onclick={()=>setColor(color)} 
                style="background-color: {color}" 
                onpointerdown={(e) => {e.preventDefault(); e.stopPropagation();}}
                onpointerup={(e) => {e.preventDefault(); e.stopPropagation();}} >  
            </button>
            {/each}
        <!-- TODO: add custom color/colorpicker? -->
        <button onclick={() => onDelete(highlight)}>delete</button>
    </div>
{/snippet}

{#snippet defaultNewHighlightPopup(highlight, colors, onAddHighlight)}
    <div class="Highlight__popup">
            {#each colors as color}
                <!-- svelte-ignore a11y_consider_explicit_label -->
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
            <!--TODO: add custom color/colorpicker?-->

            <button 
                onclick={(e)=>{
                    navigator.clipboard.writeText(tipContainerState.highlight.content.text);
                    clearTextSelection();
                    hideTip(e, true);
                }}
            >copy</button>
        </div>
{/snippet}


{#if show}
    {#if highlight.id}
        <!-- Existing highlight -->
        <!-- svelte-ignore a11y_no_static_element_interactions -->
        <div 
            class="hl_tip_container" 
            bind:clientHeight={height} 
            bind:clientWidth={width} 
            style="top: {top - height}px; left: {clampedLeft}px; padding: 3px;"
            onmouseenter={() => {
                mouseInRef = true;     
            }}
            onmouseleave={() => {
                if (pinned) return;
                mouseInRef = false;
                show = false;
            }} 
        >
            <!-- svelte-ignore a11y_consider_explicit_label --> 
            <!-- TODO: edit button --> 
            {#if !pinned}
                {@render highlightPopup(
                    highlight, 
                    (flag: boolean) => {
                        pinned = flag;
                    }
                )}
            {:else}
                {@render editHighlightPopup(
                    highlight, 
                    colors, 
                    (comment) => { 
                        highlightsStore.editHighlight(
                            highlight.id, 
                            {comment: comment}
                        );
                    }, 
                    (highlight) => {
                        highlightsStore.deleteHighlight(highlight);
                        pinned = false;
                        tipContainerState.show = false;
                    }
                )}
            {/if}
        </div>
    {:else}
        <!-- New highlight (on text selection) -->
        <div 
            class="hl_tip_container"
            bind:clientHeight={height} 
            bind:clientWidth={width} 
            style="top: {top - height + 5}px; left: {clampedLeft}px; padding: 3px;"
        >
            {@render newHighlightPopup(highlight, colors, (highlight) => {
                let _highlight = highlightsStore.addHighlight(highlight);
                tipContainerState.highlight = _highlight;
                pinned = true;
                tipContainerState.clearSelection();
                }
            )}
        </div>
    {/if}
{/if}

<svelte:document onmouseup={hideTip} />