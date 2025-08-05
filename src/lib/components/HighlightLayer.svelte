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

        highlightsStore: HighlightsModel<Highlight>;
        
        pdfHighlighterUtils: Partial<TPdfHighlighterUtils>;
    }
</script>

<script lang="ts">
    import type { PDFViewer } from 'pdfjs-dist/types/web/pdf_viewer';
    import type { HighlightsModel } from '$lib/HighlightsModel.svelte.ts';
    import { scaledPositionToViewport, viewportToScaled } from '$lib/pdf_utils/coordinates';
    import screenshot from '$lib/pdf_utils/screenshot';
    import type {
        Highlight,
        HighlightBindings,
        LTWH,
        LTWHP,
        ViewportHighlight,
        PdfHighlighterUtils as TPdfHighlighterUtils,
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
        viewer,
        highlightBindings,
        children,
        highlightsStore,
        pdfHighlighterUtils,
    }: HighlightLayerProps = $props();

    let currentHighlights = $derived(highlightsStore.highlightsByPage[pageNumber]);

    /*onMount(() => {
        console.log('H.layer mount - ' + pageNumber);
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

            //const isScrolledTo = Boolean(pdfHighlighterUtils.scrolledToHighlightIdRef === viewportHighlight.id);

            const highlightUtils = {
                highlight: viewportHighlight,
                viewportToScaled: (rect: LTWHP) => {
                    const viewport = viewer.getPageView(
                        (rect.pageNumber || pageNumber) - 1, // Convert to 0 index
                    ).viewport;

                    return viewportToScaled(rect, viewport);
                },
                screenshot: (boundingRect: LTWH) => screenshot(boundingRect, pageNumber, viewer),
                highlightBindings,
            };
            return highlightUtils;
        });
        return new_currentHighlights;
    };
    let a_currentHighlights = $state.raw(getScaledHighlights(currentHighlights));

    $effect.pre(() => {
        //TODO: remove effects and keys, force remount whole layer (when scale or highlights[page_number] change) instead
        pdfHighlighterUtils.currentScale; //dependence
        a_currentHighlights = getScaledHighlights(currentHighlights);
        //console.log('run HL effect, page:' + pageNumber);
    });

    
    const getCurrentHighlightsInOrder = (highlights) => {

        //text highlights always on top
        //let _hls_txt = [...highlights.filter((item)=>item.highlight.type === 'text')];
        //let _hls_area = [...highlights.filter((item)=>item.highlight.type === 'area')];
        //_hls_txt.sort((a, b) => a.highlight.z_index - b.highlight.z_index);
        //_hls_area.sort((a, b) => a.highlight.z_index - b.highlight.z_index);
        //return [..._hls_area,..._hls_txt];

        //highlights = highlights.toReversed(); //order of same index highlights
        highlights.sort((a, b) => a.highlight.z_index - b.highlight.z_index);
        return highlights;

        /*let _hls_txt = [...highlights.filter((item)=>item.highlight.type === 'text')].reverse();
        let _hls_area = [...highlights.filter((item)=>item.highlight.type === 'area')].reverse();


        const result = _hls_txt.reduceRight((accumulator, currentValue) => {
            let item = accumulator.find(x => x.highlight.id === currentValue.highlight.parent_hl_id);
            let index = accumulator.indexOf(item);
            if (currentValue.highlight.parent_hl_id && index === -1) {
                accumulator.splice(accumulator.length, 0, currentValue);
            } else {
                index = index !== -1 ? index + 1 : 0;
                accumulator.splice(index, 0, currentValue);
            }
            return accumulator;
        }, []);
        const result2 = _hls_area.reduceRight((accumulator, currentValue) => {
            let item = accumulator.find(x => x.highlight.id === currentValue.highlight.parent_hl_id);
            let index = accumulator.indexOf(item);
            if (currentValue.highlight.parent_hl_id && index === -1) {
                accumulator.splice(accumulator.length, 0, currentValue);
            } else {
                index = index !== -1 ? index + 1 : 0;
                accumulator.splice(index, 0, currentValue);
            }
            return accumulator;
        }, []);

        return [...result2,...result];*/
    };

</script>

<style>
    div {
        z-index: -1;
        position: absolute;
    }
</style>

{#key pdfHighlighterUtils.currentScale}
<div>
    {#each getCurrentHighlightsInOrder(a_currentHighlights) as highlightUtils (highlightUtils.highlight.id)}

    <HighlightChildrenWrapper child_context={highlightUtils}>
        {@render children?.()}
    </HighlightChildrenWrapper>

    {/each}
</div>
{/key}