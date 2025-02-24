<script lang="ts">

    //import { pdfScaleValue } from "$lib/components/pdfHighlighterUtils.shared.svelte.ts";
    import {debounce} from "$lib/utils.ts";
    interface ToolbarProps {
        setPdfScaleValue: (value: number) => void;
        selectedTool: string;
        pdfScaleValue: any;
        searchInPdf: any;
    }

    let { setPdfScaleValue, pdfScaleValue, selectedTool = $bindable(), searchInPdf }: ToolbarProps = $props();
    //let zoom: number | null = $state(null);
  //let isHighlightPen: boolean = $state(false);

  const zoomIn = () => {

    if (pdfScaleValue.val > 0) {
      if (pdfScaleValue.val < 4) {
        setPdfScaleValue(parseFloat(pdfScaleValue.val) + 0.1);
        //zoom = zoom + 0.1;
      }
    } else {
      setPdfScaleValue(1);
      //zoom = 1;
    }
  };

  const zoomOut = () => {
    if (pdfScaleValue.val > 0) {
      if (pdfScaleValue.val > 0.2) {
        setPdfScaleValue(parseFloat(pdfScaleValue.val) - 0.1);
        //zoom = zoom - 0.1;
        //pdfScaleValue.val = zoom;
      }
    } else {
      setPdfScaleValue(1);
      //zoom = 1;
    }
  };
  const zoomString = (val) => {
    setPdfScaleValue(val);
  }

  let searchOptions = $state({
    query: '',
  });

  const search = (opts) => {
    searchOptions = {...searchOptions, ...opts}
    searchInPdf.search(searchOptions);
  }

//${isHighlightPen ? 'active' : ''}` add to button class
</script>

<style>
    .Toolbar {
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding: 4px 16px;
        background-color: #2b2e33;
        color: #f5f5f5;
        border-bottom: 2px solid #9096a2;
    }

    .ZoomControls {
        display: flex;
        align-items: center;
    }

    .ZoomControls button {
        color: #f5f5f5;
        border: none;
        cursor: pointer;
        font-size: 1.2rem;
        padding: 2px;
        background-size: cover;
        background-repeat: no-repeat;
        background-color: transparent;
    }
    button {
        margin-left: 8px;
        display: flex;
        align-items: center;
    }
    .icon {
        width: 1.2rem;
        height: 1.2rem; 
        display: inline;
        margin-right: 3px;
    }
    .icon > svg {
        width: 100%;
        height: 100%;
        fill: white;
    }
    .icon > svg:hover {
        fill: #555;
    }

    .HighlightButton {
        background: none;
        /* Remove background */
        color: #f5f5f5;
        border: none;
        /* Remove border */
        cursor: pointer;
        font-size: 1rem;
        padding: 2px;
        margin-right: 8px;
/*        transition: color 0.3s, transform 0.2s;*/
    }

    .HighlightButton:hover {
        color: #555;
/*        transform: scale(1.05);*/
    }

    .HighlightButton.active {
        color: #b958ff;
    }

    .Toolbar__page-width {
        height: 2rem;
        width: 2rem;
    background-image: url('data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" height="2rem" viewBox="0 -960 960 960" width="2rem" fill="%23fff"><path d="M168-192q-29.7 0-50.85-21.16Q96-234.32 96-264.04v-432.24Q96-726 117.15-747T168-768h624q29.7 0 50.85 21.16Q864-725.68 864-695.96v432.24Q864-234 842.85-213T792-192H168Zm624-504H168v432h624v-432Zm-624 0v432-432Zm192 336v-240L240-480l120 120Zm360-120L600-600v240l120-120Z"/></svg>');
}
.Toolbar__page-width:hover {
    background-image: url('data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" height="30px" viewBox="0 -960 960 960" width="30px" fill="%23555"><path d="M168-192q-29.7 0-50.85-21.16Q96-234.32 96-264.04v-432.24Q96-726 117.15-747T168-768h624q29.7 0 50.85 21.16Q864-725.68 864-695.96v432.24Q864-234 842.85-213T792-192H168Zm624-504H168v432h624v-432Zm-624 0v432-432Zm192 336v-240L240-480l120 120Zm360-120L600-600v240l120-120Z"/></svg>');
}

.Toolbar__page-height {
        height: 30px;
        width: 30px;
    background-image: url('data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" height="24px" viewBox="0 -960 960 960" width="24px" fill="%23ffffff"><path d="M240-80q-33 0-56.5-23.5T160-160v-640q0-33 23.5-56.5T240-880h480q33 0 56.5 23.5T800-800v640q0 33-23.5 56.5T720-80H240Zm480-80v-640H240v640h480Zm0-640H240h480ZM360-600h240L480-720 360-600Zm120 360 120-120H360l120 120Z"/></svg>');
}
.Toolbar__page-height:hover {
    background-image: url('data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" height="24px" viewBox="0 -960 960 960" width="24px" fill="%23555"><path d="M240-80q-33 0-56.5-23.5T160-160v-640q0-33 23.5-56.5T240-880h480q33 0 56.5 23.5T800-800v640q0 33-23.5 56.5T720-80H240Zm480-80v-640H240v640h480Zm0-640H240h480ZM360-600h240L480-720 360-600Zm120 360 120-120H360l120 120Z"/></svg>');
}

</style>


 <div class="Toolbar">
      <div class="ZoomControls">
        {#if (typeof pdfScaleValue.val === 'number')}
            {(pdfScaleValue.val * 100).toFixed(0)}%
        {:else}
            {pdfScaleValue.val}
        {/if}
        <button title="Zoom out" onclick={zoomOut}>-</button>
        <button title="Zoom in" onclick={zoomIn}>+</button>
        <button class="Toolbar__page-width" onclick={()=>{zoomString('page-width')}}></button>
        <!--<button class="Toolbar__page-height" onclick={()=>{zoomString('page-height')}}></button>
        <button onclick={()=>{zoomString('page-actual')}}>page-actual</button>
        <button onclick={()=>{zoomString('page-fit')}}>page-fit</button>
        <button onclick={()=>{zoomString('auto')}}>auto</button>-->
        
      </div>

      <div style="display: flex;">
      <button title="Text selection" class="HighlightButton" onclick={() => {
        selectedTool = 'text_selection';
      }}><div class="icon"><svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 256 512"><!--!Font Awesome Free 6.7.2 by @fontawesome - https://fontawesome.com License - https://fontawesome.com/license/free Copyright 2025 Fonticons, Inc.--><path d="M.1 29.3C-1.4 47 11.7 62.4 29.3 63.9l8 .7C70.5 67.3 96 95 96 128.3L96 224l-32 0c-17.7 0-32 14.3-32 32s14.3 32 32 32l32 0 0 95.7c0 33.3-25.5 61-58.7 63.8l-8 .7C11.7 449.6-1.4 465 .1 482.7s16.9 30.7 34.5 29.2l8-.7c34.1-2.8 64.2-18.9 85.4-42.9c21.2 24 51.2 40 85.4 42.9l8 .7c17.6 1.5 33.1-11.6 34.5-29.2s-11.6-33.1-29.2-34.5l-8-.7C185.5 444.7 160 417 160 383.7l0-95.7 32 0c17.7 0 32-14.3 32-32s-14.3-32-32-32l-32 0 0-95.7c0-33.3 25.5-61 58.7-63.8l8-.7c17.6-1.5 30.7-16.9 29.2-34.5S239-1.4 221.3 .1l-8 .7C179.2 3.6 149.2 19.7 128 43.7c-21.2-24-51.2-40-85.4-42.9l-8-.7C17-1.4 1.6 11.7 .1 29.3z"/></svg></div></button>

      <button title="Pan" class="HighlightButton" onclick={() => {
        selectedTool === 'hand' ? selectedTool = 'text_selection' : selectedTool = 'hand';
      }}><div class="icon"><svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512"><!--!Font Awesome Free 6.7.2 by @fontawesome - https://fontawesome.com License - https://fontawesome.com/license/free Copyright 2025 Fonticons, Inc.--><path d="M256 0c-25.3 0-47.2 14.7-57.6 36c-7-2.6-14.5-4-22.4-4c-35.3 0-64 28.7-64 64l0 165.5-2.7-2.7c-25-25-65.5-25-90.5 0s-25 65.5 0 90.5L106.5 437c48 48 113.1 75 181 75l8.5 0 8 0c1.5 0 3-.1 4.5-.4c91.7-6.2 165-79.4 171.1-171.1c.3-1.5 .4-3 .4-4.5l0-176c0-35.3-28.7-64-64-64c-5.5 0-10.9 .7-16 2l0-2c0-35.3-28.7-64-64-64c-7.9 0-15.4 1.4-22.4 4C303.2 14.7 281.3 0 256 0zM240 96.1l0-.1 0-32c0-8.8 7.2-16 16-16s16 7.2 16 16l0 31.9 0 .1 0 136c0 13.3 10.7 24 24 24s24-10.7 24-24l0-136c0 0 0 0 0-.1c0-8.8 7.2-16 16-16s16 7.2 16 16l0 55.9c0 0 0 .1 0 .1l0 80c0 13.3 10.7 24 24 24s24-10.7 24-24l0-71.9c0 0 0-.1 0-.1c0-8.8 7.2-16 16-16s16 7.2 16 16l0 172.9c-.1 .6-.1 1.3-.2 1.9c-3.4 69.7-59.3 125.6-129 129c-.6 0-1.3 .1-1.9 .2l-4.9 0-8.5 0c-55.2 0-108.1-21.9-147.1-60.9L52.7 315.3c-6.2-6.2-6.2-16.4 0-22.6s16.4-6.2 22.6 0L119 336.4c6.9 6.9 17.2 8.9 26.2 5.2s14.8-12.5 14.8-22.2L160 96c0-8.8 7.2-16 16-16c8.8 0 16 7.1 16 15.9L192 232c0 13.3 10.7 24 24 24s24-10.7 24-24l0-135.9z"/></svg></div></button>

      <button title="Highlight text" class="HighlightButton" onclick={() => {
        selectedTool === 'highlight_pen' ? selectedTool = 'text_selection' : selectedTool = 'highlight_pen';
        //console.log(highlightPen)
      }}><div class="icon"><svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 576 512"><!--!Font Awesome Free 6.7.2 by @fontawesome - https://fontawesome.com License - https://fontawesome.com/license/free Copyright 2025 Fonticons, Inc.--><path d="M315 315l158.4-215L444.1 70.6 229 229 315 315zm-187 5s0 0 0 0l0-71.7c0-15.3 7.2-29.6 19.5-38.6L420.6 8.4C428 2.9 437 0 446.2 0c11.4 0 22.4 4.5 30.5 12.6l54.8 54.8c8.1 8.1 12.6 19 12.6 30.5c0 9.2-2.9 18.2-8.4 25.6L334.4 396.5c-9 12.3-23.4 19.5-38.6 19.5L224 416l-25.4 25.4c-12.5 12.5-32.8 12.5-45.3 0l-50.7-50.7c-12.5-12.5-12.5-32.8 0-45.3L128 320zM7 466.3l63-63 70.6 70.6-31 31c-4.5 4.5-10.6 7-17 7L24 512c-13.3 0-24-10.7-24-24l0-4.7c0-6.4 2.5-12.5 7-17z"/></svg></div></button>
      <button title="Highlight area" class="HighlightButton" onclick={() => {
        selectedTool === 'area_selection' ? selectedTool = 'text_selection' : selectedTool = 'area_selection';
        //console.log(highlightPen)
      }}><div class="icon"><svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 448 512"><!--!Font Awesome Free 6.7.2 by @fontawesome - https://fontawesome.com License - https://fontawesome.com/license/free Copyright 2025 Fonticons, Inc.--><path d="M384 80c8.8 0 16 7.2 16 16l0 320c0 8.8-7.2 16-16 16L64 432c-8.8 0-16-7.2-16-16L48 96c0-8.8 7.2-16 16-16l320 0zM64 32C28.7 32 0 60.7 0 96L0 416c0 35.3 28.7 64 64 64l320 0c35.3 0 64-28.7 64-64l0-320c0-35.3-28.7-64-64-64L64 32z"/></svg></div></button>

      
  </div>
      
      <div style="display: flex;">
      <input placeholder="search" bind:value={searchOptions.query} onkeyup={debounce(search, 200)} />
      <button onclick={ () => search({query: ''}) }>x</button>
      <button onclick={ () => search({findPrevious: true}) }>prev</button>
      <button onclick={ () => search({findPrevious: false}) }>next</button>
        </div>
    </div>