<script lang="ts" module>
    /**
     * The props type for {@link PdfLoader}.
     *
     * @category Component Properties
     */
    export interface PdfLoaderProps {
        /**
         * The document to be loaded by PDF.js.
         * If you need to pass HTTP headers, auth parameters,
         * or other pdf settings, do it through here.
         */
        document: string | URL | TypedArray | DocumentInitParameters;

        /**
         * Callback to render content before the PDF document is loaded.
         *
         * @param progress - PDF.js progress status.
         * @returns - Component to be rendered in space of the PDF document while loading.
         */
        //beforeLoad?(progress: OnProgressParameters): ReactNode;

        /**
         * Component to render in the case of any PDF loading errors.
         *
         * @param error - PDF loading error.
         * @returns - Component to be rendered in space of the PDF document.
         */
        //errorMessage?(error: Error): ReactNode;

        /**
         * Child components to use/render the loaded PDF document.
         *
         * @param pdfDocument - The loaded PDF document.
         * @returns - Component to render once PDF document is loaded.
         */
        pdfHighlighterWrapper(pdfDocument: PDFDocumentProxy): any;

        /**
         * Callback triggered whenever an error occurs.
         *
         * @param error - PDF Loading error triggering the event.
         * @returns - Component to be rendered in space of the PDF document.
         */
        onError?(error: Error): void;

        /**
         * NOTE: This will be applied to all PdfLoader instances.
         * If you want to only apply a source to this instance, use the document parameters.
         */
        workerSrc?: string;
    }
</script>

<script lang="ts">
    import { GlobalWorkerOptions, getDocument } from 'pdfjs-dist';
    import type {
        DocumentInitParameters,
        TypedArray,
        PDFDocumentProxy,
    } from 'pdfjs-dist/types/src/display/api.ts';

    //const DEFAULT_BEFORE_LOAD = (progress: OnProgressParameters) => (
    //
    //);

    //const DEFAULT_ERROR_MESSAGE = (error: Error) => (
    //
    //);
    import { setContext, getContext, onMount } from 'svelte';

    const DEFAULT_ON_ERROR = (error: Error) => {
        throw new Error(`Error loading PDF document: ${error.message}!`);
    };

    const DEFAULT_WORKER_SRC = 'https://unpkg.com/pdfjs-dist@4.4.168/build/pdf.worker.min.mjs';
    //await import("$lib/pdf_highlighter/pdf.worker.min.mjs");

    /**
     * A component for loading a PDF document and passing it to a child.
     *
     * @category Component
     */
    let {
        document,
        //beforeLoad = DEFAULT_BEFORE_LOAD,
        //errorMessage = DEFAULT_ERROR_MESSAGE,
        pdfHighlighterWrapper,
        onError = DEFAULT_ON_ERROR,
        workerSrc = DEFAULT_WORKER_SRC,
    }: PdfLoaderProps = $props();
    let pdfLoadingTaskRef: any = null;
    let pdfDocumentRef: PDFDocumentProxy | null = $state(null);

    let error: Error | null = $state(null);
    let loadingProgress: any = $state(null);

    // Intitialise document
    //const document = getContext('document');

    onMount(() => {
        GlobalWorkerOptions.workerSrc = workerSrc;

        pdfLoadingTaskRef = getDocument(document);
        pdfLoadingTaskRef.onProgress = (progress) => {
            loadingProgress = progress.loaded > progress.total ? null : progress;
        };

        pdfLoadingTaskRef.promise
            .then((pdfDocument) => {
                pdfDocumentRef = pdfDocument;
            })
            .catch((err: Error) => {
                if (err.message != 'Worker was destroyed') {
                    error = err;
                    onError(err);
                }
            })
            .finally(() => {
                loadingProgress = null;
            });

        return () => {
            if (pdfLoadingTaskRef) {
                pdfLoadingTaskRef.destroy();
            }
            if (pdfDocumentRef) {
                pdfDocumentRef.destroy();
            }
        };
    });
    //, [document]

    //const HighlightContext = createContext<HighlightContainerUtils | undefined>(undefined);
    setContext('HighlightContext', undefined);
</script>

{#if error}
    <div style="color: black">{error.message}</div>
{:else if loadingProgress}
    <div style="color: black">
        Loading {Math.floor((loadingProgress.loaded / loadingProgress.total) * 100)}%
    </div>
{:else if pdfDocumentRef}
    {@render pdfHighlighterWrapper(pdfDocumentRef)}
{/if}