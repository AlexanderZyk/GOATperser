import React, { FC, useEffect, useState, useContext } from 'react';
import CartService from '../services/CartService';
import { ICartItem } from '../models/IProduct';
import { formatRub } from '../utils/formatPrice';
import { displaySize } from '../utils/convertSize';
import CheckoutModal from './CheckoutModal';
import { Context } from '../index';
import { observer } from 'mobx-react-lite';

const CartPage: FC = () => {
    const { store } = useContext(Context);
    const rate = store.usdRate;
    const [items, setItems] = useState<ICartItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [selected, setSelected] = useState<Set<number>>(new Set());
    const [showCheckout, setShowCheckout] = useState(false);

    const loadCart = async () => {
        setLoading(true);
        try {
            const res = await CartService.getCart();
            setItems(res.data);
            setSelected(new Set(res.data.map((i: ICartItem) => i.id)));
        } catch (e: any) {
            setError(e.response?.data?.message || 'Ошибка загрузки корзины');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { loadCart(); }, []);

    const toggleItem = (id: number) => {
        setSelected(prev => {
            const next = new Set(prev);
            next.has(id) ? next.delete(id) : next.add(id);
            return next;
        });
    };

    const allSelected = items.length > 0 && selected.size === items.length;
    const toggleAll = () => {
        setSelected(allSelected ? new Set() : new Set(items.map(i => i.id)));
    };

    const handleRemove = async (id: number) => {
        try {
            await CartService.removeFromCart(id);
            setItems(prev => prev.filter(i => i.id !== id));
            setSelected(prev => { const next = new Set(prev); next.delete(id); return next; });
        } catch (e: any) {
            setError(e.response?.data?.message || 'Ошибка удаления');
        }
    };

    const handleRemoveSelected = async () => {
        try {
            await Promise.all(Array.from(selected).map(id => CartService.removeFromCart(id)));
            setItems(prev => prev.filter(i => !selected.has(i.id)));
            setSelected(new Set());
        } catch (e: any) {
            setError(e.response?.data?.message || 'Ошибка удаления');
        }
    };

    const handleClear = async () => {
        try {
            await CartService.clearCart();
            setItems([]);
            setSelected(new Set());
        } catch (e: any) {
            setError(e.response?.data?.message || 'Ошибка очистки');
        }
    };

    const getItemPriceUsd = (item: ICartItem): number => {
        const sizeData = item.product.sizes?.find(s => s.size === item.size);
        const raw = (sizeData?.price || item.product.lowestPrice || '').replace(/[^0-9.]/g, '');
        return parseFloat(raw) || 0;
    };

    const getItemPrice = (item: ICartItem): string =>
        formatRub(
            item.product.sizes?.find(s => s.size === item.size)?.price || item.product.lowestPrice,
            rate
        );

    const selectedItems = items.filter(i => selected.has(i.id));
    const selectedTotal = selectedItems.reduce(
        (sum, item) => sum + Math.round(getItemPriceUsd(item) * rate) * item.quantity,
        0
    );

    if (loading) {
        return (
            <div className="loading-screen" style={{ minHeight: 300 }}>
                <div className="spinner"></div>
            </div>
        );
    }

    return (
        <div className="cart-page">
            <div className="cart-header">
                <h2 className="cart-header__title">Корзина ({items.length})</h2>
                {items.length > 0 && (
                    <div style={{ display: 'flex', gap: 8 }}>
                        {selected.size > 0 && selected.size < items.length && (
                            <button className="btn btn--secondary" onClick={handleRemoveSelected}>
                                Удалить выбранные ({selected.size})
                            </button>
                        )}
                        <button className="btn btn--secondary" onClick={handleClear}>
                            Очистить всё
                        </button>
                    </div>
                )}
            </div>

            {error && <div className="alert alert--error" style={{ marginBottom: 20 }}>{error}</div>}

            {items.length === 0 ? (
                <div className="cart-empty">
                    <p>Корзина пуста</p>
                    <p className="cart-empty__hint">Найдите товар на вкладке «Поиск» и добавьте его сюда</p>
                </div>
            ) : (
                <>
                    {/* Выбрать все */}
                    <div className="cart-select-all" onClick={toggleAll}>
                        <div className={`cart-checkbox ${allSelected ? 'cart-checkbox--checked' : ''}`}>
                            {allSelected && <span className="cart-checkbox__tick">✓</span>}
                        </div>
                        <span className="cart-select-all__label">
                            {allSelected ? 'Снять выделение' : 'Выбрать все'}
                        </span>
                    </div>

                    <div className="cart-list">
                        {items.map(item => {
                            const isChecked = selected.has(item.id);
                            return (
                                <div
                                    className={`cart-item ${isChecked ? 'cart-item--selected' : 'cart-item--dimmed'}`}
                                    key={item.id}
                                    onClick={() => toggleItem(item.id)}
                                >
                                    <div className={`cart-checkbox ${isChecked ? 'cart-checkbox--checked' : ''}`}>
                                        {isChecked && <span className="cart-checkbox__tick">✓</span>}
                                    </div>
                                    {item.product.images?.[0] && (
                                        <div className="cart-item__image">
                                            <img src={item.product.images[0]} alt={item.product.name} />
                                        </div>
                                    )}
                                    <div className="cart-item__info">
                                        {item.product.brand && (
                                            <div className="cart-item__brand">{item.product.brand}</div>
                                        )}
                                        <div className="cart-item__name">{item.product.name}</div>
                                        <div className="cart-item__meta">
                                            <span className="cart-item__size">Размер: {displaySize(item.size)}</span>
                                            <span className="cart-item__price">{getItemPrice(item)}</span>
                                        </div>
                                    </div>
                                    <div className="cart-item__actions" onClick={e => e.stopPropagation()}>
                                        <a href={item.product.url} target="_blank" rel="noreferrer" className="cart-item__goat-link">
                                            ↗
                                        </a>
                                        <button className="cart-item__remove" onClick={() => handleRemove(item.id)}>
                                            ✕
                                        </button>
                                    </div>
                                </div>
                            );
                        })}
                    </div>

                    <div className="cart-total">
                        <span className="cart-total__label">
                            {selected.size === items.length
                                ? 'Итого:'
                                : `Итого (${selected.size} из ${items.length}):`}
                        </span>
                        <span className="cart-total__value">
                            {selectedTotal > 0 ? `${selectedTotal.toLocaleString('ru-RU')} ₽` : '—'}
                        </span>
                    </div>

                    {selected.size > 0 && (
                        <button
                            className="btn btn--primary cart-checkout-btn"
                            onClick={() => setShowCheckout(true)}
                        >
                            Оформить заказ ({selected.size})
                        </button>
                    )}
                </>
            )}

            {showCheckout && (
                <CheckoutModal
                    items={selectedItems}
                    total={selectedTotal}
                    rate={rate}
                    onClose={() => setShowCheckout(false)}
                    onSuccess={() => {
                        setItems(prev => prev.filter(i => !selected.has(i.id)));
                        setSelected(new Set());
                    }}
                />
            )}
        </div>
    );
};

export default observer(CartPage);
