<script lang="ts">
    import { debounce } from '$lib/utils';
    import { derived } from 'svelte/store';
    import type {
        PdfHighlighterUtils as TPdfHighlighterUtils,
    } from '$lib/types.ts';
    interface ToolbarProps {
        searchInPdf: any;
        pdfHighlighterUtils: Partial<TPdfHighlighterUtils>;
        sidebarVisible: boolean;
        colors: Array<string>;
    }

    let {
        sidebarVisible = $bindable(),
        searchInPdf,
        pdfHighlighterUtils = $bindable(),
        colors,
    }: ToolbarProps = $props();

    const zoomIn = () => {
        if (pdfHighlighterUtils.currentScale > 0) {
            if (pdfHighlighterUtils.currentScale < 4) {
                pdfHighlighterUtils.setCurrentScaleValue(pdfHighlighterUtils.currentScale + 0.1);
                //zoom = zoom + 0.1;
            }
        } else {
            pdfHighlighterUtils.setCurrentScaleValue(1);
            //zoom = 1;
        }
    };

    const zoomOut = () => {
        if (pdfHighlighterUtils.currentScale > 0) {
            if (pdfHighlighterUtils.currentScale > 0.2) {
                pdfHighlighterUtils.setCurrentScaleValue(pdfHighlighterUtils.currentScale - 0.1);
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

    let prevQuery = "";


    //let rrr = $derived(pdfHighlighterUtils._searchState.matchesCount.total);
    let searchState = $state.raw({});
    let updateSearchState = debounce(() => {
        let _searchState = pdfHighlighterUtils.getSearchState();
        //searchState = {current: _searchState.matchesCount.current, total: _searchState.source['_matchesCountTotal']};
        searchState = _searchState.matchesCount;
    }, 100);
    const search = (opts) => {
        if (!opts && searchOptions.query === prevQuery) return;
        searchOptions = { ...searchOptions, ...opts };
        prevQuery = searchOptions.query;
        searchInPdf(searchOptions);
        updateSearchState(); //TODO: move to props, refactor
    };

    //${isHighlightPen ? 'active' : ''}` add to button class
    let currentColor = '#ffffff';

    //let selectedColor = $state(colors[0]);
    //const colors = ['red', 'green']
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
        width: 20%;
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
        margin-right: 2px;
        margin-left: 2px;
        /*        transition: color 0.3s, transform 0.2s;*/
    }
    .Toolbar_center .HighlightButton {
        margin-right: 4px;
        margin-left: 4px;
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

    .toolbar__color_select select {
        appearance: none;
        border: 1px solid #555;
        border-radius: 0.5rem;
        width: 1rem;
        height: 1rem;
        margin: 2px;
        background: transparent;
        z-index: 5;
        content-visibility: hidden;
        outline: none;
        cursor: pointer;
        opacity: 0.9;
    }
    .toolbar__color_select select option {
        content-visibility: hidden;
    }

    .toolbar__color_select {
        display: grid;
        grid-template-areas: 'select';
        grid-area: select;
        align-items: center;
        width: 1rem;
        float: right;
    }

    .toolbar__color_select select * {
        border-radius: 1rem;
        /*background-color: red;*/
        content-visibility: hidden;
        content: ' ';
    }

    .toolbar__color_select select:hover {
        border-color: black;
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
            <div style="min-width: 2.3rem; text-align: center;">
                {#if (pdfHighlighterUtils.currentScale > 0)}
                    {(pdfHighlighterUtils.currentScale * 100).toFixed(0)}%
                {:else}
                    {pdfHighlighterUtils.currentScale}
                {/if}
            </div>
            <button class="HighlightButton" title="Zoom in" onclick={zoomIn}><div class="icon"><svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12h14"/><path d="M12 5v14"/><!--Lucide - https://lucide.dev License - https://lucide.dev/license Copyright (c) for portions of Lucide are held by Cole Bemis 2013-2022 as part of Feather (MIT). All other copyright (c) for Lucide are held by Lucide Contributors 2022.--></svg></div></button>
            <div class="buttonSeparator"></div>

            <!-- {#if (pdfHighlighterUtils?.currentScaleValue === 'page-width')} -->
            <button style="margin-right: 0px;" class={pdfHighlighterUtils?.currentScaleValue === 'page-height' ? 'HighlightButton active':'HighlightButton'} onclick={()=>{zoomString('page-height')}}><div class="icon" style="height: 1.3rem; width: 1.3rem;"><svg xmlns="http://www.w3.org/2000/svg" width="20" height="25" viewBox="0 0 23 23" fill="none" stroke-width="1.1" stroke-linecap="round" stroke-linejoin="round" ><rect width="15" height="19" x="4" y="2" rx="1"/>     <path d="M11 7v10"/><path d="m8 15 3 3 3-3"/><path d="m8 9 3-3 3 3"/><!--Lucide - https://lucide.dev License - https://lucide.dev/license Copyright (c) for portions of Lucide are held by Cole Bemis 2013-2022 as part of Feather (MIT). All other copyright (c) for Lucide are held by Lucide Contributors 2022.--></svg></div></button>
            <!-- {:else} -->
            <button class={pdfHighlighterUtils?.currentScaleValue === 'page-width' ? 'HighlightButton active':'HighlightButton'} onclick={()=>{zoomString('page-width')}}><div class="icon" style="height: 1.3rem; width: 1.3rem;"><svg xmlns="http://www.w3.org/2000/svg" width="20" height="25" viewBox="0 0 23 23" fill="none" stroke-width="1.1" stroke-linecap="round" stroke-linejoin="round" ><rect width="15" height="19" x="4" y="2" rx="1"/>     <path d="m14 9 3 3-3 3"/><path d="M7 12h10"/><path d="m9 9-3 3 3 3"/><!--Lucide - https://lucide.dev License - https://lucide.dev/license Copyright (c) for portions of Lucide are held by Cole Bemis 2013-2022 as part of Feather (MIT). All other copyright (c) for Lucide are held by Lucide Contributors 2022.--></svg></div></button>
            <!-- {/if} -->

            <!--<button class="Toolbar__page-height" onclick={()=>{zoomString('page-height')}}></button>
            <button onclick={()=>{zoomString('page-actual')}}>page-actual</button>
            <button onclick={()=>{zoomString('page-fit')}}>page-fit</button>
            <button onclick={()=>{zoomString('auto')}}>auto</button>-->  
            <div class="buttonSeparator"></div>

            
            <button style="margin-right: 0px;" 
            class={pdfHighlighterUtils?.pageLayout?.spreadMode === 0 ? 'HighlightButton active':'HighlightButton'}
            onclick={()=>{pdfHighlighterUtils.setPageLayout({spreadMode: 0})}}><div class="icon" style="height: 1.3rem; width: 1.3rem;"><svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke-width="1.1" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-square-menu-icon lucide-square-menu"><rect width="15" height="18" x="5" y="3" rx="2"/><path d="M9 8h7"/><path d="M9 12h7"/><path d="M9 16h7"/><!--Lucide - https://lucide.dev License - https://lucide.dev/license Copyright (c) for portions of Lucide are held by Cole Bemis 2013-2022 as part of Feather (MIT). All other copyright (c) for Lucide are held by Lucide Contributors 2022.--></svg></div></button>
            <button style="width:2.1rem; margin-left: 0px;" class={pdfHighlighterUtils?.pageLayout?.spreadMode === 1 ? 'HighlightButton active':'HighlightButton'} onclick={()=>{pdfHighlighterUtils.setPageLayout({spreadMode: 1})}}><div class="icon" style="height: 1.3rem; width: 1.8rem;"><svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 32 24" fill="none" stroke-width="1.1" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-square-menu-icon lucide-square-menu"><rect width="12" height="18" x="3" y="3" rx="2"/><path d="M7 8h4"/><path d="M7 12h4"/><path d="M7 16h4"/><rect width="12" height="18" x="18" y="3" rx="2"/><path d="M22 8h4"/><path d="M22 12h4"/><path d="M22 16h4"/><!--Lucide - https://lucide.dev License - https://lucide.dev/license Copyright (c) for portions of Lucide are held by Cole Bemis 2013-2022 as part of Feather (MIT). All other copyright (c) for Lucide are held by Lucide Contributors 2022.--></svg></div></button>
            <div class="buttonSeparator"></div>

            <button class={pdfHighlighterUtils?.pageLayout?.scrollMode === 0 ? 'HighlightButton active':'HighlightButton'} onclick={()=>{pdfHighlighterUtils.setPageLayout({scrollMode: 0})}}><div class="icon" style="height: 1.3rem; width: 1.3rem;"><svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke-width="1.1" stroke-linecap="round" stroke-linejoin="round"><path d="M5 1h13"/><rect width="12" height="15" x="6" y="4" rx="2"/><path d="M5 22h14"/><!--Lucide - https://lucide.dev License - https://lucide.dev/license Copyright (c) for portions of Lucide are held by Cole Bemis 2013-2022 as part of Feather (MIT). All other copyright (c) for Lucide are held by Lucide Contributors 2022.--></svg></div></button>
            <button class={pdfHighlighterUtils?.pageLayout?.scrollMode === 1 ? 'HighlightButton active':'HighlightButton'} onclick={()=>{pdfHighlighterUtils.setPageLayout({scrollMode: 1})}}><div class="icon" style="height: 1.3rem; width: 1.3rem;"><svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke-width="1.1" stroke-linecap="round" stroke-linejoin="round"><path d="M2 4v16"/><rect width="12" height="15" x="6" y="4" rx="2"/><path d="M22 4v16"/><!--Lucide - https://lucide.dev License - https://lucide.dev/license Copyright (c) for portions of Lucide are held by Cole Bemis 2013-2022 as part of Feather (MIT). All other copyright (c) for Lucide are held by Lucide Contributors 2022.--></svg></div></button>
            <button class={pdfHighlighterUtils?.pageLayout?.scrollMode === 3 ? 'HighlightButton active':'HighlightButton'} onclick={()=>{pdfHighlighterUtils.setPageLayout({scrollMode: 3})}}><div class="icon" style="height: 1.3rem; width: 1.3rem;"><svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke-width="1.1" stroke-linecap="round" stroke-linejoin="round"><rect width="12" height="15" x="6" y="4" rx="2"/><path d="M7 23h1"/><path d="M12 23h1"/><path d="M17 23h1"/><!--Lucide - https://lucide.dev License - https://lucide.dev/license Copyright (c) for portions of Lucide are held by Cole Bemis 2013-2022 as part of Feather (MIT). All other copyright (c) for Lucide are held by Lucide Contributors 2022.--></svg></div></button>





        </div>

        <div class="Toolbar_center" style="display: flex; align-items: center;">
            <button 
                title="Text selection" 
                class={pdfHighlighterUtils.selectedTool === 'text_selection' ? 'HighlightButton active':'HighlightButton'}
                
                onclick={() => {
                    pdfHighlighterUtils.selectedTool = 'text_selection';
                }}
            >
                <div class="icon"><svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="{currentColor}" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><path d="M17 22h-1a4 4 0 0 1-4-4V6a4 4 0 0 1 4-4h1"/><path d="M7 22h1a4 4 0 0 0 4-4v-1"/><path d="M7 2h1a4 4 0 0 1 4 4v1"/><!--Lucide - https://lucide.dev License - https://lucide.dev/license Copyright (c) for portions of Lucide are held by Cole Bemis 2013-2022 as part of Feather (MIT). All other copyright (c) for Lucide are held by Lucide Contributors 2022.--></svg></div>
            </button>

            <button 
                title="Pan" 
                class={pdfHighlighterUtils.selectedTool === 'hand' ? 'HighlightButton active':'HighlightButton'}
                onclick={() => {
                    pdfHighlighterUtils.selectedTool === 'hand' ? pdfHighlighterUtils.selectedTool = 'text_selection' : pdfHighlighterUtils.selectedTool = 'hand';
                }}
            >
                <div class="icon"><svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><path d="M18 11V6a2 2 0 0 0-2-2a2 2 0 0 0-2 2"/><path d="M14 10V4a2 2 0 0 0-2-2a2 2 0 0 0-2 2v2"/><path d="M10 10.5V6a2 2 0 0 0-2-2a2 2 0 0 0-2 2v8"/><path d="M18 8a2 2 0 1 1 4 0v6a8 8 0 0 1-8 8h-2c-2.8 0-4.5-.86-5.99-2.34l-3.6-3.6a2 2 0 0 1 2.83-2.82L7 15"/><!--Lucide - https://lucide.dev License - https://lucide.dev/license Copyright (c) for portions of Lucide are held by Cole Bemis 2013-2022 as part of Feather (MIT). All other copyright (c) for Lucide are held by Lucide Contributors 2022.--></svg></div>
            </button>
            <div class="buttonSeparator"></div>
            <button 
                title="Highlight text" 
                class={pdfHighlighterUtils.selectedTool === 'highlight_pen' ? 'HighlightButton active':'HighlightButton'}
                onclick={() => {
                    pdfHighlighterUtils.selectedTool === 'highlight_pen' ? pdfHighlighterUtils.selectedTool = 'text_selection' : pdfHighlighterUtils.selectedTool = 'highlight_pen';
                    //console.log(highlightPen)
                }}
            >
                <div class="icon"><svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><path fill="{'none' /*selectedColor*/}" d="m9 11-6 6v3h9l3-3"/><path d="m22 12-4.6 4.6a2 2 0 0 1-2.8 0l-5.2-5.2a2 2 0 0 1 0-2.8L14 4"/><!--Lucide - https://lucide.dev License - https://lucide.dev/license Copyright (c) for portions of Lucide are held by Cole Bemis 2013-2022 as part of Feather (MIT). All other copyright (c) for Lucide are held by Lucide Contributors 2022.--></svg></div>
            </button>
            <button 
                title="Highlight area"
                class={pdfHighlighterUtils.selectedTool === 'area_selection' ? 'HighlightButton active':'HighlightButton'}
                onclick={() => {
                    pdfHighlighterUtils.selectedTool === 'area_selection' ? pdfHighlighterUtils.selectedTool = 'text_selection' : pdfHighlighterUtils.selectedTool = 'area_selection';
                    //console.log(highlightPen)
                }}
            >
                <div class="icon"><svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><path d="M12.034 12.681a.498.498 0 0 1 .647-.647l9 3.5a.5.5 0 0 1-.033.943l-3.444 1.068a1 1 0 0 0-.66.66l-1.067 3.443a.5.5 0 0 1-.943.033z"/><path d="M21 11V5a2 2 0 0 0-2-2H5a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h6"/><!--Lucide - https://lucide.dev License - https://lucide.dev/license Copyright (c) for portions of Lucide are held by Cole Bemis 2013-2022 as part of Feather (MIT). All other copyright (c) for Lucide are held by Lucide Contributors 2022.--></svg></div>
            </button>

            <div class="toolbar__color_select">
                                <select
                                    value={pdfHighlighterUtils.selectedColor}
                                    onchange={(e) => pdfHighlighterUtils.selectedColor = (e.target as HTMLInputElement).value}
                                    style="background: {pdfHighlighterUtils.selectedColor}"
                                >
                                    {#each colors as color}
                                        <option 
                                            value={color}
                                            style ="background: {color}; height: 10px; width: 20px;"
                                        >
                                            &nbsp;
                                        </option>
                                    {/each}
                                </select>
            </div>
            
        </div>

        <div style="display: flex; align-items: center; min-width: 20%;">
            
            <div style ="display: inline-flex; position: relative; align-items: center;">
                <input class="searchInput" placeholder="Search..." bind:value={searchOptions.query} onkeyup={debounce(()=>{search(false)}, 200)} />
            {#if (searchOptions.query.length > 0)}
            <button class="searchClear HighlightButton" onclick={ () => search({query: ''}) }><div class="icon"><svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><path d="M18 6 6 18"/><path d="m6 6 12 12"/><!--Lucide - https://lucide.dev License - https://lucide.dev/license Copyright (c) for portions of Lucide are held by Cole Bemis 2013-2022 as part of Feather (MIT). All other copyright (c) for Lucide are held by Lucide Contributors 2022.--></svg></div></button>
            {:else}
            <div style="margin-right: 9px; color: #DEE2E6" class="searchClear icon"><svg style="stroke: #6C757D" xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke-width="1" stroke-linecap="round" stroke-linejoin="round"><path d="m21 21-4.34-4.34"/><circle cx="11" cy="11" r="7"/></svg></div>
            {/if}
            </div>

            {#if (searchOptions.query.length > 0)}
            <button style="margin-right: 0px;" class="HighlightButton" onclick={ () => search({findPrevious: true}) }><div class="icon"><svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><path d="m15 18-6-6 6-6"/><!--Lucide - https://lucide.dev License - https://lucide.dev/license Copyright (c) for portions of Lucide are held by Cole Bemis 2013-2022 as part of Feather (MIT). All other copyright (c) for Lucide are held by Lucide Contributors 2022.--></svg></div></button>
            
            {pdfHighlighterUtils?.searchState?.matchesCount.current}/{pdfHighlighterUtils?.searchState?.matchesCount.total}
            
            <button class="HighlightButton" onclick={ () => search({findPrevious: false}) }><div class="icon"><svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><path d="m9 18 6-6-6-6"/><!--Lucide - https://lucide.dev License - https://lucide.dev/license Copyright (c) for portions of Lucide are held by Cole Bemis 2013-2022 as part of Feather (MIT). All other copyright (c) for Lucide are held by Lucide Contributors 2022.--></svg></div></button>

            <!-- {#if (searchState.total > 0)}
                {searchState.current}/{searchState.total}
            {/if} -->
            {/if}
            
            <div style="margin-left: 10px;" class="buttonSeparator"></div>
            
            
            <button style="margin-right: 0px;" class="HighlightButton"><div class="icon">
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"/><path d="M6 9V3a1 1 0 0 1 1-1h10a1 1 0 0 1 1 1v6"/><rect x="6" y="14" width="12" height="8" rx="1"/><!--Lucide - https://lucide.dev License - https://lucide.dev/license Copyright (c) for portions of Lucide are held by Cole Bemis 2013-2022 as part of Feather (MIT). All other copyright (c) for Lucide are held by Lucide Contributors 2022.--></svg>
            </div></button>

            <button style="margin-right: 0px;" class="HighlightButton"><div class="icon">
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 15V3"/><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><path d="m7 10 5 5 5-5"/><!--Lucide - https://lucide.dev License - https://lucide.dev/license Copyright (c) for portions of Lucide are held by Cole Bemis 2013-2022 as part of Feather (MIT). All other copyright (c) for Lucide are held by Lucide Contributors 2022.--></svg>
            </div></button>
            <div class="buttonSeparator"></div>
            <button class="HighlightButton"><div class="icon"><svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 12h16"/><path d="M4 18h16"/><path d="M4 6h16"/><!--Lucide - https://lucide.dev License - https://lucide.dev/license Copyright (c) for portions of Lucide are held by Cole Bemis 2013-2022 as part of Feather (MIT). All other copyright (c) for Lucide are held by Lucide Contributors 2022.--></svg>

            <!--<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 12h16"/><path d="M4 18h16"/><path d="M4 6h16"/></svg>

            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="1"/><circle cx="19" cy="12" r="1"/><circle cx="5" cy="12" r="1"/></svg>-->
            </div></button>
            

        </div>
</div>