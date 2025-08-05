<script lang="ts">
    //import { pdfHighlighterUtils } from '$lib/components/pdfHighlighterUtils.shared.svelte.ts';
    import AreaHighlight from '$lib/components/AreaHighlight.svelte';
    import TextHighlight from '$lib/components/TextHighlight.svelte';
    import MonitoredHighlightContainer from '$lib/components/MonitoredHighlightContainer.svelte';

    import { onMount, getContext, getAllContexts } from 'svelte';
    import type { CommentedHighlight, Tip, ViewportHighlight, PdfHighlighterUtils as TPdfHighlighterUtils} from '$lib/types.ts';

    interface HighlightContainerProps {
        editHighlight: (idToUpdate: string, edit: Partial<CommentedHighlight>) => void;
        onContextMenu?: (
            event: MouseEvent,
            highlight: ViewportHighlight<CommentedHighlight>,
        ) => void;
        onClick?: any;
        pdfHighlighterUtils: Partial<TPdfHighlighterUtils>;
        highlightMixBlendMode: string;
    }

    let {
        editHighlight,
        onContextMenu,
        onClick,
        pdfHighlighterUtils,
        highlightMixBlendMode,
    }: HighlightContainerProps = $props();
    let contexts = getAllContexts();

    //context set in HighLightLayer
    let { highlight, viewportToScaled, screenshot, highlightBindings }: any =
        getContext('highlightUtils'); //HighlightContext

    //const { toggleEditInProgress } = pdfHighlighterUtils; //usePdfHighlighterContext();
    let highlightTip: Tip = $state({
        position: highlight.position,
        content: { highlight },
    });
    //onMount(() => {
    //console.log('H.container mount');
    //return console.log('H.container unmount');
    //});
</script>

<MonitoredHighlightContainer highlightTip={highlightTip} {pdfHighlighterUtils}> 
    {#if highlight.type === "text"}
        <TextHighlight
            highlight={highlight}
            onContextMenu={(event) =>
                onContextMenu && onContextMenu(event, highlight)
            }
            onClick = {(event) => {
                    onClick && onClick(event, highlight)
                }
            }
            {pdfHighlighterUtils}
            {highlightMixBlendMode}
        />
    {:else}
        <AreaHighlight
            highlight={highlight}
            onChange={(boundingRect) => {
                const edit = {
                    position: {
                        boundingRect: viewportToScaled(boundingRect),
                        rects: [],
                    },
                    content: {
                        image: screenshot(boundingRect),
                    },
                };
                editHighlight(highlight.id, edit);
                //toggleEditInProgress(false);
            }}
            bounds={highlightBindings.textLayer}
            onContextMenu={(event) =>
                onContextMenu && onContextMenu(event, highlight)
            }
            onClick = {(event) =>
                onClick && onClick(event, highlight)
            }
            {pdfHighlighterUtils}
            {highlightMixBlendMode}
            isDraggable = {false}
        />
    {/if}
</MonitoredHighlightContainer>