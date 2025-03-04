<script module lang="ts">
    /**
     * The props type for {@link MouseSelection}.
     *
     * @category Component Properties
     * @internal
     */
    export interface MouseSelectionProps {
        /**
         * The PDFViewer instance containing this MouseSelection.
         */
        viewer: PDFViewer;

        /**
         * Callback triggered whenever the user stops dragging their mouse and a valid
         * mouse selection is made. In general, this will only be called if a mouse
         * selection is rendered.
         *
         * @param viewportPosition - viewport position of the mouse selection.
         * @param scaledPosition - scaled position of the mouse selection.
         * @param image - PNG screenshot of the mouse selection.
         * @param resetSelection - Callback to reset the current selection.
         * @param event - Mouse event associated with ending the selection.
         */
        onSelection?(
            viewportPosition: ViewportPosition,
            scaledPosition: ScaledPosition,
            image: string,
            resetSelection: () => void,
            event: MouseEvent,
        ): void;

        /**
         * Callback triggered whenever the current mouse selection is reset.
         * This includes when dragging ends but the selection is invalid.
         */
        onReset?(): void;

        /**
         * Callback triggered whenever a new valid mouse selection begins.
         *
         * @param event - mouse event associated with the new selection.
         */
        onDragStart?(event: MouseEvent): void;

        /**
         * Condition to check before any mouse selection starts.
         *
         * @param event - mouse event associated with the new selection.
         * @returns - `True` if mouse selection should start.
         */
        enableAreaSelection(event: MouseEvent): boolean;

        /**
         * Callback whenever the mouse selection area changes.
         *
         * @param isVisible - Whether the mouse selection is rendered (i.e., non-zero area)
         */
        //onChange?(isVisible: boolean): void;

        /**
         * Optional style props for the mouse selection rectangle.
         */
        style?: any; //CSSProperties;
    }
</script>

<script lang="ts">
    import { asElement, getPageFromElement, isHTMLElement } from '$lib/pdf_utils/pdfjs-dom';
    import { cssStringify } from '$lib/utils';
    import type { PDFViewer } from 'pdfjs-dist/types/web/pdf_viewer';
    import { viewportPositionToScaled } from '$lib/pdf_utils/coordinates';
    import screenshot from '$lib/pdf_utils/screenshot';
    import type { LTWH, LTWHP, ScaledPosition, ViewportPosition } from '$lib/types';
    import { onMount } from 'svelte';
    type Coords = {
        x: number;
        y: number;
    };

    const getBoundingRect = (start: Coords, end: Coords): LTWH => {
        return {
            left: Math.min(end.x, start.x),
            top: Math.min(end.y, start.y),

            width: Math.abs(end.x - start.x),
            height: Math.abs(end.y - start.y),
        };
    };

    const getContainerCoords = (container: HTMLElement, pageX: number, pageY: number) => {
        const containerBoundingRect = container.getBoundingClientRect();
        return {
            x: pageX - containerBoundingRect.left + container.scrollLeft,
            y: pageY - containerBoundingRect.top + container.scrollTop - window.scrollY,
        };
    };

    /**
     * A component that enables the creation of rectangular and interactive mouse
     * selections within a given container. NOTE: This does not disable selection in
     * whatever container the component is placed in. That must be handled through
     * the component's events.
     *
     * @category Component
     * @internal
     */
    let {
        viewer,
        onSelection,
        onReset,
        onDragStart,
        enableAreaSelection,
        //onChange,
        style,
    }: MouseSelectionProps = $props();

    let start: Coords | null = $state(null);
    let end: Coords | null = $state(null);
    let locked = $state(false);
    let rootRef: HTMLDivElement | null = null;

    // Needed in order to grab the page info of a mouse selection
    let startTargetRef: HTMLElement | null = null;

    const reset = () => {
        onReset && onReset();
        start = null;
        end = null;
        locked = false;
    };

    // Should be the PdfHighlighter
    let container;
    let mouseDown = $state(false);
    const handleMouseUp = (event: MouseEvent) => {
        mouseDown = false;
        if (Boolean(asElement(event.target).closest('.AreaHighlight'))) return;
        if (!start || !end || !startTargetRef) return;

        const boundingRect = getBoundingRect(start, end);

        // Check if the bounding rectangle has a minimum width and height
        // to prevent recording selections with 0 area
        let shouldEnd = boundingRect.width >= 10 && boundingRect.height >= 10;

        if (!container.contains(asElement(event.target)) || !shouldEnd) {
            reset();
            return;
        }

        locked = true;

        const page = getPageFromElement(startTargetRef);
        if (!page) return;

        const pageBoundingRect: LTWHP = {
            ...boundingRect,
            top: boundingRect.top - page.node.offsetTop,
            left: boundingRect.left - page.node.offsetLeft,
            pageNumber: page.number,
        };

        const viewportPosition: ViewportPosition = {
            boundingRect: pageBoundingRect,
            rects: [],
        };
        const scaledPosition = viewportPositionToScaled(viewportPosition, viewer);
        const image = screenshot(pageBoundingRect, pageBoundingRect.pageNumber, viewer);
        onSelection && onSelection(viewportPosition, scaledPosition, image, reset, event);
    };

    const handleMouseMove = (event: MouseEvent) => {
        if (!mouseDown || !rootRef || !start || locked) return;
        end = getContainerCoords(container, event.pageX, event.pageY);
    };

    const handleMouseDown = (event: MouseEvent) => {
        if (Boolean(asElement(event.target).closest('.AreaHighlight'))) return;
        mouseDown = true;
        const shouldStart = (event: MouseEvent) =>
            enableAreaSelection(event) &&
            isHTMLElement(event.target) &&
            Boolean(asElement(event.target).closest('.page'));

        // If the user clicks anywhere outside a tip, reset the selection
        const shouldReset = (event: MouseEvent) =>
            start && !asElement(event.target).closest('.PdfHighlighter__tip-container');
        if (!shouldStart(event)) {
            if (shouldReset(event)) reset();
            return;
        }

        startTargetRef = asElement(event.target);
        onDragStart && onDragStart(event);
        start = getContainerCoords(container, event.pageX, event.pageY);
        end = null;
        locked = false;
    };

    // Register event listeners
    onMount(() => {
        //onChange && onChange(Boolean(start && end));
        if (!rootRef) return;
        container = asElement(rootRef.parentElement);

        container.addEventListener('mousemove', handleMouseMove);
        container.addEventListener('mousedown', handleMouseDown);

        document.addEventListener('mouseup', handleMouseUp);

        return () => {
            container.removeEventListener('mousemove', handleMouseMove);
            container.removeEventListener('mousedown', handleMouseDown);
            document.removeEventListener('mouseup', handleMouseUp);
        };
    });
    //, [start, end]
</script>

<style>
    .MouseSelection {
        position: absolute;
        border: 1px dashed #333;
        background: rgba(153, 193, 218, 255);
        mix-blend-mode: multiply;
    }
    /* Internet Explorer support method */
    @media all and (-ms-high-contrast: none), (-ms-high-contrast: active) {
        .MouseSelection {
            opacity: 0.5;
        }
    }

    /* Microsoft Edge Browser 12+ (All) - @supports method */
    @supports (-ms-ime-align: auto) {
        .MouseSelection {
            opacity: 0.5;
        }
    }
</style>

<div class="MouseSelection-container" bind:this={rootRef}>
    {#if (start && end && mouseDown)}
        <div
            class="MouseSelection"
            style={cssStringify({ ...getBoundingRect(start, end), ...style }, 'px')}
        ></div>
    {/if}
</div>
