export function cssStringify(obj: Object, postfix: string): string {
    let res = Object.keys(obj)
        .map((k) => {
            if (postfix === 'px' && Number.isFinite(parseInt(obj[k]))) {
                return `${k}: ${parseInt(obj[k])}px`;
            } else if (
                typeof postfix === 'string' &&
                postfix.length > 0 &&
                Number.isFinite(parseFloat(obj[k]))
            ) {
                return `${k}: ${parseFloat(obj[k])}${postfix}`;
            } else {
                return `${k}: ${obj[k]}`;
            }
        })
        .join(';');
    return res;
}


type Debounced = {(...args: unknown[]): any, cancel: ()=> void};
export function debounce(func: (...args: unknown[]) => unknown, _timeout: number): Debounced;
export function debounce(func: (...args: unknown[]) => unknown, _timeout: () => number): Debounced;
export function debounce(func, _timeout) {
    let timeout = 300;
    let timer: number;

    let f: Debounced = Object.assign(
        (...args: unknown[]) => {
            if (typeof _timeout === 'function') {
                timeout = _timeout();
                //console.log(_timeout());
            } else if (typeof _timeout === 'number') {
                timeout = _timeout;
            }
            
            clearTimeout(timer);
            timer = setTimeout(() => {
                func.apply(this, args);
            }, timeout);
        },
        { 
            cancel: () => {clearTimeout(timer)} 
        }
    );
    return f;
}