<script lang="ts" module>
    export interface SidebarProps {
        highlights: Array<Highlight>;
        resetHighlights: () => void;
        toggleDocument: () => void;
        editHighlight: (id: string, highlight: Highlight) => void;
        deleteHighlight: (highlight: Highlight) => void;
        sidebarScrollToId: any;
        pdfHighlighterUtils: any;
        colors: Array<string>;
    }
</script>

<script lang="ts">
    import type { Highlight } from '$lib/types.ts';
    //import { Highlight } from "$lib/types.ts";
    const APP_VERSION: string = '0.1.0';
    const updateHash = (highlight: Highlight) => {
        //document.location.hash = `highlight-${highlight.id}`;
    };

    let {
        highlights = $bindable(),
        toggleDocument,
        resetHighlights,
        editHighlight,
        deleteHighlight,
        sidebarScrollToId,
        pdfHighlighterUtils,
        colors,
    }: SidebarProps = $props();

    sidebarScrollToId((id) => {
        let element = document.getElementById(id);
        if (element) {
            element.scrollIntoView();
            console.log('scroll');
        }
    });

    $effect(() => {});
    let selected_id_to_del = $state('');
</script>

<style>
    .sidebar {
        overflow: auto;
        color: #333333;
        background: #fff;
        box-shadow: 0 2px 5px rgba(0, 0, 0, 0.1);
    }

    .highlight__image__container::-webkit-scrollbar,
    .sidebar::-webkit-scrollbar {
        width: 10px;
        height: 10px;
    }

    .highlight__image__container::-webkit-scrollbar-thumb,
    .sidebar::-webkit-scrollbar-thumb {
        background-color: #ccc;
        border-radius: 5px;
    }

    .highlight__image__container::-webkit-scrollbar-thumb:hover,
    .sidebar::-webkit-scrollbar-thumb:hover {
        background-color: #aaa;
    }

    .highlight__image__container::-webkit-scrollbar-track,
    .sidebar::-webkit-scrollbar-track {
        background-color: #f4f4f4;
        border-radius: 5px;
    }

    .highlight__image__container::-webkit-scrollbar-track-piece,
    .sidebar::-webkit-scrollbar-track-piece {
        background-color: none;
        border-radius: 5px;
    }

    .sidebar__highlights {
        list-style: none;
        padding: 0;
    }

    .highlight__location {
        padding: 0 0.5rem 0.5rem 0;
        text-align: right;
        font-size: 0.8rem;
        color: #777;
    }

    .highlight__image__container {
        overflow: auto;
        max-width: 100%;
        text-align: center;
        background-color: #fff;
        border-bottom: 1px solid #ddd;
    }

    .highlight__image {
        border: none;
        width: 95%;
        float: none;
        cursor: pointer;
    }

    .sidebar__highlight {
        padding: 1rem;
        transition: background 140ms ease-in;
        border-bottom: 1px solid #e1e1e1;
    }

    .sidebar__highlights textarea {
        border: none;
        width: 95%;
        resize: none;
        height: 90%;
    }

    .sidebar__highlight:hover {
        background: #f8f9fa;
    }

    .sidebar__highlight-wrapper {
        border: 1px solid #ddd;
        border-radius: 5px;
        background-color: #f8f9fa;
    }

    a {
        color: #007bff;
    }

    blockquote {
        padding: 0;
        margin: 0;
        quotes: '\201c' '\201d';
        font-size: small;
        cursor: pointer;
    }

    blockquote:before {
        content: open-quote;
    }

    blockquote:after {
        content: close-quote;
    }

    /* Add these styles for the buttons */
    .sidebar__toggle,
    .sidebar__reset {
        display: inline-block;
        padding: 0.5rem 1rem;
        font-size: 1rem;
        font-weight: 500;
        line-height: 1.75;
        text-align: center;
        text-decoration: none;
        white-space: nowrap;
        border: 1px solid #2196f3;
        background-color: #2196f3;
        color: #fff;
        border-radius: 4px;
        cursor: pointer;
        transition: background-color 0.3s;
    }

    .sidebar__reset {
        border: 1px solid #f44336;
        background-color: #f44336;
    }

    .sidebar__toggle:hover {
        background-color: #1565c0;
        border-color: #1565c0;
    }

    .sidebar__reset:hover {
        background-color: #d32f2f;
        border-color: #d32f2f;
    }

    .sidebar__color_select select {
        appearance: none;
        border: 1px solid #555;
        border-radius: 10px;
        width: 18px;
        height: 18px;
        margin: 2px;
        background: transparent !important;
        z-index: 5;
        content-visibility: hidden;
        outline: none;
        cursor: pointer;
    }
    .sidebar__color_select select option {
        content-visibility: hidden;
    }

    .sidebar__color_select {
        display: grid;
        grid-template-areas: 'select';
        grid-area: select;
        align-items: center;
        width: 25px;
        float: right;
    }

    .sidebar__color_select select * {
        border-radius: 15px;
        background-color: red;
        content-visibility: hidden;
        content: ' ';
    }

    .sidebar__color_select select:hover {
        border-color: black;
    }

    .sidebar__delete {
        width: 15px;
        height: 15px;
        background: url('data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 448 512"><!--!Font Awesome Free 6.7.2 by @fontawesome - https://fontawesome.com License - https://fontawesome.com/license/free Copyright 2025 Fonticons, Inc.--><path d="M135.2 17.7L128 32 32 32C14.3 32 0 46.3 0 64S14.3 96 32 96l384 0c17.7 0 32-14.3 32-32s-14.3-32-32-32l-96 0-7.2-14.3C307.4 6.8 296.3 0 284.2 0L163.8 0c-12.1 0-23.2 6.8-28.6 17.7zM416 128L32 128 53.2 467c1.6 25.3 22.6 45 47.9 45l245.8 0c25.3 0 46.3-19.7 47.9-45L416 128z" fill="%23919191"/></svg>');
        background-size: cover;
        border: none;
        cursor: pointer;
        float: right;
        margin: 3px;
    }
    .sidebar__delete:hover {
        background: url('data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 448 512"><!--!Font Awesome Free 6.7.2 by @fontawesome - https://fontawesome.com License - https://fontawesome.com/license/free Copyright 2025 Fonticons, Inc.--><path d="M135.2 17.7L128 32 32 32C14.3 32 0 46.3 0 64S14.3 96 32 96l384 0c17.7 0 32-14.3 32-32s-14.3-32-32-32l-96 0-7.2-14.3C307.4 6.8 296.3 0 284.2 0L163.8 0c-12.1 0-23.2 6.8-28.6 17.7zM416 128L32 128 53.2 467c1.6 25.3 22.6 45 47.9 45l245.8 0c25.3 0 46.3-19.7 47.9-45L416 128z" fill="%23555"/></svg>');
        background-size: cover;
    }

    .sidebar__delete-confirm,
    .sidebar__delete-cancel {
        border: none;
        cursor: pointer;
        background: none;
        color: #555;
    }
    .sidebar__delete-confirm:hover,
    .sidebar__delete-cancel:hover {
        color: #000;
    }
</style>

<div class="sidebar" style="width: 25vw; maxWidth: 500px">
    <div class="description" style="padding: 1rem">
        <h2 style="marginBottom: 1rem">
            svelte-pdf-highlighter {APP_VERSION}
        </h2>
        <p style="fontSize: 0.7rem">
            <a href="https://github.com/blackcat42/svelte-pdf-highlighter">
                Open in GitHub
            </a>
        </p>

        <p>
            <small>
                To create an area highlight hold ⌥ Option key (Alt), then click and drag.
            </small>
        </p>
    </div>

    {#if highlights}
        <ul class="sidebar__highlights">
            {#each highlights as highlight (highlight.id)}
                <!-- svelte-ignore a11y_no_noninteractive_element_interactions -->
                <!-- svelte-ignore a11y_click_events_have_key_events -->
                <li id={highlight.id} class="sidebar__highlight" >
                    <div style = "background: {highlight.color ? highlight.color : '#fcf151'};" class="sidebar__highlight-wrapper">
                        <div style = "background: transparent; width: 100%; height: 22px;">
                            {#if (selected_id_to_del == highlight.id)}
                                <div style="float:right;">
                                    <span style="font-size: small;">delete this highlight?</span>
                                    <!-- svelte-ignore a11y_consider_explicit_label -->
                                    <button class="sidebar__delete-confirm" onclick="{()=>{deleteHighlight(highlight); selected_id_to_del = ''}}">&#x2713;</button>
                                    <button class="sidebar__delete-cancel" onclick="{()=>{selected_id_to_del = ''}}">&#x2715;</button>
                                </div>
                            {:else}
                                <!-- svelte-ignore a11y_consider_explicit_label -->
                                <button class="sidebar__delete" onclick="{()=>selected_id_to_del = highlight.id}"></button>
                            {/if}
                            <div class="sidebar__color_select">
                                <select
                                    value={highlight.color}
                                    onchange={(e)=>editHighlight(highlight.id, {color: e.target.value})}
                                    style="background: {highlight.color}"
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
                        <div style = "background: #fff; border-top: 1px solid #f8f9fa; height: {(highlight?.comment?.length > 3) ? '80px' : '50px'};"><textarea value = {highlight.comment} placeholder="empty comment" onchange={(e)=>editHighlight(highlight.id, {comment: e.target.value})}></textarea></div>
                        <div style = "background: #f8f9fa; border-top: 1px solid #ddd;">
                            {#if highlight.content.text}
                                <blockquote style="margin: 0.3rem" onclick={()=>{pdfHighlighterUtils.utils.scrollToHighlight(highlight)}}>
                                        {highlight.content.text.slice(0, 90).trim()}…
                                </blockquote>
                            {/if}

                            {#if highlight.content.image}
                                <!-- svelte-ignore a11y_no_static_element_interactions -->
                                <div
                                    class="highlight__image__container"
                                    style="marginTop: 0.5rem"
                                    onclick={()=>{pdfHighlighterUtils.utils.scrollToHighlight(highlight)}}
                                >
                                    <img
                                        src={highlight.content.image}
                                        alt="Screenshot"
                                        class="highlight__image" />
                                </div>
                            {/if}
                            <div class="highlight__location">
                                Page {highlight.position.boundingRect.pageNumber}
                            </div>
                        </div>
                    </div>   
                </li>
            {/each}
        </ul>
    {/if}

    <div style={{ padding: "0.5rem" }}>
        <button onclick={()=>{}} class="sidebar__toggle">
            Toggle PDF document
        </button>
    </div>

    {#if highlights && highlights.length > 0}
        <div style={{ padding: "0.5rem" }}>
            <button onclick={resetHighlights} class="sidebar__reset">
                Reset highlights
            </button>
        </div>
    {/if}
</div>