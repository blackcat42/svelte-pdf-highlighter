<script lang="ts" module>
    export interface AreaHighlightProps {
        /**
         * The highlight to be rendered as an {@link AreaHighlight}.
         */
        highlight: ViewportHighlight;

        /**
         * A callback triggered whenever the highlight area is either finished
         * being moved or resized.
         *
         * @param rect - The updated highlight area.
         */
        onChange?(rect: LTWHP): void;

        /**
         * Has the highlight been auto-scrolled into view? By default, this will render the highlight red.
         */
        isScrolledTo?: boolean;

        /**
         * Bounds on the highlight area. This is useful for preventing the user
         * moving the highlight off the viewer/page.
         */
        bounds?: Element;

        /**
         * A callback triggered whenever a context menu is opened on the highlight area.
         *
         * @param event - The mouse event associated with the context menu.
         */
        onContextMenu?(event: MouseEvent): void;

        /**
         * Event called whenever the user tries to move or resize an {@link AreaHighlight}.
         */
        //onEditStart?(): void;

        /**
         * Custom styling to be applied to the {@link AreaHighlight} component.
         */
        style?: any;
        pdfHighlighterUtils: any;
        highlightMixBlendMode?: string;
    }
</script>

<script lang="ts">
    //TODO: custom styling
    import { debounce } from "$lib/utils.ts";
    //import { getPageFromElement } from '$lib/pdf_utils/pdfjs-dom.ts';
    import RND from '$lib/components/RND.svelte';
    import type { LTWHP, ViewportHighlight } from '$lib/types';

    /**
     * The props type for {@link AreaHighlight}.
     *
     * @category Component Properties
     */

    /**
     * Renders a resizeable and interactive rectangular area for a highlight.
     *
     * @category Component
     */
    let {
        highlight,
        onChange,
        isScrolledTo,
        bounds,
        onContextMenu,
        //onEditStart,
        style,
        pdfHighlighterUtils,
        highlightMixBlendMode = 'normal',
    }: AreaHighlightProps = $props();
    let highlightClass = $derived.by(() => (isScrolledTo ? 'AreaHighlight--scrolledTo' : ''));

    //`${highlight.position.boundingRect.width}${highlight.position.boundingRect.height}${highlight.position.boundingRect.left}${highlight.position.boundingRect.top}`;

    let isAllowTextSelection = $state(false);
    let delay = $derived.by(()=>pdfHighlighterUtils.getTextSelectionDelay());
    const allowTextSelection = debounce(() => {
        if (delay < 0) return;
        isAllowTextSelection = true;
    }, pdfHighlighterUtils.getTextSelectionDelay);
</script>

<style>
    .AreaHighlight__part {
        cursor: pointer;
        position: absolute;
        background: rgba(255, 226, 143, 1);
        transition: background 0.3s;
    }

    .AreaHighlight--scrolledTo .AreaHighlight__part {
        background: #ff4141;
    }
    .allowSelect {
        cursor: text;
        opacity: 0.8;
        user-select: text;
    }
</style>


<!-- svelte-ignore a11y_no_static_element_interactions -->
<div  oncontextmenu={onContextMenu}  style="mix-blend-mode: {highlightMixBlendMode}"
    class= {isAllowTextSelection ? 'AreaHighlight allowSelect':'AreaHighlight'}
    onmouseenter={() => {
        //pdfHighlighterUtils.setCurrentHighlight(highlight.id);
        if (pdfHighlighterUtils.getSelectedTool() === 'text_selection') {
            //delay = parseInt(pdfHighlighterUtils.getTextSelectionDelay());
            allowTextSelection();
        }
                          
    }}
    onmouseleave={() => {
        allowTextSelection.cancel();
        isAllowTextSelection = false;
        //pdfHighlighterUtils.setCurrentHighlight(null);
    }}
>
    {#key highlight.position.boundingRect}
        <RND
            {highlight}
            {pdfHighlighterUtils}
            {isAllowTextSelection}
            {allowTextSelection}
            boundingRect = {highlight.position.boundingRect}
            onDragOrResizeStop={(data) => {
              const boundingRect: LTWHP = {
                ...highlight.position.boundingRect,
                top: data.top,
                left: data.left,
                width: data.width,
                height: data.height,
                //pageNumber: getPageFromElement(ref)?.number || -1,
            };

              onChange && onChange(boundingRect);
              //tipContainerState.tip.position = {boundingRect};
            }}
            bounds={bounds}
            color={highlight.color}
        ></RND>
    {/key}
</div>