import React, { FC, useEffect, useRef, useState, useContext } from 'react';
import OrderService from '../services/OrderService';
import { IOrder } from '../models/IProduct';
import { formatRub } from '../utils/formatPrice';
import { displaySize } from '../utils/convertSize';
import { Context } from '../index';
import { observer } from 'mobx-react-lite';

const STATUS_LABELS: Record<string, string> = {
    pending:    'Ожидает',
    processing: 'В обработке',
    shipped:    'Отправлен',
    delivered:  'Доставлен',
    cancelled:  'Отменён',
};

const STATUS_CLASS: Record<string, string> = {
    pending:    'order-card__status--pending',
    processing: 'order-card__status--processing',
    shipped:    'order-card__status--shipped',
    delivered:  'order-card__status--delivered',
    cancelled:  'order-card__status--cancelled',
};

const POLL_INTERVAL = 30_000;

const OrdersPage: FC = () => {
    const { store } = useContext(Context);
    const rate = store.usdRate;
    const [orders, setOrders] = useState<IOrder[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

    const fetchOrders = (showLoader = false) => {
        if (showLoader) setLoading(true);
        OrderService.getOrders()
            .then(res => setOrders(res.data))
            .catch(e => setError(e.response?.data?.message || 'Ошибка загрузки заказов'))
            .finally(() => { if (showLoader) setLoading(false); });
    };

    useEffect(() => {
        fetchOrders(true);
        timerRef.current = setInterval(() => fetchOrders(), POLL_INTERVAL);
        return () => { if (timerRef.current) clearInterval(timerRef.current); };
    }, []);

    if (loading) {
        return (
            <div className="loading-screen" style={{ minHeight: 300 }}>
                <div className="spinner"></div>
            </div>
        );
    }

    return (
        <div className="orders-page">
            <div className="cart-header">
                <h2 className="cart-header__title">Мои заказы ({orders.length})</h2>
            </div>

            {error && <div className="alert alert--error" style={{ marginBottom: 20 }}>{error}</div>}

            {orders.length === 0 ? (
                <div className="cart-empty">
                    <p>Заказов пока нет</p>
                    <p className="cart-empty__hint">Оформите первый заказ через корзину</p>
                </div>
            ) : (
                <div className="orders-list">
                    {orders.map(order => (
                        <div className="order-card" key={order.id}>
                            <div className="order-card__header">
                                <div className="order-card__meta">
                                    <span className="order-card__id">Заказ №{order.id}</span>
                                    <span className="order-card__date">
                                        {new Date(order.created_at).toLocaleDateString('ru-RU', {
                                            day: 'numeric', month: 'long', year: 'numeric',
                                        })}
                                    </span>
                                </div>
                                <div className="order-card__right">
                                    <span className={`order-card__status ${STATUS_CLASS[order.status] || ''}`}>
                                        {STATUS_LABELS[order.status] || order.status}
                                    </span>
                                    <span className="order-card__total">{order.total_rub.toLocaleString('ru-RU')} ₽</span>
                                </div>
                            </div>

                            <div className="order-card__delivery">
                                {order.delivery_address}
                            </div>

                            <div className="order-card__items">
                                {order.items.map(item => (
                                    <div className="order-item" key={item.id}>
                                        {item.images?.[0] && (
                                            <div className="order-item__image">
                                                <img src={item.images[0]} alt={item.name} />
                                            </div>
                                        )}
                                        <div className="order-item__info">
                                            {item.brand && <div className="cart-item__brand">{item.brand}</div>}
                                            <div className="cart-item__name">{item.name}</div>
                                            <div className="cart-item__meta">
                                                <span className="cart-item__size">Размер: {displaySize(item.size)}</span>
                                                {item.price_usd && (
                                                    <span className="cart-item__price">{formatRub(item.price_usd, rate)}</span>
                                                )}
                                            </div>
                                        </div>
                                        <a
                                            href={item.url}
                                            target="_blank"
                                            rel="noreferrer"
                                            className="cart-item__goat-link"
                                        >
                                            ↗
                                        </a>
                                    </div>
                                ))}
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

export default observer(OrdersPage);
