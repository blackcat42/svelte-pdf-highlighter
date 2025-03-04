<script lang="ts" module>
    /**
     * The props type for {@link MonitoredHighlightContainer}.
     *
     * @category Component Properties
     */
    export interface MonitoredHighlightContainerProps {
        /**
         * A callback triggered whenever the mouse hovers over a highlight.
         */
        onMouseEnter?(): void;

        /**
         * What tip to automatically display whenever a mouse hovers over a highlight.
         * The tip will persist even as the user puts their mouse over it and not the
         * highlight, but will disappear once it no longer hovers both.
         */
        highlightTip?: Tip;

        /**
         * A callback triggered whenever the mouse completely moves out from both the
         * highlight (children) and any highlightTip.
         */
        onMouseLeave?(): void;

        /**
         * Component to monitor mouse activity over. This should be a highlight within the {@link PdfHighlighter}.
         */
        children: any;

        setTip: any;
    }
</script>

<script lang="ts">
    import type { Tip } from '$lib/types';
    //import {setContext, getContext} from "svelte";

    /**
     * A container for a highlight component that monitors whether a mouse is over a
     * highlight and over some secondary highlight tip. It will display the tip
     * whenever the mouse is over the highlight and it will hide the tip only when
     * the mouse has left the highlight AND the tip.
     *
     * @category Component
     */
    let {
        onMouseEnter,
        highlightTip,
        onMouseLeave,
        children,
        setTip,
    }: MonitoredHighlightContainerProps = $props();
    let mouseInRef = $state(false); // Whether the mouse is over the child (highlight)

    //const { isEditingOrHighlighting } = pdfHighlighterUtils.utils;
    //let tipContainerState = setContext('tipContainerState', highlightTip);
</script>


<!-- svelte-ignore a11y_no_static_element_interactions -->
<div
    class="highlight_container"
    onmouseenter={() => {
        mouseInRef = true; 
        onMouseEnter && onMouseEnter();
        //if (isEditingOrHighlighting()) return;
        if (highlightTip) {
            // MouseMonitor the highlightTip to prevent it from disappearing if the mouse is over it and not the highlight.
            setTip({
                show: true,
                tip: highlightTip,
                tip_id: highlightTip.content.id,
            });
        }
    }}
    onmouseleave={() => {
        //if (tipContainerState && !(tipContainerState.mouseInRef)) {
        if (true) {
            setTip({
                show: false,
            });
        }
        //}
        //tipContainerState.show = false;
        //mouseInRef = false;
        // Trigger onMouseLeave if no highlightTip exists
        !highlightTip && onMouseLeave && onMouseLeave();
    }}
>
    {@render children()}
</div>

