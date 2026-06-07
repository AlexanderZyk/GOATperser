export const toPngUrl = (url: string | undefined): string | undefined => {
    if (!url) return url;
    const m = url.match(/https:\/\/image\.goat\.com\/(?:filters:[^/]+\/)?(attachments\/[^?#\s]+)/);
    return m ? `https://image.goat.com/filters:format(png):quality(100)/${m[1]}` : url;
};
