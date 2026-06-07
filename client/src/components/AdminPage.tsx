import React, { FC, useEffect, useState } from 'react';
import AdminService, { AdminOrder } from '../services/AdminService';

const STATUS_LABELS: Record<string, string> = {
    pending:    'Ожидает',
    processing: 'В обработке',
    shipped:    'Отправлен',
    delivered:  'Доставлен',
    cancelled:  'Отменён',
};

const STATUS_OPTIONS = Object.entries(STATUS_LABELS);

const AdminPage: FC = () => {
    const [orders, setOrders] = useState<AdminOrder[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [updatingId, setUpdatingId] = useState<number | null>(null);
    const [search, setSearch] = useState('');
    const [filterStatus, setFilterStatus] = useState('');

    useEffect(() => {
        AdminService.getOrders()
            .then(res => setOrders(res.data))
            .catch(() => setError('Не удалось загрузить заказы'))
            .finally(() => setLoading(false));
    }, []);

    const handleStatusChange = async (orderId: number, status: string) => {
        setUpdatingId(orderId);
        try {
            const res = await AdminService.updateOrderStatus(orderId, status);
            setOrders(prev =>
                prev.map(o => o.id === orderId ? { ...o, status: res.data.status } : o)
            );
        } catch {
            alert('Не удалось обновить статус');
        } finally {
            setUpdatingId(null);
        }
    };

    const filtered = orders.filter(o => {
        const q = search.toLowerCase();
        const matchSearch =
            !q ||
            String(o.id).includes(q) ||
            o.user_email.toLowerCase().includes(q) ||
            (o.user_first_name || '').toLowerCase().includes(q) ||
            (o.user_last_name || '').toLowerCase().includes(q) ||
            (o.user_phone || '').includes(q);
        const matchStatus = !filterStatus || o.status === filterStatus;
        return matchSearch && matchStatus;
    });

    if (loading) return <div className="admin-loading">Загрузка заказов...</div>;
    if (error)   return <div className="admin-error">{error}</div>;

    return (
        <div className="admin-page">
            <h1 className="admin-page__title">Панель администратора</h1>
            <p className="admin-page__subtitle">Всего заказов: {orders.length}</p>

            <div className="admin-filters">
                <input
                    className="admin-search"
                    type="text"
                    placeholder="Поиск по ID, email, имени, телефону..."
                    value={search}
                    onChange={e => setSearch(e.target.value)}
                />
                <select
                    className="admin-filter-select"
                    value={filterStatus}
                    onChange={e => setFilterStatus(e.target.value)}
                >
                    <option value="">Все статусы</option>
                    {STATUS_OPTIONS.map(([val, label]) => (
                        <option key={val} value={val}>{label}</option>
                    ))}
                </select>
            </div>

            {filtered.length === 0 ? (
                <p className="admin-empty">Заказы не найдены</p>
            ) : (
                <div className="admin-orders">
                    {filtered.map(order => (
                        <div key={order.id} className={`admin-order admin-order--${order.status}`}>
                            <div className="admin-order__header">
                                <span className="admin-order__id">Заказ #{order.id}</span>
                                <span className={`admin-order__badge admin-order__badge--${order.status}`}>
                                    {STATUS_LABELS[order.status] || order.status}
                                </span>
                                <span className="admin-order__date">
                                    {new Date(order.created_at).toLocaleString('ru-RU')}
                                </span>
                            </div>

                            <div className="admin-order__body">
                                <div className="admin-order__section">
                                    <h3 className="admin-order__section-title">Клиент</h3>
                                    <p className="admin-order__field">
                                        <span className="admin-order__label">Email:</span>
                                        {order.user_email}
                                    </p>
                                    {(order.user_first_name || order.user_last_name) && (
                                        <p className="admin-order__field">
                                            <span className="admin-order__label">Имя:</span>
                                            {[order.user_first_name, order.user_last_name].filter(Boolean).join(' ')}
                                        </p>
                                    )}
                                    {order.user_phone && (
                                        <p className="admin-order__field">
                                            <span className="admin-order__label">Телефон:</span>
                                            {order.user_phone}
                                        </p>
                                    )}
                                </div>

                                <div className="admin-order__section">
                                    <h3 className="admin-order__section-title">Доставка</h3>
                                    <p className="admin-order__field">
                                        <span className="admin-order__label">Тип:</span>
                                        {order.delivery_type === 'courier' ? 'Курьер' : order.delivery_type}
                                    </p>
                                    <p className="admin-order__field">
                                        <span className="admin-order__label">Адрес:</span>
                                        {order.delivery_address}
                                    </p>
                                    <p className="admin-order__field">
                                        <span className="admin-order__label">Сумма:</span>
                                        {order.total_rub.toLocaleString('ru-RU')} ₽
                                    </p>
                                </div>

                                <div className="admin-order__section admin-order__section--status">
                                    <h3 className="admin-order__section-title">Статус</h3>
                                    <select
                                        className="admin-order__status-select"
                                        value={order.status}
                                        disabled={updatingId === order.id}
                                        onChange={e => handleStatusChange(order.id, e.target.value)}
                                    >
                                        {STATUS_OPTIONS.map(([val, label]) => (
                                            <option key={val} value={val}>{label}</option>
                                        ))}
                                    </select>
                                    {updatingId === order.id && (
                                        <span className="admin-order__saving">Сохранение...</span>
                                    )}
                                </div>
                            </div>

                            {order.items.length > 0 && (
                                <div className="admin-order__items">
                                    <h3 className="admin-order__section-title">Товары ({order.items.length})</h3>
                                    <div className="admin-order__items-list">
                                        {order.items.map(item => (
                                            <div key={item.id} className="admin-order__item">
                                                {item.images?.[0] && (
                                                    <img
                                                        className="admin-order__item-img"
                                                        src={item.images[0]}
                                                        alt={item.name}
                                                    />
                                                )}
                                                <div className="admin-order__item-info">
                                                    <p className="admin-order__item-name">{item.brand} — {item.name}</p>
                                                    <p className="admin-order__item-meta">
                                                        Размер: {item.size} · Кол-во: {item.quantity} · ${item.price_usd}
                                                    </p>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

export default AdminPage;
