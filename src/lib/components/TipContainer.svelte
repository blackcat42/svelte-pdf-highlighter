<script module lang="ts">
    export interface TipContainerProps {
        viewer: PDFViewer;
        addHighlight: any;
        editHighlight: any;
        onEdit: any;
        onDelete?: any;
        onChangeColor: any;
        onTipUpdate: any;
        colors: any;
        clearTextSelection: any;
    }
</script>

<script lang="ts">
    //import {debounce} from "$lib/utils.ts";
    //import { preventDefault, stopPropagation } from "svelte/legacy";
    //let { tipContext } = $props();
    import { onMount } from 'svelte';
    import type { PDFViewer } from 'pdfjs-dist/types/web/pdf_viewer';

    let {
        viewer,
        addHighlight,
        editHighlight,
        onEdit,
        onDelete,
        onChangeColor,
        onTipUpdate,
        colors,
        clearTextSelection,
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
    let isEdit = $state(false);
    let pinned = $state(false);
    //let mouseInRef = $state.raw(false);
    let mouseInRef = $state({ inref: false });

    let tipContainerState: any = $state({ show: false });
    let highlight = $derived.by(() => {
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

    /*onSetSelectionTip((_tipContainerState) => {
        //if (show) return;
        document.activeElement.blur();
        show = _tipContainerState.show;
        extTipContainerState = _tipContainerState;
        updatePosition();
        console.log(_tipContainerState)   
    });*/

    const hideTip = (e, force = false) => {
        //e.stopPropagation();
        if (!force && e.target?.closest('.hl_tip_container')) return;
        if (show) {
            show = false;
            pinned = false;
            mouseInRef.inref = false;
        }
    };

    onTipUpdate((_tipContainerState, is_edit = false, is_pinned = false) => {
        //TODO: debounce!!!
        setTimeout(() => {
            if (pinned && !is_pinned) return;

            isEdit = is_edit;
            pinned = is_pinned;
            //mouseInRef.inref = is_edit;
            if (mouseInRef.inref) return;
            show = _tipContainerState.show;
            //console.log(isEdit)

            //mouseInRef = _tipContainerState.mouseInRef;
            tipContainerState = _tipContainerState;
            //tipContainerState.mouseInRef = true;
            updatePosition();
            //return(() => {return mouseInRef.inref});
        }, 150);
    });

    //const setBgColor = (color) => {}
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
        editHighlight(highlight.id, { color: color });
    };
    // Destructuring current tip's position and content
    //const { position, content } = currentTip;
    //let NComponent = content.component;
</script>

<style type="text/css">
    .hl_tip_container {
        position: absolute;
        z-index: 999;
        text-align: center;

        button.color {
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

    .Highlight__popup {
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

    .Highlight__popup::-webkit-scrollbar {
        width: 8px;
    }

    .Highlight__popup::-webkit-scrollbar-thumb {
        background-color: #4b6270;
        border-radius: 5px;
    }

    .Highlight__popup::-webkit-scrollbar-thumb:hover {
        background-color: #576c7a;
    }

    .Highlight__popup::-webkit-scrollbar-track {
        background-color: #2c3e50;
        border-radius: 5px;
    }
</style>


<!-- TODO: separate into components-->
{#if show}
    {#if highlight.id}
        <!-- Existing highlight -->
        <!-- svelte-ignore a11y_no_static_element_interactions -->
        <div 
            class="hl_tip_container " 
            bind:clientHeight={height} 
            bind:clientWidth={width} 
            style="top: {top - height}px; left: {clampedLeft}px; padding: 3px;"
            onmouseenter={() => {
                mouseInRef.inref = true;     
            }}
            onmouseleave={() => {
                if (pinned) return;
                mouseInRef.inref = false;
                show = false;
            }} 
        >
            <!-- svelte-ignore a11y_consider_explicit_label --> 
            <!-- TODO: edit button --> 
            <div class="Highlight__popup">
                {#if !pinned}
                    {#if highlight.comment }
                        <!-- svelte-ignore a11y_click_events_have_key_events -->
                        <div style="margin: 5px;" onclick={()=>pinned = true}> 
                            {#if highlight.comment.length > 20 }
                            <span style="mask-image: linear-gradient(to right, rgba(0,0,0,1) 50%, rgba(0,0,0,0));">
                            {highlight.comment.slice(0, 21) + '...'}</span> (click to expand)
                            {:else}
                                {highlight.comment}
                            {/if}
                            
                            <span style="font-size: 0.8em;">(click to edit)</span>
                        </div>
                    {:else}
                        <!-- svelte-ignore a11y_click_events_have_key_events -->
                        <div style="margin: 5px;" onclick={()=>pinned = true}>Comment has no Text  <span style="font-size: 0.8em;">(click to edit)</span></div>
                    {/if}

                {:else}
                    <textarea 
                        onchange={      
                            (e)=> { editHighlight(highlight.id, {comment: (e.target as HTMLInputElement).value})}
                        }
                        value={highlight.comment ? highlight.comment : ''}
                    ></textarea>
                    <hr>
                    <!--<button onclick={()=>{onEdit(highlight.id)}}>edit</button>-->
                    {#each colors as color}
                        <button class="color" onclick={()=>setColor(color)} style="background-color: {color}" onpointerdown={(e) => {e.preventDefault(); e.stopPropagation();}}
                        onpointerup={(e) => {e.preventDefault(); e.stopPropagation();}} ></button>
                    {/each}
                    <!-- TODO: add custom color/colorpicker? -->
                    <button onclick={() => onDelete(highlight)}>delete</button>
                {/if}

            </div>

        </div>
    {:else}
        <!-- New highlight (on text selection) -->
        <div class="hl_tip_container Highlight__popup" 
            bind:clientHeight={height} 
            bind:clientWidth={width} 
            style="top: {top - height + 5}px; left: {clampedLeft}px; padding: 3px;"
        >
            {#each colors as color}
                <!-- svelte-ignore a11y_consider_explicit_label -->
                <button 
                    class="color"  
                    onclick={
                        (e) => {
                            if (highlight.id) {
                                e.preventDefault(); 
                                e.stopPropagation(); 
                                setColor(color);
                            } else {
                                highlight.color = color;
                                let _highlight = addHighlight(highlight);
                                tipContainerState.highlight = _highlight;
                                pinned = true;
                                tipContainerState.clearSelection();
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
    {/if}
{/if}

<svelte:document onmouseup={hideTip} />