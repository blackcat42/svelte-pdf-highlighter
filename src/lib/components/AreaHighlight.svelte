<script lang="ts" module>
    export interface AreaHighlightProps {
        /**
         * The highlight to be rendered as an {@link AreaHighlight}.
         */
        highlight: ViewportHighlight;

        /**
         * Callback triggered whenever the user clicks on the part of a highlight.
         *
         * @param event - Mouse event associated with click.
         */
        onClick?(event: MouseEvent): void;

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
        //isScrolledTo?: boolean;

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
         * TODO:
         * Custom styling to be applied to the {@link AreaHighlight} component.
         */
        style?: any;

        pdfHighlighterUtils: Partial<TPdfHighlighterUtils>;
        highlightMixBlendMode?: string;
        isDraggable?: boolean;
    }
</script>

<script lang="ts">
    //TODO: custom styling
    //TODO: DRY?
    import { debounce } from "$lib/utils";
    import RND from '$lib/components/RND.svelte';
    import type { LTWHP, LTWH, ViewportHighlight, PdfHighlighterUtils as TPdfHighlighterUtils } from '$lib/types';
    //import { getContext } from 'svelte';

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
        bounds,
        onContextMenu,
        //onEditStart,
        style,
        pdfHighlighterUtils,
        highlightMixBlendMode = 'normal',
        onClick,
        isDraggable = false,
    }: AreaHighlightProps = $props();

    let color: string = $state('');
    if (highlight.color) {
        color = highlight.color
    } else {
        color = pdfHighlighterUtils.colors ? pdfHighlighterUtils.colors[0] : 'yellow';
    }

    let isAllowTextSelection = $state(false);
    //let delay = pdfHighlighterUtils.textSelectionDelay;
    const allowTextSelection = debounce(() => {
        if (pdfHighlighterUtils.textSelectionDelay < 0) return;
        isAllowTextSelection = true;
    }, () => pdfHighlighterUtils.textSelectionDelay);
</script>

<style>
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
        //pdfHighlighterUtils.setCurrentHighlightId(highlight.id);
        if (pdfHighlighterUtils.selectedTool === 'text_selection') {
            allowTextSelection();
        }
                          
    }}
    onmouseleave={() => {
        allowTextSelection.cancel();
        isAllowTextSelection = false;
        //pdfHighlighterUtils.setCurrentHighlightId(null);
    }}
>
    {#key highlight.position.boundingRect}
        <RND
            {highlight}
            {pdfHighlighterUtils}
            {isAllowTextSelection}
            {allowTextSelection}
            boundingRect = {highlight.position.boundingRect}
            onDragOrResizeStop={(data: LTWH) => {
                const boundingRect: LTWHP = {
                    ...highlight.position.boundingRect,
                    top: data.top,
                    left: data.left,
                    width: data.width,
                    height: data.height,
                    //pageNumber: getPageFromElement(ref)?.number || -1,
                };

              onChange && onChange(boundingRect);
            }}
            bounds={bounds}
            color={color}
            {onClick}
            {isDraggable}
        ></RND>
    {/key}
</div>