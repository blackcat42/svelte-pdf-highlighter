<script lang="ts" module>
    /**
     * The props type for {@link TextHighlight}.
     *
     * @category Component Properties
     */
    export interface TextHighlightProps {
        /**
         * Highlight to render over text.
         */
        highlight: ViewportHighlight;

        /**
         * Callback triggered whenever the user clicks on the part of a highlight.
         *
         * @param event - Mouse event associated with click.
         */
        onClick?(event: MouseEvent): void;

        /**
         * Callback triggered whenever the user enters the area of a text highlight.
         *
         * @param event - Mouse event associated with movement.
         */
        onMouseOver?(event: MouseEvent): void;

        /**
         * Callback triggered whenever the user leaves  the area of a text highlight.
         *
         * @param event - Mouse event associated with movement.
         */
        onMouseOut?(event: MouseEvent): void;

        /**
         * Indicates whether the component is autoscrolled into view, affecting
         * default theming.
         */
        //isScrolledTo: boolean;

        /**
         * Callback triggered whenever the user tries to open context menu on highlight.
         *
         * @param event - Mouse event associated with click.
         */
        onContextMenu?(event: MouseEvent): void;

        /**
         * Optional CSS styling applied to each TextHighlight part.
         */
        style?: any;
        pdfHighlighterUtils: Partial<TPdfHighlighterUtils>;
        highlightMixBlendMode?: string;
    }
</script>

<script lang="ts">
    //TODO: DRY?
    import { debounce } from "$lib/utils.ts";
    import type { ViewportHighlight, PdfHighlighterUtils as TPdfHighlighterUtils} from '$lib/types';
    import { getContext } from 'svelte';

    
    /**
     * A component for displaying a highlighted text area.
     *
     * @category Component
     */
    let {
        highlight,
        onClick,
        onContextMenu,
        style,
        pdfHighlighterUtils,
        highlightMixBlendMode = 'normal',
    }: TextHighlightProps = $props();
    
    const { rects } = highlight.position;

    let color: string = $state('');
    const scrolledToColor = getContext('scrolledTo_color');
    if (highlight.color) {
        color = highlight.color
    } else {
        color = getContext('colors') ? getContext('colors')[0] : 'yellow';
    }

    //style={{ ...rect, ...style }}

    let isAllowTextSelection = $state(false);
    let delay = pdfHighlighterUtils.textSelectionDelay;
    const allowTextSelection = debounce(() => {
        //console.log(delay)
        //if (!pdfHighlighterUtils.isAllowTextSelectionInHl()) return;
        if (delay < 0) return;
        isAllowTextSelection = true;
    }, () => pdfHighlighterUtils.textSelectionDelay);
</script>

<style>
    .TextHighlight {
        position: absolute;
    }

    .TextHighlight__parts {
        opacity: 1;
    }

    .TextHighlight__part {
        cursor: pointer;
        position: absolute;
        background: rgba(255, 226, 143, 1);
        transition: background 1s;
    }
    .TextHighlight__part--scrolledTo {
        transition: none;
    }
</style>

<!-- svelte-ignore a11y_no_static_element_interactions -->
<div
    class="TextHighlight"
    oncontextmenu={onContextMenu}

    onmouseenter={() => {
        //pdfHighlighterUtils.setCurrentHighlightId(highlight.id);
        if (pdfHighlighterUtils.selectedTool === 'text_selection') {
            //delay = parseInt(pdfHighlighterUtils.getTextSelectionDelay());
            allowTextSelection();
        }
    }}
    onmouseleave={() => {
        allowTextSelection.cancel();
        isAllowTextSelection = false;
        //pdfHighlighterUtils.setCurrentHighlightId(null);
    }}
>
    <div class="TextHighlight__parts">
        {#each rects as rect, index}
            <!-- svelte-ignore a11y_click_events_have_key_events -->
            <div

                onpointerdown={(e) => {
                    if (!isAllowTextSelection) {
                        e.preventDefault(); 
                        e.stopPropagation();
                    } else {
                        pdfHighlighterUtils.setCurrentHighlightId(highlight.id);
                        if ((typeof highlight.z_index) !== 'number') highlight.z_index = 0;
                        pdfHighlighterUtils.setCurrentHighlightZIndex(highlight.z_index);
                    }
                }}
                onpointerup={(e) => {e.preventDefault(); e.stopPropagation();}}
                onclick={(e) => {e.preventDefault(); e.stopPropagation(); onClick(e)}}
                style="width:{rect.width}px; height: {rect.height}px; left: {rect.left}px; top: {rect.top}px; background: {(pdfHighlighterUtils.scrolledToHighlightIdRef === highlight.id && scrolledToColor) ? scrolledToColor : color}; cursor: {isAllowTextSelection ? 'text' : 'pointer'}; opacity: {isAllowTextSelection ? '0.8' : '1'}; mix-blend-mode: {highlightMixBlendMode};"
                class="{(pdfHighlighterUtils.scrolledToHighlightIdRef === highlight.id) ? 'TextHighlight__part--scrolledTo' : ''} TextHighlight__part"
            ></div>
        {/each}
    </div>
</div>