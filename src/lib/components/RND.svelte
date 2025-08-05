<script lang="ts">
    import { cssStringify } from '$lib/utils';
    import type { Debounced } from '$lib/utils';
    import { getContext } from 'svelte';
    import { on } from 'svelte/events';
    import type { ViewportHighlight, PdfHighlighterUtils as TPdfHighlighterUtils, LTWH, LTWHP } from '$lib/types';

    const _color = getContext('colors') ? getContext('colors')[0] : 'yellow';
    let {
        boundingRect,
        onDragOrResizeStop,
        bounds,
        //style,
        color = _color,
        isAllowTextSelection,
        allowTextSelection,
        pdfHighlighterUtils,
        highlight,
        onClick,
        isDraggable,
    }: RndProps = $props();

    interface RndProps {
        boundingRect: LTWHP;
        onDragOrResizeStop?: (data: LTWH)=>void;
        bounds?: Element;
        color: string;
        highlight: ViewportHighlight;
        pdfHighlighterUtils: Partial<TPdfHighlighterUtils>;
        isAllowTextSelection: boolean;
        allowTextSelection: Debounced;
        //style?: string;
        onClick?(event: MouseEvent): void;
        isDraggable: boolean;
    }

    let bounds_rect = bounds.getBoundingClientRect();

    let style = $state({
        left: boundingRect.left,
        top: boundingRect.top,
        width: boundingRect.width,
        height: boundingRect.height,
        bottom: 0,
        right: 0,
    });

    let left = $state(boundingRect.left);
    let top = $state(boundingRect.top);

    let moving = false;
    let resizing = false;
    let resizing_direction = '';

    let removeMouseUpListener = null;
    let removeMouseMoveListener = null;

    function onMouseDown(e) {
        if (isAllowTextSelection) return;
        allowTextSelection.cancel();
        e.stopPropagation();
        moving = true;
        //onEditStart();
        removeMouseUpListener = on(document, 'mouseup', onMouseUp);
        removeMouseMoveListener = on(document, 'mousemove', onMouseMove);
        bounds_rect = bounds.getBoundingClientRect();
    }

    function resizer_onMouseDown(e, d) {
        //e.stopPropagation();
        removeMouseUpListener = on(document, 'mouseup', onMouseUp);
        removeMouseMoveListener = on(document, 'mousemove', onMouseMove);
        resizing = true;
        resizing_direction = d;
        bounds_rect = bounds.getBoundingClientRect();
    }

    function onMouseMove(e) {
        if (!moving && !resizing) return;
        if (style.left <= 1) {
            style.left += 5;
            return;
        } else if (style.width + style.left >= bounds_rect.width) {
            style.left -= 5;
            return;
        } else if (style.top <= 1) {
            style.top += 5;
            return;
        } else if (style.height + style.top >= bounds_rect.height) {
            style.top -= 5;
            return;
        }
        if (style.height <= 11) {
            style.height += 1;
            //resizing = false;
            return;
        } else if (style.width <= 11) {
            style.width += 1;
            //resizing = false;
            return;
        }
        /*if (style.height <= 50 || style.width <= 50) {
            return;
        }*/

        if (moving) {
            style.left += e.movementX;
            style.top += e.movementY;
        } else if (resizing) {
            if (resizing_direction == 'nw') {
                style.width -= e.movementX;
                style.height -= e.movementY;
                style.left += e.movementX;
                style.top += e.movementY;
            } else if (resizing_direction == 'ne') {
                style.width += e.movementX;
                style.height -= e.movementY;
                style.right += e.movementX;
                style.top += e.movementY;
            } else if (resizing_direction == 'se') {
                style.width += e.movementX;
                style.height += e.movementY;
                style.right += e.movementX;
                style.bottom -= e.movementY;
            } else if (resizing_direction == 'sw') {
                style.width -= e.movementX;
                style.height += e.movementY;
                style.left += e.movementX;
                style.bottom += e.movementY;
            }
        }
    }

    function onMouseUp() {
        if (!moving && !resizing) return;
        removeMouseUpListener();
        removeMouseMoveListener();
        moving = false;
        resizing = false;
        onDragOrResizeStop(style);
    }

    /*onMount(() => {
        return () => {
        };
    });*/
    const scrolledToColor = getContext('scrolledTo_color');
</script>

<style>
    .draggable {
        user-select: none;
        cursor: move;
        border: solid 1px gray;
        position: absolute;
        /*resize:both;overflow: auto;*/
        min-height: 10px;
        min-width: 10px;
    }

    .resizable {
        /*  background-color: palegoldenrod;*/
        user-select: none;
        cursor: pointer;
        position: absolute;
    }

    .resizable .resizers {
        width: 100%;
        height: 100%;
        /*border: 1px solid #000;*/
        border: none;
        box-sizing: border-box;
    }

    .resizable .resizers .resizer {
        width: 5px;
        height: 5px;
        /*border-radius: 50%;*/
        background: transparent;
        /*border: 1px solid #000;*/
        border: none;
        position: absolute;
    }
    .resizable:hover .resizers .resizer {
        border: 1px solid #000;
        background: #fff;
    }
    .resizable .resizers .resizer.top-left {
        left: -5px;
        top: -5px;
        cursor: nwse-resize; /*resizer cursor*/
    }
    .resizable .resizers .resizer.top-right {
        right: -5px;
        top: -5px;
        cursor: nesw-resize;
    }
    .resizable .resizers .resizer.bottom-left {
        left: -5px;
        bottom: -5px;
        cursor: nesw-resize;
    }
    .resizable .resizers .resizer.bottom-right {
        right: -5px;
        bottom: -5px;
        cursor: nwse-resize;
    }
    .allowSelect {
        /*pointer-events: none;*/
        user-select: text !important;
        cursor: text !important;
    }

    .AreaHighlight {
        transition: background 1s;
    }
    .AreaHighlight--scrolledTo {
        transition: none;
    }
</style>

<!-- svelte-ignore a11y_no_static_element_interactions -->
<!-- svelte-ignore slot_element_deprecated -->
<!-- svelte-ignore a11y_click_events_have_key_events -->
<div 
    style="{cssStringify(style, 'px')}; background: {(pdfHighlighterUtils.scrolledToHighlightIdRef === highlight.id && scrolledToColor) ? scrolledToColor : color};" 
    class= "{(!isAllowTextSelection && isDraggable) ? 'draggable resizable':'resizable'} {(pdfHighlighterUtils.scrolledToHighlightIdRef === highlight.id) ? 'AreaHighlight--scrolledTo' : 'AreaHighlight'}"
    onmousedown={(e) => {
        onClick(e);
        if (!isAllowTextSelection && isDraggable) {
            onMouseDown(e);
            e.preventDefault(); 
            e.stopPropagation();
        } else {
            pdfHighlighterUtils.setCurrentHighlightId(highlight.id);
        }
    }}
>
    <div class= {isAllowTextSelection ? 'resizers allowSelect':'resizers'}>
    <div onmousedown = {(e)=>{e.stopPropagation(); e.preventDefault(); resizer_onMouseDown(e, 'nw')}} class='resizer top-left'></div>
    <div onmousedown = {(e)=>{e.stopPropagation(); e.preventDefault(); resizer_onMouseDown(e, 'ne')}} class='resizer top-right'></div>
    <div onmousedown = {(e)=>{e.stopPropagation(); e.preventDefault(); resizer_onMouseDown(e, 'sw')}} class='resizer bottom-left'></div>
    <div onmousedown = {(e)=>{e.stopPropagation(); e.preventDefault(); resizer_onMouseDown(e, 'se')}} class='resizer bottom-right'></div>
    </div>
    <slot></slot>
</div>
