<script module lang="ts">
    import type { Snippet } from 'svelte';
    import type { PDFViewer } from 'pdfjs-dist/types/web/pdf_viewer';
    import type { HighlightsModel } from '$lib/HighlightsModel.svelte.ts';

    import type {
        Highlight,
        TipContainerState as TTipContainerState,
    } from '$lib/types';

    export interface TipContainerProps {
        viewer: PDFViewer;
        highlightsStore: HighlightsModel<any>;
        onTipUpdate: any;
        colors: string[];
        clearTextSelection: () => void;

        highlightPopup?: Snippet<[highlight: Highlight, setPinned: (flag: boolean) => void]>;
        editHighlightPopup?: Snippet<[highlight: Highlight, colors: string[], onEdit: (comment: string) => void, onDelete: (highlight: Highlight) => void]>;
        newHighlightPopup?: Snippet<[highlight: Highlight, colors: string[], onAddHighlight: (highlight: Highlight) => void]>;
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

    let tipContainerState: Partial<TTipContainerState> = $state({ show: false });

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

    let shouldBeHidden = $state(true);

    const hideTip = (e, force = false) => {
        //handler for mouse click outside of the tip
        if (!force && e.target?.closest('.hl_tip_container')) return;
        if (show) {
            show = false;
            pinned = false;
            mouseInRef = false;
        }
        shouldBeHidden = true;
    };
    

    const updateTip = (_tipContainerState) => {
        if (_tipContainerState === null) {
            hideTip(null, true);
            return;
        }       
        if (pinned && !_tipContainerState.pinned) return;
        pinned = _tipContainerState.pinned;
        if (mouseInRef) return;
        show = _tipContainerState.show;
        tipContainerState = _tipContainerState;

        
        //wait for the size of rerendered element to be established
        //TODO: fixed size, defined in snippet?
        setTimeout(()=> {
            updatePosition(); 
            setTimeout(() => {
                shouldBeHidden = false;
            }, 10);
        }, 20);
        //updatePosition();        
    }

    onTipUpdate(debounce(updateTip, 150));

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
        clampedLeft = clamp((left - width / 2), viewer.container.scrollLeft, viewer.container.offsetWidth - width + viewer.container.scrollLeft - 20);
        //clampedLeft = clamp(left - width / 2, 0, pageLeft + pageWidth - width);      
    };

    const setColor = (color) => {
        highlight.color = color;
        highlightsStore.editHighlight(highlight.id, { color: color });
    };

    let commentForceShow = $state(false)
    const showComment = debounce(()=>commentForceShow = true, 1000);
    
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
            width: 16px;
            height: 16px;
        }
    }

    :global(.Highlight__popup) {
        border: 1px solid #8c8c8c;
        color: #000;
        padding: 2px;
        border-radius: 4px;
        max-width: 300px;
        /*min-width: 100px;
        max-height: 2rem;*/
        overflow-y: auto;
        box-shadow: 0 2px 5px #8c8c8c;
        font-size: 0.9rem;
        background-color: #F8F9FA;
        display: flex;
        align-items: center;
    }
    :global(.EditPopup) {
        display: block;
        max-height: 300px;
        max-width: 400px;
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

    :global(.icon) {
        width: 1.1rem;
        height: 1.1rem;
        display: inline;
        /*margin: 0px auto;*/
    }
    :global(.icon > svg) {
        width: 100%;
        height: 100%;
        stroke: #6C757D;
    }
    :global(.TipButton:hover .icon > svg) {
        stroke: #343A40;
    }
    :global(.TipButton) {
        display: flex;
        align-items: center;
         border: 0px solid;
        border-radius: 5px;
        width: 1.7rem;
        height: 1.7rem;

        background: none;
        /* Remove background */
        color: #DEE2E6;
        
        /* Remove border */
        cursor: pointer;
        font-size: 1rem;
        padding: 2px;
        margin-right: 2px;
        margin-left: 2px;
    }
    :global(.TipButton:hover) {
        color: #343A40;
        /*        transform: scale(1.05);*/
        background-color: #E9ECEF;
    }
</style>

<!-- svelte-ignore a11y_click_events_have_key_events -->
<!-- svelte-ignore a11y_no_static_element_interactions -->
<!-- svelte-ignore a11y_consider_explicit_label -->
{#snippet defaultHighlightPopup(hl: any, setPinned: (flag: boolean) => void)}
    <!-- TODO: expand on hover with delay -->
    <div class="Highlight__popup" style="display: flex; align-items: center;" onmouseleave={()=>{showComment.cancel(); commentForceShow = false;}}>
    {#if hl.comment }
        <div style="margin: 5px; white-space: nowrap;" onmouseenter={showComment} > 
            {#if hl.comment.length > 20 && commentForceShow}
                <div style="max-height: 150px; overflow-y: scroll;">{hl.comment}</div>
            {:else if hl.comment.length > 20 && !commentForceShow}
                <span style="mask-image: linear-gradient(to right, rgba(0,0,0,1) 50%, rgba(0,0,0,0));">
                {hl.comment.slice(0, 21) + '...'}</span>
            {:else}
                {hl.comment}
            {/if}        
            <span style="font-size: 0.8em;"></span>
        </div>
    {:else}
        <div style="margin: 5px; white-space: nowrap;">Comment has no Text  <span style="font-size: 0.8em;"></span></div>
    {/if}
    
    <button style="margin-left: 1rem;" class="TipButton"
                onclick={()=>setPinned(true)}
            ><div style="height: 1.1rem; width: 1.1rem;" class="icon">
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M12 3H5a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.375 2.625a1 1 0 0 1 3 3l-9.013 9.014a2 2 0 0 1-.853.505l-2.873.84a.5.5 0 0 1-.62-.62l.84-2.873a2 2 0 0 1 .506-.852z"/><!--Lucide - https://lucide.dev License - https://lucide.dev/license Copyright (c) for portions of Lucide are held by Cole Bemis 2013-2022 as part of Feather (MIT). All other copyright (c) for Lucide are held by Lucide Contributors 2022.--></svg>
            </div>
        </button>
        <!-- <button style="margin-left: 0.3rem;" class="TipButton"
                onclick={() => onDelete(highlight)}
            ><div style="height: 1.1rem; width: 1.1rem;" class="icon">
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-trash2-icon lucide-trash-2"><path d="M10 11v6"/><path d="M14 11v6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6"/><path d="M3 6h18"/><path d="M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>
            </div>
        </button> -->
    </div>
{/snippet}

{#snippet defaultEditHighlightPopup(highlight, colors, onEdit, onDelete)}
    <div class="Highlight__popup EditPopup">
        <textarea style="height: 150px; width: 350px;" 
            onchange={(e) => onEdit((e.target as HTMLInputElement).value)}
            value={highlight.comment ? highlight.comment : ''}
        ></textarea>
        <hr style="border: none; background-color: #8c8c8c; height: 0px;">
        <!--<button onclick={()=>{highlightsStore.editHighlight(highlight.id)}}>edit</button>-->
        <div style="display: inline-flex; align-items: center; justify-content: center; width: 100%;">
        <div style="margin-left: auto;">
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
        </div>
        <!-- TODO: add custom color/colorpicker? -->

        <!-- svelte-ignore a11y_consider_explicit_label -->
        <button style="margin-left: auto;" class="TipButton"
                onclick={() => onDelete(highlight)}
            ><div style="height: 1.2rem; width: 1.2rem;" class="icon">
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M10 11v6"/><path d="M14 11v6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6"/><path d="M3 6h18"/><path d="M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/><!--Lucide - https://lucide.dev License - https://lucide.dev/license Copyright (c) for portions of Lucide are held by Cole Bemis 2013-2022 as part of Feather (MIT). All other copyright (c) for Lucide are held by Lucide Contributors 2022.--></svg>
            </div>
        </button>
    </div>
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

            <!-- svelte-ignore a11y_consider_explicit_label -->
            <button style="margin-left: 5px;" class="TipButton"
                onclick={(e)=>{
                    navigator.clipboard.writeText(tipContainerState.highlight.content.text);
                    clearTextSelection();
                    hideTip(e, true);
                }}
            ><div style="height: 1rem; width: 1rem; margin: auto;" class="icon">
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect width="14" height="14" x="8" y="8" rx="2" ry="2"/><path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2"/><!--Lucide - https://lucide.dev License - https://lucide.dev/license Copyright (c) for portions of Lucide are held by Cole Bemis 2013-2022 as part of Feather (MIT). All other copyright (c) for Lucide are held by Lucide Contributors 2022.--></svg>
            </div>
            </button>
        </div>
{/snippet}


{#if show}
    {#if highlight?.id}
        <!-- Existing highlight -->
        <!-- svelte-ignore a11y_no_static_element_interactions -->
        <div 
            
            class="hl_tip_container" 
            bind:clientHeight={height} 
            bind:clientWidth={width} 
            style="top: {top - height}px; left: {clampedLeft}px; padding: 3px; visibility: {shouldBeHidden ? 'hidden':''};"
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

                        //wait for the size of rerendered element to be established
                        shouldBeHidden = true;
                        setTimeout(()=> {
                            updatePosition();
                            shouldBeHidden = false;
                        }, 30);
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
            style="top: {top - height + 5}px; left: {clampedLeft}px; padding: 3px; visibility: {shouldBeHidden ? 'hidden':''};"
        >
            {@render newHighlightPopup(highlight, colors, (highlight) => {
                let _highlight = highlightsStore.addHighlight(highlight);
                pinned = true;
                tipContainerState.clearSelection();
                tipContainerState.highlight = _highlight;
                shouldBeHidden = true;
                        setTimeout(()=> {
                            updatePosition();
                            shouldBeHidden = false;
                        }, 30);
                }
            )}
        </div>
    {/if}
{/if}

<svelte:document onmouseup={hideTip} />