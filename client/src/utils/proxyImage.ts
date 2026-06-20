import { API_URL } from '../http';

export const proxyImage = (url: string): string => {
    if (!url || !url.startsWith('https://image.goat.com/')) return url;
    return `${API_URL}/image?url=${encodeURIComponent(url)}`;
};
