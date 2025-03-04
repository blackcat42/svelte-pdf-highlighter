import groupHighlightsByPage from '$lib/pdf_utils/group-highlights-by-page';
import type { Highlight, ViewportHighlight } from '$lib/types';
//import { CommentedHighlight } from "$lib/types";

export class HighlightsModel {
    private _highlights: Array<Highlight> = $state([]);

    private _highlightsByPage = $derived.by(() => groupHighlightsByPage([...this.highlights]));

    private listeners = new Set<(arr: Array<Highlight>) => void>();

    constructor(highlights: Array<Highlight>) {
        this._highlights = highlights;
        /*this.addHighlight = this.addHighlight.bind(this);
        this.editHighlight = this.editHighlight.bind(this);
        this.deleteHighlight = this.deleteHighlight.bind(this);

        this.getHighlightById = this.getHighlightById.bind(this);
        this.getHighlightIndexById = this.getHighlightIndexById.bind(this);

        this.addGhostHighlight = this.addGhostHighlight.bind(this);
        this.removeGhostHighlights = this.removeGhostHighlights.bind(this);*/
    }

    get highlights() {
        return this._highlights;
    }
    private set highlights(new_highlights) {
        this._highlights = new_highlights;
        this.listeners.forEach((listener) => listener(this._highlights)); //TODO check response
    }
    get highlightsByPage() {
        return this._highlightsByPage;
    }

    //TODO: callback return type
    public subscribe = (callback: (arr: Array<Highlight>) => void) => {
        this.listeners.add(callback);
        return () => this.listeners.delete(callback);
    };

    public addHighlight = (highlight: Highlight, comment: string) => {
        console.log('Saving highlight', highlight);
        let id = this.getNextId();
        this.highlights.push({ ...highlight, id: id });
        return this.getHighlightById(id);
    };

    public editHighlight = (idToUpdate: string, edit: Partial<Highlight>) => {
        console.log(`Editing highlight ${idToUpdate} with `, edit);
        this.highlights = this.highlights.map((highlight) =>
            highlight.id === idToUpdate ? { ...highlight, ...edit } : highlight,
        );
    };
    public deleteHighlight = (highlight: Highlight | ViewportHighlight) => {
        console.log('Deleting highlight', highlight);
        this.highlights = this.highlights.filter((item) => {
            if (item.id === highlight.id && item.comment && item?.comment?.length > 3) {
                return !confirm(
                    'are you sure, you want to delete highlight along with this comment: "' +
                        item.comment +
                        '"?',
                );
            }
            return item.id !== highlight.id;
        });
    };

    public addGhostHighlight = (hl: Highlight) => {
        this.highlights.push({ ...hl, id: 'TEMP' + this.getNextId(), is_temp: true });
    };
    public removeGhostHighlights = () => {
        this.highlights = this.highlights.filter((item) => {
            return !item.is_temp;
        });
    };

    public getHighlightById = (id: string) => {
        return this.highlights.find((highlight) => highlight.id === id);
    };
    public getHighlightIndexById = (id: string) => {
        return this.highlights.findIndex((highlight) => highlight.id === id);
    };

    serialize() {}

    public getNextId = () => {
        return String(Math.random()).slice(5) + String(Date.now()).slice(8);
    };
}
