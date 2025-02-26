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

export function debounce(func, timeout = 300) {
    let timer;
    return (...args) => {
        clearTimeout(timer);
        timer = setTimeout(() => {
            func.apply(this, args);
        }, timeout);
    };
}