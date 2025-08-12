<script lang="ts" module>
    /**
     * The props type for {@link HighlightLayer}.
     *
     * @category Component Properties
     * @internal
     */
    import type { HighlightsModel } from '$lib/HighlightsModel.svelte.ts';
    import type { Snippet } from 'svelte';
    import type { PDFDocumentProxy } from 'pdfjs-dist/types/src/display/api';

    export interface pdfHighlighterProps {
        highlightsStore: HighlightsModel<any>;
        pdfDocument: PDFDocumentProxy;
        pdfViewerOptions?: Partial<PDFViewerOptions>;
        highlightPopup?: Snippet;
        editHighlightPopup?: Snippet;
        newHighlightPopup?: Snippet;
        highlightContainer?: Snippet;
        style: string;
        onContextMenu: (e: MouseEvent) => void;
        onHighlightContextMenu?: (
            event: MouseEvent,
            highlight: ViewportHighlight<CommentedHighlight>,
        ) => void;
        onHighlightClick?: any;
        pdfHighlighterUtils: Partial<TPdfHighlighterUtils>;

        /**
         * Event is called only once whenever the user changes scroll after
         * the autoscroll function, scrollToHighlight, has been called.
         */
        onScrollAway?(): void;
        onHighlightsRendered?(): void;
        scaleOnResize?: boolean;
    }
</script>

<script lang="ts">
    //TODO: refactor pdfHighlighterUtils
    import 'pdfjs-dist/web/pdf_viewer.css';
    import '$lib/style/pdf_viewer.css';

    import type {
        Highlight,
        HighlightBindings,
        //PdfSelection,
        //Tip,
        SearchOptions,
        ViewportPosition,
        Content,
        PdfHighlighterUtils as TPdfHighlighterUtils,
        TipContainerState as TTipContainerState,
        PdfScaleValue,
        ViewportHighlight,
        CommentedHighlight,
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
    import HighlightContainer from '$lib/components/HighlightContainer.svelte';
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
    import { debounce } from '$lib/utils';
    import type { PDFViewerOptions } from 'pdfjs-dist/types/web/pdf_viewer';

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

    let {
        highlightsStore,
        pdfDocument,
        pdfViewerOptions = {},
        highlightContainer = defaultHighlightContainer,
        highlightPopup,
        editHighlightPopup,
        newHighlightPopup,
        style,
        onContextMenu,
        onHighlightContextMenu,
        onHighlightClick,
        pdfHighlighterUtils = $bindable(),
        onScrollAway,
        onHighlightsRendered,
        scaleOnResize = false,
    }: pdfHighlighterProps = $props();

    //setContext('colors', colors);
    //setContext('scrolledTo_color', scrolledTo_color);

    let enableAreaSelection = $derived(pdfHighlighterUtils.selectedTool === 'area_selection');
    //let addGhostHighlight = highlightsStore.addGhostHighlight;
    //let removeGhostHighlights = highlightsStore.removeGhostHighlights;

    // State
    let currentHlId = $state(null);
    let currentHlZIndex = $state(0);
    let isViewerReady = $state(false);

    // Refs
    let containerNodeRef: HTMLDivElement | null = null;
    let highlightBindingsRef: { [page: number]: HighlightBindings } = {};
    //let selectionRef: PdfSelection | null = null;
    let selectionRef: Highlight|null = null;
    //let scrolledToHighlightIdRef: string | null = null;
    //let isAreaSelectionInProgressRef = false;

    let eventBusRef: InstanceType<typeof EventBus>;

    let linkServiceRef: InstanceType<typeof PDFLinkService>;
    let resizeObserverRef: ResizeObserver | null = null;
    let viewerRef: InstanceType<typeof PDFViewer> | null = $state.raw(null);
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

    //let prevQuery = "";
    const search = (options: SearchOptions = defaultSearchOptions) => {
        let opts = { ...defaultSearchOptions, ...options };
        /*if (opts.query.length > 0 && opts.query === prevQuery) {
            opts.type = 'again';
        } else {
            opts.type = 'again'; //'highlightallchange','', false
        };
        prevQuery = opts.query;*/

        eventBusRef.dispatch('find', opts);
        if (opts.query.length <= 0) {
            eventBusRef.dispatch("findbarclose", {});
        }
    };

    let removeKeyDownHandlers: () => void;
    let removeWheelHandler: () => void;
    // Initialise PDF Viewer
    onMount(() => {
        console.log('PdfHighliter mount');

        if (!containerNodeRef) return;

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
                    ...{
                        container: containerNodeRef!,
                        eventBus: eventBusRef,
                        textLayerMode: 1,
                        removePageBorders: true,
                        linkService: linkServiceRef,
                        findController: findController_instance,
                        annotationMode: 1,
                        enableHWA: false,
                    },
                    ...pdfViewerOptions
                }));

            viewerRef.setDocument(pdfDocument as any);
            linkServiceRef.setDocument(pdfDocument);
            linkServiceRef.setViewer(viewerRef);
            
            if (scaleOnResize) {
                resizeObserverRef = new ResizeObserver(()=>handleScaleValue('auto'));
                resizeObserverRef.observe(containerNodeRef);
            }
            

            //doc = containerNodeRef.ownerDocument;
            eventBusRef.on('textlayerrendered', () => {
                renderHighlightLayers(); 
                //handleScaleValue();
                console.log('textlayerrendered');
            });
            eventBusRef.on('pagesinit', ()=>{
                isViewerReady = true; 
                handleScaleValue(); 
                console.log('pagesinit');
            });


            let getMatchesCount = debounce(() => {
                pdfHighlighterUtils.searchState = {
                    matchesCount: {
                        current: (findController_instance._matchesCountTotal > 0) ? 1 : 0, 
                        total: findController_instance._matchesCountTotal,
                    }
                };
            }, 300);

            eventBusRef.on('updatefindcontrolstate', (data)=>{
                pdfHighlighterUtils.searchState = data;
                if (data.matchesCount.total === 0) {
                    getMatchesCount();
                }
            });
            // eventBusRef.on('updatefindmatchescount', (data)=>{
            // });

            eventBusRef.on('scrollmodechanged', (data: {mode: number})=>{
                if (!pdfHighlighterUtils.pageLayout) return;
                pdfHighlighterUtils.pageLayout.scrollMode = data.mode;
            });
            eventBusRef.on('scalechanging', (data: { scale: number, presetValue: string|undefined, }) =>
            {
                pdfHighlighterUtils.currentScale = data.scale;
                if (typeof data.presetValue !== 'undefined') {
                    pdfHighlighterUtils.currentScaleValue = data.presetValue as PdfScaleValue;
                } else {
                    pdfHighlighterUtils.currentScaleValue = data.scale;
                }
                
            });
            eventBusRef.on('spreadmodechanged', (data: {mode: number})=>{
                if (!pdfHighlighterUtils.pageLayout) return;
                pdfHighlighterUtils.pageLayout.spreadMode = data.mode;
            });
            // eventBusRef.on('updatetextlayermatches', (data)=>{
            // });
            eventBusRef.on('pagemode', (data)=>{
            });
                     
                        

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
                    pdfHighlighterUtils.search(options);
                }
            });

            removeWheelHandler = on(
                viewerRef!.container,
                'wheel',
                (event) => {
                    if (event.ctrlKey) {
                        event.preventDefault();
                        pdfHighlighterUtils.setCurrentScaleValue(
                            pdfHighlighterUtils.currentScale - event.deltaY / 1000
                            /*typeof pdfHighlighterUtils.currentScaleValue == 'number'
                                ? pdfHighlighterUtils.currentScaleValue - event.deltaY / 1000
                                : 1.0,*/
                        );
                        //handleScaleValue();
                    }
                },
                { passive: false },
            );

            eventBusRef.on('pagesloaded', () => {
                
            });
        }, 100);

        return () => {
            //TODO debounce
            //debouncedDocumentInit.cancel();
            eventBusRef.off('pagesinit', handleScaleValue);
            removeKeyDownHandlers();
            removeWheelHandler();
            resizeObserverRef?.disconnect();
            console.log('PdfHighliter unmount')
        };
    });
    //, [document]

    /*$effect(() => {
        console.log('PdfHighlighter effect run');
    });*/

    // Event listeners
    //const handleWheelScale =

    let isDragging_MouseDown = $state(false);
    let isSelectionInProgress = $state(false);
    const handleScroll = () => {
        onScrollAway && onScrollAway();
        pdfHighlighterUtils.scrolledToHighlightIdRef = null;
    };

    let tipContainerState: TTipContainerState = {
        show: false,
        pinned: false,
        highlight: null,
        position: null,
        addHighlight: highlightsStore.addHighlight,
        clearSelection: function() {
            //this.highlight = null;
            clearTextSelection();
        },
    };

    const handleMouseUp: PointerEventHandler = () => {
        if (isDragging_MouseDown) {
            viewerRef!.container.removeEventListener('mousemove', onDragScroll);
            //isGrabbing = false;
            isDragging_MouseDown = false;
        }
        
        const container = containerNodeRef;
        const selection = getWindow(container).getSelection();
        //console.log(selection)
        if (selection.type !== 'Range') {
            if (isSelectionInProgress) {
                isSelectionInProgress = false;
            }
            return;
        };

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
            parent_hl_id: currentHlId,
            z_index: currentHlZIndex + 1,
            //z_index: currentHlZIndex,
        };
        currentHlId = null;
        currentHlZIndex = 0;

        if (pdfHighlighterUtils.selectedTool !== 'highlight_pen') {
            tipContainerState.show = true;
            tipContainerState.pinned = true;
            tipContainerState.position = viewportPosition;
            tipContainerState.highlight = selectionRef;

            pdfHighlighterUtils.setTip(tipContainerState);
            //addGhostHighlight(selectionRef);
        } else {
            selectionRef.color_index = pdfHighlighterUtils.selectedColorIndex;
            highlightsStore.addHighlight(selectionRef);
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
            pdfHighlighterUtils.selectedTool === 'hand' || (
                !event.target.closest('span') &&
                !event.target.closest('textarea') &&
                !event.target.closest('.Highlight__popup') &&
                !event.target.closest('.resizers') &&
                pdfHighlighterUtils.selectedTool !== 'area_selection'
            ) && !event.target.closest('.TextHighlight__part')
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
            //clearTextSelection();
            // setTimeout(()=>{
            //     const container = containerNodeRef;
            //     const selection = getWindow(container).getSelection();
            //     //selection.collapse(selection.focusNode, selection.focusOffset)
            //     //selection.collapse(selection.focusNode, selection.focusOffset)
            // }, 1000)
        }
    };

    const handleScaleValue = (value: PdfScaleValue = pdfHighlighterUtils.currentScaleValue) => {
        //console.log('handleScaleValue:'+value)
        if (typeof value !== 'string' && typeof value !== 'number') return;
        if (viewerRef && isViewerReady && typeof value !== 'undefined') {
            viewerRef.currentScaleValue = value.toString();
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
                //scrolledToHighlightId: scrolledToHighlightIdRef,
                viewer: viewerRef,
                highlightBindings: highlightBindings,
                children: highlightContainer,
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
        onHighlightsRendered && onHighlightsRendered();
    };

    // Utils

    const clearTextSelection = () => {
        selectionRef = null;
        const container = containerNodeRef;
        const selection = getWindow(container).getSelection();
        if (!container || !selection) return;
        selection.removeAllRanges();
    };

    pdfHighlighterUtils = {...{
        search: search,
        searchState: {matchesCount: {current: 0, total: 0}},

        scrollToHighlight: function(highlight: Highlight) {
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

            this.scrolledToHighlightIdRef = highlight.id;

            // wait for scrolling to finish
            setTimeout(() => {
                viewerRef!.container.addEventListener('scroll', handleScroll, {
                    once: true,
                });
                this.scrolledToHighlightIdRef = '';
            }, 500);
        },
        scrolledToHighlightIdRef: '',
        //getCurrentSelection: () => selectionRef,
        isSelectionInProgress: () => isSelectionInProgress,
        //getViewer: () => viewerRef,
        //getTip: () => tip,

        currentScale: 1,
        currentScaleValue: 1,
        setCurrentScaleValue: function(value: PdfScaleValue) {
            if (typeof value === 'string') {
                handleScaleValue(value);
            } else if (value < 3 && value >= 0) {
                handleScaleValue(value.toFixed(1) as PdfScaleValue);
            }
            this.setTip(null);
        },

        setCurrentHighlightId: (hl) => {
            currentHlId = hl;
        },
        setCurrentHighlightZIndex: (index) => {
            currentHlZIndex = index;
        },

        textSelectionDelay: 1500,
        selectedTool: 'text_selection',
        selectedColorIndex: 0,
        colors: ['gold', 'yellowgreen', 'seagreen', 'blueviolet'],
        scrolledTo_color: 'red',
        highlightMixBlendMode: 'normal',
        
        setTip: () => {},

        pageLayout: {spreadMode: 0, scrollMode: 0},
        setPageLayout: (opts) => {
            if (opts.spreadMode !== undefined) viewerRef.spreadMode = opts.spreadMode;
            if (opts.scrollMode !== undefined) viewerRef.scrollMode = opts.scrollMode;
            if (opts.pagesRotation !== undefined) viewerRef.pagesRotation = opts.pagesRotation;
        },

    }, ...pdfHighlighterUtils } as TPdfHighlighterUtils;


    //const colors: string[] = getContext('colors') || ['#fcf151', '#ff659f', '#83f18d', '#67dfff', '#b581fe'];

    let derived_style = $derived.by(() => {
        if (pdfHighlighterUtils.selectedTool == 'hand') {
            return 'cursor: grab;' + style;
        } else {
            return style;
        }
    });
    let derived_classes = $derived.by(() => {
        let _str = 'removePageBorders pdfViewer ';
        if (pdfHighlighterUtils.selectedTool === 'hand' || isDragging_MouseDown) {
            _str += 'isDragging ';
        } else if (pdfHighlighterUtils.selectedTool === 'highlight_pen') {
            _str += 'isPen ';
        } else if (pdfHighlighterUtils.selectedTool === 'area_selection') {
            _str += 'isArea ';
        } else if (isSelectionInProgress) {
            _str += 'isSelectionInProgress ';
        }

        if (pdfHighlighterUtils.pageLayout.scrollMode === 1) {
            _str += 'scrollHorizontal';
        }

        return _str;
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

        display: flex;
        flex-flow: column;
    }
    
    /*:global(.textLayer ::selection) {
        background: yellowgreen;
    }*/

    /* Style the scrollbar */
    /*.PdfHighlighter::-webkit-scrollbar {
        width: 10px;
        height: 10px;
    }

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
    }*/

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
        pointer-events: none;
        opacity: 0.7;
    }
</style>

{#snippet defaultHighlightContainer()}
    <HighlightContainer
        editHighlight = {highlightsStore.editHighlight}
        onContextMenu={onHighlightContextMenu}
        onClick = {onHighlightClick}
        {pdfHighlighterUtils}
    />
{/snippet}

<div
    bind:this={containerNodeRef}
    class={isDragging_MouseDown ? 'isDraggingContainer PdfHighlighter' : 'PdfHighlighter'}
    onpointerdown={handleMouseDown}
    onpointerup={handleMouseUp}
    style={derived_style}
    onselectstart={(e)=>{
        //const container = containerNodeRef;
        //const selection = getWindow(container).getSelection();
        //selection.collapse(selection.focusNode, selection.focusOffset)

        clearTextSelection(); //prevents setting selection anchor on textHighlight__part (firefox 136)

        //It seems there is no quick and proper way to make highlighted text selectable without disabling pointer-events on the highlight div before onpointerdown event is triggered.
        //Currently, after the onpointerdown event fires on highlight div, its pointer events are set to disabled, but the selection anchor's (which initially is set on dissappeared div) behavior is no longer defined. 
        //This approach may work randomly, needs to be rewriten in the future.
        //pdfHighlighterUtils.textSelectionDelay -1 to disable

        //Text selection in area highlights works iff the page also contains one or more text highlights (chrome 132.0.6834.168).

    }}
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
            onTipUpdate = {(tipUpdater: (f: any) => any) => pdfHighlighterUtils.setTip = tipUpdater} 
            viewer={viewerRef!}
            colors={pdfHighlighterUtils.colors} 
            {highlightsStore}
            {highlightPopup}
            {editHighlightPopup}
            {newHighlightPopup}
        />
    {/if}

    {#if isViewerReady && enableAreaSelection}
        <MouseSelection
            viewer={viewerRef!}
            enableAreaSelection={enableAreaSelection}
            onDragStart={() => disableTextSelection(viewerRef!, true)}
            onReset={() => {
                selectionRef = null;
                disableTextSelection(viewerRef!, false);
            }}
            onMouseUp={()=>{
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
                    color_index: pdfHighlighterUtils.selectedColorIndex,
                    };
                highlightsStore.addHighlight(selectionRef);
                //onAreaSelectionFin();
                clearTextSelection();
                }
            }
        />
    {/if}
</div>