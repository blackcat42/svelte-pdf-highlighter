<script lang="ts">
    import { debounce } from '$lib/utils.ts';
    interface ToolbarProps {
        selectedTool: string;
        searchInPdf: any;
        pdfHighlighterUtils: any;
        sidebarVisible: boolean;
    }

    let {
        selectedTool = $bindable(),
        sidebarVisible = $bindable(),
        searchInPdf,
        pdfHighlighterUtils,
    }: ToolbarProps = $props();

    const zoomIn = () => {
        if (pdfHighlighterUtils.currentScaleValue > 0) {
            if (pdfHighlighterUtils.currentScaleValue < 4) {
                pdfHighlighterUtils.setCurrentScaleValue(parseFloat(pdfHighlighterUtils.currentScaleValue) + 0.1);
                //zoom = zoom + 0.1;
            }
        } else {
            pdfHighlighterUtils.setCurrentScaleValue(1);
            //zoom = 1;
        }
    };

    const zoomOut = () => {
        if (pdfHighlighterUtils.currentScaleValue > 0) {
            if (pdfHighlighterUtils.currentScaleValue > 0.2) {
                pdfHighlighterUtils.setCurrentScaleValue(parseFloat(pdfHighlighterUtils.currentScaleValue) - 0.1);
                //zoom = zoom - 0.1;
                //pdfScaleValue.val = zoom;
            }
        } else {
            pdfHighlighterUtils.setCurrentScaleValue(1);
            //zoom = 1;
        }
    };
    const zoomString = (val) => {
        pdfHighlighterUtils.setCurrentScaleValue(val);
    };

    let searchOptions = $state({
        query: '',
    });

    const search = (opts) => {
        searchOptions = { ...searchOptions, ...opts };
        searchInPdf(searchOptions);
    };

    //${isHighlightPen ? 'active' : ''}` add to button class
    let currentColor = '#ffffff';
</script>

<style>
    .Toolbar {
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding: 0.2rem 0.5rem;
        background-color: #F8F9FA;
        color: #6C757D;
        border-bottom: 0px solid #DEE2E6;
        box-shadow: 0px 2px 2px #CED4DA;
        position: sticky;
        z-index: 1;
        height: 1.7rem;
        font-size: 0.9rem;
    }

    .ZoomControls {
        display: flex;
        align-items: center;
    }

    button {
        display: flex;
        align-items: center;
    }
    .buttonSeparator {
        width: 2px;
        height: 1.35rem;
        border-left: 1px solid #CED4DA;
        border-right: none;
    }
    .icon {
        width: 1.1rem;
        height: 1.1rem;
        display: inline;
        margin: 0px auto;
    }
    .icon > svg {
        width: 100%;
        height: 100%;
        stroke: #6C757D;
    }
    .HighlightButton:hover .icon > svg {
        stroke: #343A40;
    }

    .HighlightButton {

        border: 0px solid;
        border-radius: 5px;
        width: 1.7rem;
        height: 1.7rem;

        background: none;
        /* Remove background */
        color: #DEE2E6;
        
        /* Remove border */
        cursor: pointer;
        font-size: 1rem;
        padding: 2px;
        margin-right: 4px;
        margin-left: 4px;
        /*        transition: color 0.3s, transform 0.2s;*/
    }

    .HighlightButton:hover {
        color: #343A40;
        /*        transform: scale(1.05);*/
        background-color: #E9ECEF;
    }

    .HighlightButton.active svg {
        stroke: #343A40 !important;
    }
    .HighlightButton.active {
        background-color: #E9ECEF;
    }

    .searchClear {
        background: white !important;
        border: 1px solid #DEE2E6;
        border-radius: 0px 5px 5px 0px;

        position: absolute;
          display: inline;
          right: 0px;
          height: 1.1rem;
          padding: 0px;
          border: none;
    }
    .searchInput {
        height: 1.5rem;
        border: 1px solid #DEE2E6;
        border-radius: 5px;
    }
</style>


<div class="Toolbar">

        <div class="ZoomControls">
            <button class="HighlightButton" onclick={() => sidebarVisible = !sidebarVisible} title="Highlights"><div style="height: 1.35rem; width: 1.35rem;" class="icon">
                {#if (sidebarVisible)}
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke-width="1.3" stroke-linecap="round" stroke-linejoin="round"><rect width="18" height="18" x="3" y="3" rx="2"/><path d="M9 3v18"/><path d="m16 15-3-3 3-3"/><!--Lucide - https://lucide.dev License - https://lucide.dev/license Copyright (c) for portions of Lucide are held by Cole Bemis 2013-2022 as part of Feather (MIT). All other copyright (c) for Lucide are held by Lucide Contributors 2022.--></svg>
                {:else}
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke-width="1.3" stroke-linecap="round" stroke-linejoin="round"><rect width="18" height="18" x="3" y="3" rx="2"/><path d="M9 3v18"/><path d="m14 9 3 3-3 3"/><!--Lucide - https://lucide.dev License - https://lucide.dev/license Copyright (c) for portions of Lucide are held by Cole Bemis 2013-2022 as part of Feather (MIT). All other copyright (c) for Lucide are held by Lucide Contributors 2022.--></svg>
                {/if}

            </div></button>
            <div class="buttonSeparator"></div>
            <button class="HighlightButton" title="Zoom out" onclick={zoomOut}><div class="icon"><svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12h14"/><!--Lucide - https://lucide.dev License - https://lucide.dev/license Copyright (c) for portions of Lucide are held by Cole Bemis 2013-2022 as part of Feather (MIT). All other copyright (c) for Lucide are held by Lucide Contributors 2022.--></svg></div></button>
            <div style="width: 2.5rem">
                {#if (parseFloat(pdfHighlighterUtils.currentScale) > 0)}
                    {(pdfHighlighterUtils.currentScale * 100).toFixed(0)}%
                {:else}
                    {pdfHighlighterUtils.currentScale}
                {/if}
            </div>
            <button class="HighlightButton" title="Zoom in" onclick={zoomIn}><div class="icon"><svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12h14"/><path d="M12 5v14"/><!--Lucide - https://lucide.dev License - https://lucide.dev/license Copyright (c) for portions of Lucide are held by Cole Bemis 2013-2022 as part of Feather (MIT). All other copyright (c) for Lucide are held by Lucide Contributors 2022.--></svg></div></button>
            <div class="buttonSeparator"></div>
            <button class="Toolbar__page-width HighlightButton" onclick={()=>{zoomString('page-width')}}><div class="icon" style="height: 1.3rem; width: 1.3rem;"><svg xmlns="http://www.w3.org/2000/svg" width="20" height="25" viewBox="0 0 23 23" fill="none" stroke-width="1.1" stroke-linecap="round" stroke-linejoin="round" ><rect width="15" height="19" x="4" y="2" rx="1"/>     <path d="m14 9 3 3-3 3"/><path d="M7 12h10"/><path d="m9 9-3 3 3 3"/><!--Lucide - https://lucide.dev License - https://lucide.dev/license Copyright (c) for portions of Lucide are held by Cole Bemis 2013-2022 as part of Feather (MIT). All other copyright (c) for Lucide are held by Lucide Contributors 2022.--></svg></div></button>
            <!--<button class="Toolbar__page-height" onclick={()=>{zoomString('page-height')}}></button>
            <button onclick={()=>{zoomString('page-actual')}}>page-actual</button>
            <button onclick={()=>{zoomString('page-fit')}}>page-fit</button>
            <button onclick={()=>{zoomString('auto')}}>auto</button>-->  
        </div>

        <div style="display: flex;">
            <button 
                title="Text selection" 
                class={selectedTool === 'text_selection' ? 'HighlightButton active':'HighlightButton'}
                
                onclick={() => {
                    selectedTool = 'text_selection';
                }}
            >
                <div class="icon"><svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="{currentColor}" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><path d="M17 22h-1a4 4 0 0 1-4-4V6a4 4 0 0 1 4-4h1"/><path d="M7 22h1a4 4 0 0 0 4-4v-1"/><path d="M7 2h1a4 4 0 0 1 4 4v1"/><!--Lucide - https://lucide.dev License - https://lucide.dev/license Copyright (c) for portions of Lucide are held by Cole Bemis 2013-2022 as part of Feather (MIT). All other copyright (c) for Lucide are held by Lucide Contributors 2022.--></svg></div>
            </button>

            <button 
                title="Pan" 
                class={selectedTool === 'hand' ? 'HighlightButton active':'HighlightButton'}
                onclick={() => {
                    selectedTool === 'hand' ? selectedTool = 'text_selection' : selectedTool = 'hand';
                }}
            >
                <div class="icon"><svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><path d="M18 11V6a2 2 0 0 0-2-2a2 2 0 0 0-2 2"/><path d="M14 10V4a2 2 0 0 0-2-2a2 2 0 0 0-2 2v2"/><path d="M10 10.5V6a2 2 0 0 0-2-2a2 2 0 0 0-2 2v8"/><path d="M18 8a2 2 0 1 1 4 0v6a8 8 0 0 1-8 8h-2c-2.8 0-4.5-.86-5.99-2.34l-3.6-3.6a2 2 0 0 1 2.83-2.82L7 15"/><!--Lucide - https://lucide.dev License - https://lucide.dev/license Copyright (c) for portions of Lucide are held by Cole Bemis 2013-2022 as part of Feather (MIT). All other copyright (c) for Lucide are held by Lucide Contributors 2022.--></svg></div>
            </button>

            <button 
                title="Highlight text" 
                class={selectedTool === 'highlight_pen' ? 'HighlightButton active':'HighlightButton'}
                onclick={() => {
                    selectedTool === 'highlight_pen' ? selectedTool = 'text_selection' : selectedTool = 'highlight_pen';
                    //console.log(highlightPen)
                }}
            >
                <div class="icon"><svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><path d="m9 11-6 6v3h9l3-3"/><path d="m22 12-4.6 4.6a2 2 0 0 1-2.8 0l-5.2-5.2a2 2 0 0 1 0-2.8L14 4"/><!--Lucide - https://lucide.dev License - https://lucide.dev/license Copyright (c) for portions of Lucide are held by Cole Bemis 2013-2022 as part of Feather (MIT). All other copyright (c) for Lucide are held by Lucide Contributors 2022.--></svg></div>
            </button>
            <button 
                title="Highlight area"
                class={selectedTool === 'area_selection' ? 'HighlightButton active':'HighlightButton'}
                onclick={() => {
                    selectedTool === 'area_selection' ? selectedTool = 'text_selection' : selectedTool = 'area_selection';
                    //console.log(highlightPen)
                }}
            >
                <div class="icon"><svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><path d="M12.034 12.681a.498.498 0 0 1 .647-.647l9 3.5a.5.5 0 0 1-.033.943l-3.444 1.068a1 1 0 0 0-.66.66l-1.067 3.443a.5.5 0 0 1-.943.033z"/><path d="M21 11V5a2 2 0 0 0-2-2H5a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h6"/><!--Lucide - https://lucide.dev License - https://lucide.dev/license Copyright (c) for portions of Lucide are held by Cole Bemis 2013-2022 as part of Feather (MIT). All other copyright (c) for Lucide are held by Lucide Contributors 2022.--></svg></div>
            </button>      
        </div>
      
        <div style="display: flex; align-items: center;">
            
            <div style ="display: inline-flex; position: relative; align-items: center;">
                <input class="searchInput" placeholder="Search..." bind:value={searchOptions.query} onkeyup={debounce(search, 200)} />
            {#if (searchOptions.query.length > 0)}
            <button class="searchClear HighlightButton" onclick={ () => search({query: ''}) }><div class="icon"><svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><path d="M18 6 6 18"/><path d="m6 6 12 12"/><!--Lucide - https://lucide.dev License - https://lucide.dev/license Copyright (c) for portions of Lucide are held by Cole Bemis 2013-2022 as part of Feather (MIT). All other copyright (c) for Lucide are held by Lucide Contributors 2022.--></svg></div></button>
            {/if}
            </div>


            <button style="margin-right: 0px;" class="HighlightButton" onclick={ () => search({findPrevious: true}) }><div class="icon"><svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><path d="m15 18-6-6 6-6"/><!--Lucide - https://lucide.dev License - https://lucide.dev/license Copyright (c) for portions of Lucide are held by Cole Bemis 2013-2022 as part of Feather (MIT). All other copyright (c) for Lucide are held by Lucide Contributors 2022.--></svg></div></button>
            <button class="HighlightButton" onclick={ () => search({findPrevious: false}) }><div class="icon"><svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><path d="m9 18 6-6-6-6"/><!--Lucide - https://lucide.dev License - https://lucide.dev/license Copyright (c) for portions of Lucide are held by Cole Bemis 2013-2022 as part of Feather (MIT). All other copyright (c) for Lucide are held by Lucide Contributors 2022.--></svg></div></button>

            <div class="buttonSeparator"></div>
            <button class="HighlightButton"><div class="icon"><svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 12h16"/><path d="M4 18h16"/><path d="M4 6h16"/><!--Lucide - https://lucide.dev License - https://lucide.dev/license Copyright (c) for portions of Lucide are held by Cole Bemis 2013-2022 as part of Feather (MIT). All other copyright (c) for Lucide are held by Lucide Contributors 2022.--></svg>

            <!--<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 12h16"/><path d="M4 18h16"/><path d="M4 6h16"/></svg>

            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="1"/><circle cx="19" cy="12" r="1"/><circle cx="5" cy="12" r="1"/></svg>-->
            </div></button>

        </div>
</div>