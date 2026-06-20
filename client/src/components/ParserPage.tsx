import React, { FC, useState, useEffect, useCallback, useContext, useRef } from 'react';
import ParserService from '../services/ParserService';
import CartService from '../services/CartService';
import { formatRub } from '../utils/formatPrice';
import { toRuSize } from '../utils/convertSize';
import { Context } from '../index';
import { observer } from 'mobx-react-lite';
import { proxyImage } from '../utils/proxyImage';

interface HistoryItem {
    url: string;
    name: string;
    image?: string;
}

const MAX_HISTORY = 10;

const historyKey = (userId: string) => `parseHistory_${userId}`;

const NOT_FOUND_PHRASES = ['this page could not be found', 'page not found', 'not found'];

const isValidProduct = (name: string): boolean => {
    const lower = name.toLowerCase();
    return !NOT_FOUND_PHRASES.some(p => lower.includes(p));
};

const loadHistory = (userId: string): HistoryItem[] => {
    if (!userId) return [];
    try {
        const all: HistoryItem[] = JSON.parse(localStorage.getItem(historyKey(userId)) || '[]');
        const clean = all.filter(h => h.name && isValidProduct(h.name));
        if (clean.length !== all.length) {
            localStorage.setItem(historyKey(userId), JSON.stringify(clean));
        }
        return clean;
    } catch { return []; }
};

const saveHistory = (item: HistoryItem, prev: HistoryItem[], userId: string): HistoryItem[] => {
    const filtered = prev.filter(h => h.url !== item.url);
    const updated = [item, ...filtered].slice(0, MAX_HISTORY);
    localStorage.setItem(historyKey(userId), JSON.stringify(updated));
    return updated;
};

const ParserPage: FC = () => {
    const { store } = useContext(Context);
    const rate = store.usdRate;
    const isAuth = store.isAuth;
    const userId = store.user?.id;
    const onAuthRequired = () => store.setShowAuthModal(true);
    const [url, setUrl] = useState(store.parsedUrl);
    const product = store.parsedProduct;
    const [selectedSize, setSelectedSize] = useState('');
    const [activeImage, setActiveImage] = useState(0);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [cartSuccess, setCartSuccess] = useState('');
    const [lightboxOpen, setLightboxOpen] = useState(false);
    const [lightboxIndex, setLightboxIndex] = useState(0);
    const [sizesAtEnd, setSizesAtEnd] = useState(false);
    const sizesGridRef = useRef<HTMLDivElement>(null);
    const [history, setHistory] = useState<HistoryItem[]>([]);

    useEffect(() => {
        setHistory(loadHistory(userId));
    }, [userId]);

    const openLightbox = (index: number) => {
        setLightboxIndex(index);
        setLightboxOpen(true);
    };

    const closeLightbox = () => setLightboxOpen(false);

    const lightboxPrev = useCallback(() => {
        if (!product) return;
        setLightboxIndex(i => (i - 1 + product.images.length) % product.images.length);
    }, [product]);

    const lightboxNext = useCallback(() => {
        if (!product) return;
        setLightboxIndex(i => (i + 1) % product.images.length);
    }, [product]);

    useEffect(() => {
        if (!lightboxOpen) return;
        const handler = (e: KeyboardEvent) => {
            if (e.key === 'Escape') closeLightbox();
            if (e.key === 'ArrowLeft') lightboxPrev();
            if (e.key === 'ArrowRight') lightboxNext();
        };
        window.addEventListener('keydown', handler);
        return () => window.removeEventListener('keydown', handler);
    }, [lightboxOpen, lightboxPrev, lightboxNext]);

    const handleParse = async (parseUrl?: string) => {
        const target = (parseUrl ?? url).trim();
        if (!target) return;

        // Базовая валидация до отправки на сервер
        if (!target.startsWith('http')) {
            setError('Ссылка должна начинаться с https://');
            return;
        }
        if (!target.includes('goat.com')) {
            setError('Поддерживается только goat.com');
            return;
        }

        if (parseUrl) setUrl(parseUrl);
        setLoading(true);
        setError('');
        store.setParsedProduct(null);
        setSelectedSize('');
        setActiveImage(0);
        setSizesAtEnd(false);
        try {
            const res = await ParserService.parse(target);
            store.setParsedProduct(res.data);
            store.setParsedUrl(target);
            // Добавляем в историю только если товар найден и имя не содержит 404-фраз
            if (userId && res.data?.name && isValidProduct(res.data.name)) {
                setHistory(prev => saveHistory({
                    url: target,
                    name: res.data.name,
                    image: res.data.images?.[0] ? proxyImage(res.data.images[0]) : undefined,
                }, prev, userId));
            } else if (res.data?.name && !isValidProduct(res.data.name)) {
                throw new Error('Товар не найден на GOAT. Проверьте правильность ссылки.');
            }
        } catch (e: any) {
            const msg = e.response?.data?.message;
            setError(msg || 'Не удалось получить данные о товаре. Попробуйте ещё раз.');
        } finally {
            setLoading(false);
        }
    };

    const handleRemoveHistory = (itemUrl: string) => {
        setHistory(prev => {
            const updated = prev.filter(h => h.url !== itemUrl);
            if (userId) localStorage.setItem(historyKey(userId), JSON.stringify(updated));
            return updated;
        });
    };

    const handleAddToCart = async () => {
        if (!product || !selectedSize) return;
        if (!isAuth) {
            onAuthRequired();
            return;
        }
        try {
            await CartService.addToCart(product.id, selectedSize);
            setCartSuccess(`Размер ${selectedSize} добавлен в корзину!`);
            setTimeout(() => setCartSuccess(''), 3000);
        } catch (e: any) {
            setError(e.response?.data?.message || 'Ошибка добавления в корзину');
        }
    };

    return (
        <div className="parser-page">
            <div className="search-bar">
                <div className="search-bar__input-wrap">
                    <input
                        type="text"
                        className="search-bar__input"
                        placeholder="Вставьте ссылку на товар с goat.com..."
                        value={url}
                        onChange={e => setUrl(e.target.value)}
                        onKeyDown={e => e.key === 'Enter' && handleParse()}
                    />
                    {url && (
                        <button className="search-bar__clear" onClick={() => setUrl('')}>✕</button>
                    )}
                </div>
                <button className="btn btn--primary search-bar__btn" onClick={() => handleParse()} disabled={loading}>
                    {loading ? 'Парсинг...' : 'Найти'}
                </button>
            </div>

            {error && <div className="alert alert--error" style={{ marginBottom: 20 }}>{error}</div>}

            {loading && (
                <div className="parse-loading">
                    <div className="spinner"></div>
                    <p>Загружаем страницу товара, это может занять 15–30 секунд...</p>
                </div>
            )}

            {product && (
                <div className="product-card">
                    <div className="product-card__gallery">
                        <div
                            className="product-card__main-image product-card__main-image--zoomable"
                            onClick={() => product.images.length > 0 && openLightbox(activeImage)}
                        >
                            {product.images.length > 0 ? (
                                <img src={proxyImage(product.images[activeImage])} alt={product.name} />
                            ) : (
                                <div className="product-card__no-image">Нет фото</div>
                            )}
                        </div>
                        {product.images.length > 1 && (
                            <div className="product-card__thumbnails">
                                {product.images.map((img, i) => (
                                    <img
                                        key={i}
                                        src={proxyImage(img)}
                                        alt=""
                                        className={`product-card__thumb ${i === activeImage ? 'product-card__thumb--active' : ''}`}
                                        onClick={() => setActiveImage(i)}
                                    />
                                ))}
                            </div>
                        )}
                    </div>

                    <div className="product-card__info">
                        {product.brand && <div className="product-card__brand">{product.brand}</div>}
                        <h2 className="product-card__name">{product.name}</h2>
                        {product.lowestPrice && (
                            <div className="product-card__price">
                                от {formatRub(product.lowestPrice, rate)}
                            </div>
                        )}

                        {product.sizes.length > 0 && (
                            <div className="product-card__sizes">
                                <div className="product-card__sizes-label">Выберите размер:</div>
                                <div className={`product-card__sizes-wrap ${sizesAtEnd ? 'product-card__sizes-wrap--end' : ''}`}>
                                <div
                                    className="product-card__sizes-grid"
                                    ref={el => {
                                        (sizesGridRef as any).current = el;
                                        if (el) setSizesAtEnd(el.scrollHeight <= el.clientHeight + 4);
                                    }}
                                    onScroll={e => {
                                        const el = e.currentTarget;
                                        setSizesAtEnd(el.scrollTop + el.clientHeight >= el.scrollHeight - 4);
                                    }}
                                >
                                    {product.sizes.map((s, i) => {
                                        const priceLabel = formatRub(s.price, rate);
                                        const outOfStock = priceLabel === 'Нет в наличии';
                                        const ruSize = toRuSize(s.size);
                                        const displaySize = s.size === 'OS' ? 'Один размер' : s.size;
                                        return (
                                            <button
                                                key={i}
                                                className={`size-btn ${s.size === 'OS' ? 'size-btn--os' : ''} ${selectedSize === s.size ? 'size-btn--active' : ''} ${outOfStock ? 'size-btn--unavailable' : ''}`}
                                                onClick={() => !outOfStock && setSelectedSize(s.size)}
                                                disabled={outOfStock}
                                            >
                                                <span className="size-btn__row">
                                                    <span className="size-btn__value">{displaySize}</span>
                                                    {ruSize && <span className="size-btn__ru">RU {ruSize}</span>}
                                                </span>
                                                {outOfStock
                                                    ? <span className="size-btn__cross">✕</span>
                                                    : <span className="size-btn__price">{priceLabel}</span>
                                                }
                                            </button>
                                        );
                                    })}
                                </div>
                                </div>
                            </div>
                        )}

                        {cartSuccess && <div className="alert alert--neutral">{cartSuccess}</div>}

                        <div className="product-card__actions">
                            <button
                                className="btn btn--primary"
                                onClick={handleAddToCart}
                                disabled={!selectedSize}
                            >
                                {selectedSize ? 'В корзину' : 'Выберите размер'}
                            </button>
                            <a href={product.url} target="_blank" rel="noreferrer" className="product-card__goat-link">
                                ↗ GOAT
                            </a>
                        </div>
                    </div>
                </div>
            )}

            {!loading && history.length > 0 && (
                <div className="parse-history" style={{ marginTop: 32 }}>
                    <div className="parse-history__header">
                        <span className="parse-history__title">История</span>
                        <button className="parse-history__clear-all" onClick={() => {
                            setHistory([]);
                            if (userId) localStorage.removeItem(historyKey(userId));
                        }}>Очистить</button>
                    </div>
                    <div className="parse-history__list">
                        {history.map((item, i) => (
                            <div key={i} className="parse-history__item" onClick={() => handleParse(item.url)}>
                                {item.image
                                    ? <img src={item.image} alt="" className="parse-history__thumb" />
                                    : <div className="parse-history__thumb parse-history__thumb--empty" />
                                }
                                <span className="parse-history__name">{item.name}</span>
                                <button
                                    className="parse-history__remove"
                                    onClick={e => { e.stopPropagation(); handleRemoveHistory(item.url); }}
                                >✕</button>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {lightboxOpen && product && (
                <div className="lightbox" onClick={closeLightbox}>
                    <button className="lightbox__close" onClick={closeLightbox}>✕</button>
                    {product.images.length > 1 && (
                        <button className="lightbox__nav lightbox__nav--prev" onClick={e => { e.stopPropagation(); lightboxPrev(); }}>‹</button>
                    )}
                    <img
                        className="lightbox__img"
                        src={proxyImage(product.images[lightboxIndex])}
                        alt={product.name}
                        onClick={e => e.stopPropagation()}
                    />
                    {product.images.length > 1 && (
                        <button className="lightbox__nav lightbox__nav--next" onClick={e => { e.stopPropagation(); lightboxNext(); }}>›</button>
                    )}
                    <div className="lightbox__counter">{lightboxIndex + 1} / {product.images.length}</div>
                </div>
            )}
        </div>
    );
};

export default observer(ParserPage);
