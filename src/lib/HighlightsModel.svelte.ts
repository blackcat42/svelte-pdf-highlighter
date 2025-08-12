import groupHighlightsByPage from '$lib/pdf_utils/group-highlights-by-page';
import type { Highlight, ViewportHighlight } from '$lib/types';
//import { CommentedHighlight } from "$lib/types";

export class HighlightsModel<T extends Highlight> {
    private _highlights: Array<T> = $state([]);

    private _highlightsByPage = $derived.by(() => groupHighlightsByPage([...this.highlights]));

    private listeners = new Set<(arr: Array<T>) => any>();

    constructor(highlights: Array<T>) {
        this._highlights = highlights;
    }

    get highlights() {
        return this._highlights;
    }
    private set highlights(new_highlights) {
        this._highlights = new_highlights;
        this.listeners.forEach((listener) => {
            let response = listener(this._highlights);
            if (response instanceof Error) console.log(response.message);
        });
    }
    get highlightsByPage() {
        return this._highlightsByPage;
    }

    public subscribe = (callback: (arr: Array<T>) => any) => {
        this.listeners.add(callback);
        return () => this.listeners.delete(callback);
    };

    public addHighlight = (highlight: T) => {
        console.log('Saving highlight', highlight);
        let id = this.getNextId();
        this.highlights = [...this.highlights, { ...highlight, id: id }];
        //this.highlights.push({ ...highlight, id: id });
        return this.getHighlightById(id);
    };

    public editHighlight = (idToUpdate: string, edit: Partial<T>) => {
        console.log(`Editing highlight ${idToUpdate} with `, edit);
        this.highlights = this.highlights.map((highlight) =>
            highlight.id === idToUpdate ? { ...highlight, ...edit } : highlight,
        );
    };
    public deleteHighlight = (highlight: T | ViewportHighlight) => {
        console.log('Deleting highlight', highlight);
        this.highlights = this.highlights.filter((item) => {
            //TODO:
            /*if (item.id === highlight.id && item.comment && item?.comment?.length > 3) {
                return !confirm(
                    'are you sure, you want to delete highlight along with this comment: "' +
                        item.comment +
                        '"?',
                );
            }*/
            return item.id !== highlight.id;
        });
    };

    public moveDown = (highlight: T | ViewportHighlight) => {
        console.log('Move highlight', highlight);
        if ((typeof highlight.z_index) !== 'number') highlight.z_index = 0;
        highlight.z_index = highlight.z_index - 1;
        this.editHighlight(highlight.id, {z_index: highlight.z_index} as Partial<T>);
    };
    public moveUp = (highlight: T | ViewportHighlight) => {
        console.log('Move highlight', highlight);
        if ((typeof highlight.z_index) !== 'number') highlight.z_index = 0;
        highlight.z_index = highlight.z_index + 1;
        this.editHighlight(highlight.id, {z_index: highlight.z_index} as Partial<T>);
    };

    public resetHighlights = () => {
        this.highlights = [];
    };

    public addGhostHighlight = (hl: T) => {
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
