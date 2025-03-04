<script lang="ts">
    import { cssStringify } from '$lib/utils';
    import { onMount, getContext } from 'svelte';
    import { on } from 'svelte/events';

    const _color = getContext('colors') ? getContext('colors')[0] : 'yellow';
    let {
        boundingRect,
        onDragOrResizeStop,
        //onResizeStop,
        //onDragStart,
        //onResizeStart,
        //onEditStart,
        //default,
        bounds,
        onClick,
        //style,
        color = _color,
    }: RndProps = $props();

    interface RndProps {
        boundingRect: any;
        onDragOrResizeStop: any;
        //onResizeStop?: any;
        //onDragStart?: any;
        //onResizeStart?: any;
        //onEditStart: any;
        onClick: any;
        bounds?: Element;
        color: string;
        //style?: any;
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
        e.stopPropagation();
        moving = true;
        //onEditStart();
        removeMouseUpListener = on(document, 'mouseup', onMouseUp);
        removeMouseMoveListener = on(document, 'mousemove', onMouseMove);
        //document.addEventListener('mouseup', onMouseUp);
        //document.addEventListener('mousemove', onMouseMove);
        bounds_rect = bounds.getBoundingClientRect();
    }

    function resizer_onMouseDown(e, d) {
        //e.stopPropagation();
        removeMouseUpListener = on(document, 'mouseup', onMouseUp);
        //document.addEventListener('mouseup', onMouseUp);
        removeMouseMoveListener = on(document, 'mousemove', onMouseMove);
        //document.addEventListener('mousemove', onMouseMove);
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
        //document.removeEventListener('mouseup', onMouseUp);
        //document.removeEventListener('mousemove', onMouseMove);
        moving = false;
        resizing = false;

        onDragOrResizeStop(style);
    }

    /*onMount(() => {
        return () => {
        };
    });*/
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
        width: 10px;
        height: 10px;
        /*border-radius: 50%;*/
        background: transparent;
        /*border: 1px solid #000;*/
        border: none;
        position: absolute;
    }
    .resizable:hover .resizers .resizer {
        border: 1px solid #000;
        background: grey;
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
</style>

<!-- svelte-ignore a11y_no_static_element_interactions -->
<!-- svelte-ignore slot_element_deprecated -->
<section onmousedown={onMouseDown} style="{cssStringify(style, 'px')}; background-color: {color}" class="draggable resizable" >
    <div class='resizers'>
    <div onmousedown = {(e)=>{e.stopPropagation(); e.preventDefault(); resizer_onMouseDown(e, 'nw')}} class='resizer top-left'></div>
    <div onmousedown = {(e)=>{e.stopPropagation(); e.preventDefault(); resizer_onMouseDown(e, 'ne')}} class='resizer top-right'></div>
    <div onmousedown = {(e)=>{e.stopPropagation(); e.preventDefault(); resizer_onMouseDown(e, 'sw')}} class='resizer bottom-left'></div>
    <div onmousedown = {(e)=>{e.stopPropagation(); e.preventDefault(); resizer_onMouseDown(e, 'se')}} class='resizer bottom-right'></div>
    </div>
    <slot></slot>
</section>
