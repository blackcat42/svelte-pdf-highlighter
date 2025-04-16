<script lang="ts" module>
    /**
     * The props type for {@link HighlightLayer}.
     *
     * @category Component Properties
     * @internal
     */
    import type { PdfScaleValue } from '$lib/types';
    import type { HighlightsModel } from '$lib/HighlightsModel.svelte.ts';
    import type { Snippet } from 'svelte';
    import type { PDFDocumentProxy } from 'pdfjs-dist/types/src/display/api';

    export interface pdfHighlighterProps {
        highlightsStore: HighlightsModel;
        selectedTool: string;
        pdfDocument: PDFDocumentProxy;
        children: Snippet;
        highlightPopup?: Snippet;
        editHighlightPopup?: Snippet;
        newHighlightPopup?: Snippet;
        style: string;
        onContextMenu: (e: MouseEvent) => void;
        //onTipUpdate(callback: (...args: any[]) => void): void;
        onSearch(callback: (options: SearchOptions) => void): void;
        //setPdfHighlighterUtils(...args: any[]): void;
        pdfHighlighterUtils: any;
    }
</script>

<script lang="ts">
    import 'pdfjs-dist/web/pdf_viewer.css';
    import '$lib/style/pdf_viewer.css';

    import type {
        Highlight,
        HighlightBindings,
        //PdfSelection,
        Tip,
        SearchOptions,
        ViewportPosition,
        Content,
    } from '$lib/types';

    import {
        asElement,
        findOrCreateContainerLayer,
        getPagesFromRange,
        getWindow,
        isHTMLElement,
    } from '$lib/pdf_utils/pdfjs-dom';
    import { on } from 'svelte/events';
    import { mount, unmount, setContext, getContext, onMount, getAllContexts } from 'svelte';
    import HighlightLayer from '$lib/components/HighlightLayer.svelte';
    import MouseSelection from '$lib/components/MouseSelection.svelte';
    import TipContainer from '$lib/components/TipContainer.svelte';
    import getClientRects from '$lib/pdf_utils/get-client-rects';
    import getBoundingRect from '$lib/pdf_utils/get-bounding-rect';
    import { scaledToViewport, viewportPositionToScaled } from '$lib/pdf_utils/coordinates';
    import type {
        EventBus as TEventBus,
        PDFLinkService as TPDFLinkService,
        PDFViewer as TPDFViewer,
        PDFFindController as TPDFFindController,
    } from 'pdfjs-dist/web/pdf_viewer.mjs';

    type PointerEventHandler = (event?: PointerEvent & { currentTarget: EventTarget & HTMLElement }) => void;
    let pdfViewerReady = false;
    let EventBus: typeof TEventBus,
        PDFFindController: typeof TPDFFindController,
        PDFLinkService: typeof TPDFLinkService,
        PDFViewer: typeof TPDFViewer;
    (async () => {
        // Due to breaking changes in PDF.js 4.0.189. See issue #17228
        const pdfjs = await import('pdfjs-dist/web/pdf_viewer.mjs');
        EventBus = pdfjs.EventBus;
        PDFLinkService = pdfjs.PDFLinkService;
        PDFViewer = pdfjs.PDFViewer;
        PDFFindController = pdfjs.PDFFindController;
        pdfViewerReady = true;
    })();

    const SCROLL_MARGIN = 10;
    const DEFAULT_SCALE_VALUE = 'auto';
    const DEFAULT_TEXT_SELECTION_COLOR: string = 'rgba(153,193,218,255)';

    const findOrCreateHighlightLayer = (textLayer: HTMLElement) => {
        return findOrCreateContainerLayer(textLayer, 'PdfHighlighter__highlight-layer');
    };
    const disableTextSelection = (viewer: InstanceType<typeof PDFViewer>, flag: boolean) => {
        viewer.viewer?.classList.toggle('PdfHighlighter--disable-selection', flag);
    };

    let doc;

    let {
        highlightsStore = $bindable(),
        selectedTool = $bindable('text_selection'),
        pdfDocument,
        children,
        highlightPopup,
        editHighlightPopup,
        newHighlightPopup,
        //textSelectionColor = DEFAULT_TEXT_SELECTION_COLOR,
        style,
        onContextMenu,
        onSearch,
        //setPdfHighlighterUtils,
        pdfHighlighterUtils = $bindable(),
    }: pdfHighlighterProps = $props();

    let enableAreaSelection: (e: MouseEvent) => boolean = (event) =>
        event.altKey || selectedTool === 'area_selection';

    //let addGhostHighlight = highlightsStore.addGhostHighlight;
    //let removeGhostHighlights = highlightsStore.removeGhostHighlights;

    
    

    // State
    let tip: Tip | null = $state(null);
    //const setTip = (val) => tip = val;
    const setHLColor = (id, color) => {
        highlightsStore.editHighlight(id, { color: color });
    };

    let isViewerReady = $state(false);

    // Refs
    let containerNodeRef: HTMLDivElement | null = null;
    let highlightBindingsRef: { [page: number]: HighlightBindings } = {};
    //let selectionRef: PdfSelection | null = null;
    let selectionRef: any = null;
    let scrolledToHighlightIdRef: string | null = null;
    let isAreaSelectionInProgressRef = false;
    let isEditInProgressRef = false;

    let eventBusRef: InstanceType<typeof EventBus>;

    let linkServiceRef: InstanceType<typeof PDFLinkService>;
    let resizeObserverRef: ResizeObserver | null = null;
    let viewerRef: InstanceType<typeof PDFViewer> | null = null;
    let findController_instance: TPDFFindController;

    const defaultSearchOptions: SearchOptions = {
        type: 'again',
        query: '',
        caseSensitive: false,
        entireWord: false,
        highlightAll: true,
        //phraseSearch: true,
        findPrevious: false,
    };
    const search = (options: SearchOptions = defaultSearchOptions) => {
        let opts = { ...defaultSearchOptions, ...options };
        eventBusRef.dispatch('find', opts);
    };

    let removeKeyDownHandlers;
    let removeWheelHandler;
    // Initialise PDF Viewer
    onMount(() => {
        console.log('PdfHighliter mount');
        if (!containerNodeRef) return;
        onSearch(search);

        //TODO: debounce
        let doc_init = setInterval(() => {
            console.log('doc init - ' + pdfViewerReady);
            if (!pdfViewerReady) return;
            clearInterval(doc_init);

            eventBusRef = new EventBus();
            linkServiceRef = new PDFLinkService({
                eventBus: eventBusRef,
                externalLinkTarget: 2,
            });
            findController_instance = new PDFFindController({
                eventBus: eventBusRef,
                linkService: linkServiceRef,
            });

            const debouncedDocumentInit = (viewerRef =
                viewerRef ||
                new PDFViewer({
                    container: containerNodeRef!,
                    eventBus: eventBusRef,
                    textLayerMode: 1,
                    removePageBorders: true,
                    linkService: linkServiceRef,
                    findController: findController_instance,
                    annotationMode: 0,
                }));

            viewerRef.setDocument(pdfDocument as any);
            linkServiceRef.setDocument(pdfDocument);
            linkServiceRef.setViewer(viewerRef);
            isViewerReady = true;

            resizeObserverRef = new ResizeObserver(handleScaleValue);
            resizeObserverRef.observe(containerNodeRef);

            doc = containerNodeRef.ownerDocument;
            eventBusRef.on('textlayerrendered', renderHighlightLayers);
            eventBusRef.on('pagesinit', handleScaleValue);

            removeKeyDownHandlers = on(viewerRef!.container, 'keydown', (event: KeyboardEvent) => {
                if (event.code === 'Escape') {
                    clearTextSelection();
                    //setTip(null);
                }
                if (event.code === 'KeyF' && event.getModifierState('Control')) {
                    event.preventDefault;
                    let sel = getWindow(containerNodeRef).getSelection();
                    //console.log(sel.toString())
                    //if (!sel) sel = null;
                    //TODO:
                    let options: SearchOptions = {
                        type: 'again',
                        query: sel.toString(),
                        caseSensitive: false,
                        entireWord: false,
                        highlightAll: true,
                        //phraseSearch: true,
                        findPrevious: false,
                    };
                    search(options);
                }
            });

            removeWheelHandler = on(
                viewerRef!.container,
                'wheel',
                (event) => {
                    if (event.ctrlKey) {
                        event.preventDefault();
                        pdfHighlighterUtils.setCurrentScaleValue(
                            typeof pdfHighlighterUtils.currentScaleValue == 'number'
                                ? pdfHighlighterUtils.currentScaleValue - event.deltaY / 1000
                                : 1.0,
                        );
                        //handleScaleValue();
                    }
                },
                { passive: false },
            );

            eventBusRef.on('pagesloaded', () => {
                //console.log(viewerRef)
            });
        }, 100);

        return () => {
            //TODO
            //debouncedDocumentInit.cancel();
            eventBusRef.off('pagesinit', handleScaleValue);
            removeKeyDownHandlers();
            removeWheelHandler();
            resizeObserverRef?.disconnect();
            //console.log('PdfHighliter unmount')
        };
    });
    //, [document]

    $effect(() => {
        console.log('PdfHighlighter effect run');
        if (!isViewerReady) return;
        if (!containerNodeRef) return;
        pdfHighlighterUtils.currentScaleValue; //dependence
        handleScaleValue();
    });

    // Event listeners
    //const handleWheelScale =

    let isDragging_MouseDown = $state(false);
    let isSelectionInProgress = $state(false);
    const handleScroll = () => {
        scrolledToHighlightIdRef = null;
    };

    let tipContainerState: any = {};
    let updateSelectionTip;

    const handleMouseUp: PointerEventHandler = () => {
        if (isDragging_MouseDown) {
            viewerRef!.container.removeEventListener('mousemove', onDragScroll);
            //isGrabbing = false;
            isDragging_MouseDown = false;
        }
        if (isSelectionInProgress) {
            isSelectionInProgress = false;
        }
        const container = containerNodeRef;
        const selection = getWindow(container).getSelection();
        //console.log(selection)
        if (selection.type !== 'Range') return;

        if (!container || !selection || selection.isCollapsed || !viewerRef) return;

        const range = selection.rangeCount > 0 ? selection.getRangeAt(0) : null;

        // Check the selected text is in the document, not the tip
        if (!range || !container.contains(range.commonAncestorContainer)) return;

        const pages = getPagesFromRange(range);
        if (!pages || pages.length === 0) return;

        const rects = getClientRects(range, pages);
        if (rects.length === 0) return;

        const viewportPosition: ViewportPosition = {
            boundingRect: getBoundingRect(rects),
            rects,
        };

        const scaledPosition = viewportPositionToScaled(viewportPosition, viewerRef);

        const content: Content = {
            text: selection.toString().split('\n').join(' '), // Make all line breaks spaces
        };

        selectionRef = {
            content,
            type: 'text',
            position: scaledPosition,
        };

        if (selectedTool !== 'highlight_pen') {
            tipContainerState.show = true;
            tipContainerState.pinned = true;
            tipContainerState.position = viewportPosition;
            tipContainerState.highlight = selectionRef;
            tipContainerState.addHighlight = highlightsStore.addHighlight;
            tipContainerState.clearSelection = () => {
                //extTipContainerState.show = false;
                tipContainerState.highlight = null;
                clearTextSelection();
            };

            pdfHighlighterUtils.setTip(tipContainerState);
            //addGhostHighlight(selectionRef);
        } else {
            highlightsStore.addHighlight(selectionRef, '');
            clearTextSelection();
        }
    };

    let pos = { top: 0, left: 0, x: 0, y: 0 };
    const onDragScroll = (e) => {
        //console.log('pdfHighlighter event: onDragScroll')
        e.stopPropagation();
        //isDragging_MouseDown = true;

        const dx = e.clientX - pos.x;
        const dy = e.clientY - pos.y;
        viewerRef!.container.scrollTop = pos.top - dy;
        viewerRef!.container.scrollLeft = pos.left - dx;
    };

    //start drag scrolling
    const handleMouseDown: PointerEventHandler = (event) => {
        event.stopPropagation();
        clearTextSelection();
        if (!(event.target instanceof Element)) return;
        if (
            selectedTool === 'hand' ||
            (!event.target.closest('span') &&
                !event.target.closest('.resizers') &&
                selectedTool !== 'area_selection')
        ) {
            pos = {
                left: viewerRef!.container.scrollLeft,
                top: viewerRef!.container.scrollTop,
                // Get the current mouse position
                x: event.clientX,
                y: event.clientY,
            };
            isDragging_MouseDown = true;
            viewerRef!.container.addEventListener('mousemove', onDragScroll);
        }
        if (
            !isHTMLElement(event.target) ||
            asElement(event.target).closest('.my_tip_container') // Ignore selections on tip container
        ) {
            return;
        } else if (!isDragging_MouseDown) {
            isSelectionInProgress = true;
        }
    };

    const handleScaleValue = () => {
        if (viewerRef && isViewerReady && typeof pdfHighlighterUtils.currentScaleValue !== 'undefined') {
            viewerRef.currentScaleValue = pdfHighlighterUtils.currentScaleValue.toString();
            pdfHighlighterUtils.currentScale = viewerRef.currentScale;
        }
    };

    // Render Highlight layers
    let layers = {};
    let contexts = getAllContexts();

    const renderHighlightLayer = (highlightBindings: HighlightBindings, pageNumber: number) => {
        if (!viewerRef) return;
        //TODO component PdfHighlighterContext
        if (layers.hasOwnProperty(pageNumber)) {
            unmount(layers[pageNumber]); //TODO: is really need?
        }
        layers[pageNumber] = mount(HighlightLayer, {
            target: highlightBindingsRef[pageNumber].reactRoot,
            props: {
                //highlightsByPage: highlightsStore.highlightsByPage[pageNumber],
                pageNumber: pageNumber,
                scrolledToHighlightId: scrolledToHighlightIdRef,
                viewer: viewerRef,
                highlightBindings: highlightBindings,
                children: children,
                highlightsStore: highlightsStore,
                pdfHighlighterUtils: pdfHighlighterUtils,
            },
            context: contexts,
        });
    };

    const renderHighlightLayers = () => {
        if (!viewerRef) return;
        for (let pageNumber = 1; pageNumber <= pdfDocument.numPages; pageNumber++) {
            const highlightBindings = highlightBindingsRef[pageNumber];

            // render HL iff pdf.js already unload container page, or hasn't created yet
            if (!highlightBindings?.container?.isConnected) {
                //if (true) {
                const { textLayer } = viewerRef!.getPageView(pageNumber - 1) || {};
                if (!textLayer) continue; // Viewer hasn't rendered page yet

                // textLayer.div for version >=3.0 and textLayer.textLayerDiv otherwise.
                const highlightLayer = findOrCreateHighlightLayer(textLayer.div);
                if (highlightLayer) {
                    const reactRoot = highlightLayer;
                    highlightBindingsRef[pageNumber] = {
                        reactRoot,
                        container: highlightLayer,
                        textLayer: textLayer.div, // textLayer.div for version >=3.0 and textLayer.textLayerDiv otherwise.
                    };
                    //console.log('render HL on page '+pageNumber)
                    renderHighlightLayer(highlightBindingsRef[pageNumber], pageNumber);
                }
            }
        }
    };

    // Utils
    const isEditingOrHighlighting = () => {
        return (
            Boolean(selectionRef) ||
            //Boolean(ghostHighlightRef) ||
            isAreaSelectionInProgressRef ||
            isEditInProgressRef
        );
    };

    const toggleEditInProgress = (flag?: boolean) => {
        if (flag !== undefined) {
            isEditInProgressRef = flag;
        } else {
            isEditInProgressRef = !isEditInProgressRef;
        }

        // Disable text selection
        if (viewerRef) {
            viewerRef.viewer?.classList.toggle(
                'PdfHighlighter--disable-selection',
                isEditInProgressRef,
            );
        }
    };

    const clearTextSelection = () => {
        selectionRef = null;
        const container = containerNodeRef;
        const selection = getWindow(container).getSelection();
        if (!container || !selection) return;
        selection.removeAllRanges();
        //removeGhostHighlights();
    };

    const scrollToHighlight = (highlight: Highlight) => {
        const { boundingRect, usePdfCoordinates } = highlight.position;
        const pageNumber = boundingRect.pageNumber;

        // Remove scroll listener in case user auto-scrolls in succession.
        viewerRef!.container.removeEventListener('scroll', handleScroll);

        const pageViewport = viewerRef!.getPageView(pageNumber - 1).viewport;

        viewerRef.scrollPageIntoView({
            pageNumber,
            destArray: [
                null, // null since we pass pageNumber already as an arg
                { name: 'XYZ' },
                ...pageViewport.convertToPdfPoint(
                    0, // Default x coord
                    scaledToViewport(boundingRect, pageViewport, usePdfCoordinates).top -
                        SCROLL_MARGIN,
                ),
                0, // Default z coord
            ],
        });

        scrolledToHighlightIdRef = highlight.id;
        //RrenderHighlightLayers();

        // wait for scrolling to finish
        setTimeout(() => {
            viewerRef!.container.addEventListener('scroll', handleScroll, {
                once: true,
            });
        }, 100);
    };

    pdfHighlighterUtils = {
            isEditingOrHighlighting,
            getCurrentSelection: () => selectionRef,
            toggleEditInProgress,
            isEditInProgress: () => isEditInProgressRef,
            isSelectionInProgress: () => {
                return Boolean(selectionRef) || isAreaSelectionInProgressRef;
            },
            scrollToHighlight,
            getViewer: () => viewerRef,
            getTip: () => tip,
            currentScale: 1,
            currentScaleValue: 1,
            setCurrentScaleValue: (value: PdfScaleValue) => {
                if (typeof value === 'string') {
                    pdfHighlighterUtils.currentScaleValue = value;
                } else if (value > 3 || value <= 0) {
                    //pdfHighlighterUtils.pdfScaleValue.val = 1;
                } else {
                    pdfHighlighterUtils.currentScaleValue = parseFloat(value.toFixed(1));
                }
                pdfHighlighterUtils.setTip(null);
            },
        };

    let enableTextSelection = $state(true);
    const setPdfTextSelection = (value) => {
        enableTextSelection = value;
    };

    const gotoSidebarRef = (id) => {
        alert(id);
    };

    const colors = getContext('colors') || ['#fcf151', '#ff659f', '#83f18d', '#67dfff', '#b581fe'];

    let derived_style = $derived.by(() => {
        if (selectedTool == 'hand') {
            return 'cursor: grab;' + style;
        } else if (selectedTool == 'pen') {
            return 'cursor: grab !important;' + style;
        } else {
            return style;
        }
    });
    let derived_classes = $derived.by(() => {
        if (selectedTool === 'hand' || isDragging_MouseDown) {
            return 'isDragging pdfViewer removePageBorders';
        } else if (selectedTool === 'highlight_pen') {
            return 'isPen pdfViewer removePageBorders';
        } else if (selectedTool === 'area_selection') {
            return 'isArea pdfViewer removePageBorders';
        } else if (isSelectionInProgress) {
            return 'isSelectionInProgress pdfViewer removePageBorders';
        } else {
            return 'pdfViewer removePageBorders';
        }
    });
</script>

<style>
    .disableTextSelection {
        user-select: none;
    }
    .PdfHighlighter {
        position: absolute;
        overflow: auto;
        width: 100%;
        height: 100%;
        background-color: #333;
    }

    /* Style the scrollbar */
    .PdfHighlighter::-webkit-scrollbar {
        width: 10px;
        height: 10px;
    }

    /*:global(.textLayer ::selection) {
        background: yellowgreen;
    }*/

    .PdfHighlighter::-webkit-scrollbar-thumb {
        background-color: #9f9f9f;
        border-radius: 5px;
    }

    .PdfHighlighter::-webkit-scrollbar-thumb:hover {
        background-color: #d1d1d1;
    }

    .PdfHighlighter::-webkit-scrollbar-track {
        background-color: #2c2c2c;
        border-radius: 5px;
    }

    .PdfHighlighter::-webkit-scrollbar-track-piece {
        background-color: #2c2c2c;
    }

    .PdfHighlighter__tip-container {
        z-index: 6;
        position: absolute;
    }

    :global(.PdfHighlighter--disable-selection) {
        user-select: none;
        /*pointer-events: none;*/
    }

    .isDraggingContainer {
        cursor: grabbing !important;
    }

    .isDragging,
    .isDragging * {
        user-select: none;
    }

    :global(.isDragging .textLayer) {
        pointer-events: none;
    }

    :global(.isPen .textLayer span) {
        /*cursor: var(--editorHighlight-editing-cursor);*/
        cursor:
            url("data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' fill='none' width='16' height='16'> <g>  <title>Layer 1</title>  <path stroke='null' id='svg_1' fill='white' d='m2.01722,14.54379l0.53955,-3.04096c0.06813,-0.38855 0.24707,-0.74385 0.51594,-1.02695l7.99428,-8.36192c0.70306,-0.73435 1.84666,-0.73625 2.55244,0l1.47877,1.5466c0.70305,0.73625 0.70305,1.93325 0,2.66951l-7.99701,8.36287c-0.26887,0.28025 -0.60859,0.46645 -0.97919,0.5377l-2.9085,0.5643c-0.06358,0.0114 -0.12535,0.01805 -0.18712,0.01805c-0.26978,0 -0.53138,-0.11115 -0.72576,-0.31445c-0.23889,-0.2508 -0.34517,-0.60705 -0.2834,-0.95475z'/>  <path stroke='null' id='svg_2' fill='black' d='m1.89256,14.64649l0.55193,-3.09431c0.06969,-0.39537 0.25273,-0.7569 0.52777,-1.04497l8.17764,-8.50862c0.71919,-0.74724 1.88902,-0.74917 2.61098,0l1.51269,1.57374c0.71918,0.74917 0.71918,1.96717 0,2.71634l-8.18044,8.50959c-0.27503,0.28517 -0.62255,0.47463 -1.00165,0.54713l-2.97521,0.5742c-0.06504,0.0116 -0.12823,0.01837 -0.19141,0.01837c-0.27596,0 -0.54357,-0.1131 -0.74241,-0.31997c-0.24437,-0.2552 -0.35309,-0.6177 -0.2899,-0.9715l0.00001,0zm11.57099,-8.18576l1.07784,-1.12134l-0.00093,-0.81974l-1.69109,-1.7603l-0.78794,0.00097l-1.07785,1.12134l2.47997,2.57907zm-7.58298,7.69662c0.14867,-0.029 0.28526,-0.10343 0.39304,-0.21653l6.36763,-6.62458l-2.47904,-2.57907l-6.36762,6.62362c-0.10871,0.11407 -0.18026,0.25617 -0.20906,0.4118l-0.44043,2.47177l0.35773,0.37217l2.37775,-0.45917l0,-0.00001z'/> <line fill='none' x1='0' y1='0' x2='0' y2='16' id='svg_5' stroke-linejoin='undefined' stroke-linecap='undefined' stroke='black' stroke-width='3'/> </g></svg>")
                0 8,
            pointer;
    }

    :global(.isArea .textLayer, .isArea .textLayer *) {
        cursor: crosshair;
    }

    :global(.isSelectionInProgress .PdfHighlighter__highlight-layer) {
        z-index: -1;
    }
</style>


<div
    bind:this={containerNodeRef}
    class={isDragging_MouseDown ? 'isDraggingContainer PdfHighlighter' : 'PdfHighlighter'}
    onpointerdown={handleMouseDown}
    onpointerup={handleMouseUp}
    style={derived_style}
>
    <!-- svelte-ignore a11y_no_static_element_interactions -->
    <div 
        class={derived_classes}
        oncontextmenu={(event) =>
            onContextMenu && onContextMenu(event)
        }
    ></div>
            <!-- <style>
              {`
              .textLayer ::selection {
                background: ${textSelectionColor};
              }
            `}
            </style> -->
    {#if isViewerReady}
        <TipContainer 
            {clearTextSelection} 
            onTipUpdate = {(tipUpdater) => pdfHighlighterUtils.setTip = tipUpdater} 
            viewer={viewerRef!}
            colors={colors} 
            {highlightsStore}
            {highlightPopup}
            {editHighlightPopup}
            {newHighlightPopup}
        />
    {/if}

    {#if isViewerReady && enableAreaSelection}
        <MouseSelection
            viewer={viewerRef!}
            enableAreaSelection={(e) => {return enableAreaSelection(e);}}
            onDragStart={() => disableTextSelection(viewerRef!, true)}
            onReset={() => {
                selectionRef = null;
                disableTextSelection(viewerRef!, false);
            }}
            onSelection={(
                viewportPosition,
                scaledPosition,
                image,
                resetSelection,
            ) => {
                selectionRef = {
                    content: { image },
                    type: "area",
                    position: scaledPosition,
                    };
                highlightsStore.addHighlight(selectionRef, '');
                //onAreaSelectionFin();
                clearTextSelection();
                }
            }
        />
    {/if}
</div>