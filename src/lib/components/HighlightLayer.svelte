<script lang="ts" module>
    import type { Snippet } from 'svelte';
    /**
     * The props type for {@link HighlightLayer}.
     *
     * @category Component Properties
     * @internal
     */
    export interface HighlightLayerProps {
        /**
         * Highlights and GhostHighlights organised by page number.
         */
        //highlightsByPage: { [pageNumber: number]: Array<Highlight | GhostHighlight> };

        /**
         * The page number of the PDF document to highlight (1 indexed).
         */
        pageNumber: number;

        /**
         * ID of the highlight that the parent PDF Highlighter is trying to autoscroll to.
         */
        scrolledToHighlightId?: string | null;

        /**
         * The PDFViewer instance containing the HighlightLayer
         */
        viewer: PDFViewer;

        /**
         * Group of DOM refs for all the highlights on this layer.
         */
        highlightBindings: HighlightBindings;

        /**
         * The Highlight container that should be used to render highlights for this layer.
         * It will be given appropriate context for a single highlight, allowing it to render
         * a single {@link TextHighlight}, {@link AreaHighlight}, etc., in the correct place.
         */
        children: Snippet;

        highlightsStore: any;
        pdfScaleValue: any;
    }
</script>

<script lang="ts">
    import type { PDFViewer } from 'pdfjs-dist/types/web/pdf_viewer';
    import { scaledPositionToViewport, viewportToScaled } from '$lib/pdf_utils/coordinates';
    import screenshot from '$lib/pdf_utils/screenshot';
    import type {
        GhostHighlight,
        Highlight,
        HighlightBindings,
        LTWH,
        LTWHP,
        ViewportHighlight,
    } from '$lib/types.ts';
    import HighlightChildrenWrapper from '$lib/components/HighlightChildrenWrapper.svelte';

    //import { onDestroy, setContext, getAllContexts, getContext, onMount } from 'svelte';

    const EMPTY_ID = 'empty-id';

    /**
     * A component responsible for managing all the highlights and ghost highlights
     * for a single page of a PDF document. It does not render each highlight
     * but it provides context for a highlight container to do so.
     * Its rendering should be controlled by a {@link PdfHighlighter}.
     *
     * @category Component
     * @internal
     */
    let {
        //highlightsByPage,
        pageNumber,
        scrolledToHighlightId,
        viewer,
        highlightBindings,
        children,
        highlightsStore,
        pdfScaleValue,
    }: HighlightLayerProps = $props();

    let currentHighlights = $derived(highlightsStore.highlightsByPage[pageNumber]);

    /*onMount(() => {
        console.log('H.layer mount - ' + pageNumber);
        //pdfScaleValue = getContext('pdfScaleValue');
        return () => {
            console.log('H.layer unmount - ' + pageNumber);
        };
    });

    onDestroy(() => {
        console.log('H.layer destroy - ' + pageNumber);
    });*/

    const getScaledHighlights = (highlights) => {
        if (!highlights) highlights = [];
        //console.log('run getScaledHighlights')
        let new_currentHighlights = highlights.map((highlight, index) => {
            const viewportHighlight: ViewportHighlight = {
                ...highlight,
                id: 'id' in highlight ? highlight.id : EMPTY_ID, // Give Empty ID to GhostHighlight
                position: scaledPositionToViewport(highlight.position, viewer),
            };

            const isScrolledTo = Boolean(scrolledToHighlightId === viewportHighlight.id);

            const highlightUtils = {
                highlight: viewportHighlight,
                viewportToScaled: (rect: LTWHP) => {
                    const viewport = viewer.getPageView(
                        (rect.pageNumber || pageNumber) - 1, // Convert to 0 index
                    ).viewport;

                    return viewportToScaled(rect, viewport);
                },
                screenshot: (boundingRect: LTWH) => screenshot(boundingRect, pageNumber, viewer),
                isScrolledTo: isScrolledTo,
                highlightBindings,
            };
            return highlightUtils;
        });
        return new_currentHighlights;
    };
    let a_currentHighlights = $state.raw(getScaledHighlights(currentHighlights));

    $effect.pre(() => {
        //TODO: remove effects and keys, force remount whole layer (when scale or highlights[page_number] change) instead
        pdfScaleValue.val; //dependence
        //scrolledToHighlightId;
        a_currentHighlights = getScaledHighlights(currentHighlights);
        //console.log('run HL effect, page:' + pageNumber);
    });
</script>

<style>
    div {
        z-index: -1;
        position: absolute;
    }
</style>

{#key pdfScaleValue.val}
<div>
    {#each a_currentHighlights as highlightUtils (highlightUtils.highlight.id)}

    <HighlightChildrenWrapper child_context={highlightUtils}>
        {@render children?.()}
    </HighlightChildrenWrapper>
    <!--<HighlightContext.Provider value={highlightUtils} key={index}>
        {children}
    </HighlightContext.Provider>-->
    {/each}
</div>
{/key}