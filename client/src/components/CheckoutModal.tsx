import React, { FC, useState } from 'react';
import { ICartItem } from '../models/IProduct';
import { formatRub } from '../utils/formatPrice';
import { displaySize } from '../utils/convertSize';
import OrderService from '../services/OrderService';

interface Props {
    items: ICartItem[];
    total: number;
    rate: number;
    onClose: () => void;
    onSuccess: () => void;
}

type Step = 'confirm' | 'delivery' | 'paying' | 'success';

const CheckoutModal: FC<Props> = ({ items, total, rate, onClose, onSuccess }) => {
    const [step, setStep] = useState<Step>('confirm');

    const [courierCity, setCourierCity] = useState('');
    const [courierStreet, setCourierStreet] = useState('');
    const [courierHouse, setCourierHouse] = useState('');
    const [courierApartment, setCourierApartment] = useState('');

    const getItemPrice = (item: ICartItem): string => {
        const sizeData = item.product.sizes?.find(s => s.size === item.size);
        return formatRub(sizeData?.price || item.product.lowestPrice, rate);
    };

    const getItemPriceUsd = (item: ICartItem): string => {
        const sizeData = item.product.sizes?.find(s => s.size === item.size);
        return sizeData?.price || item.product.lowestPrice || '0';
    };

    const canProceed = (): boolean =>
        courierCity.trim() !== '' && courierStreet.trim() !== '' && courierHouse.trim() !== '';

    const getDeliveryLabel = (): string =>
        [courierCity, courierStreet, `д. ${courierHouse}`, courierApartment ? `кв. ${courierApartment}` : '']
            .filter(Boolean).join(', ');

    const handlePay = async () => {
        setStep('paying');
        try {
            await OrderService.createOrder({
                deliveryAddress: getDeliveryLabel(),
                deliveryType: 'courier',
                totalRub: total,
                items: items.map(item => ({
                    cartItemId: item.id,
                    productId: item.product.id,
                    size: item.size,
                    quantity: item.quantity,
                    priceUsd: getItemPriceUsd(item),
                })),
            });
            setStep('success');
        } catch {
            setStep('delivery');
        }
    };

    const handleClose = () => {
        if (step === 'success') onSuccess();
        onClose();
    };

    return (
        <div className="modal-overlay" onClick={handleClose}>
            <div
                className={`modal checkout-modal ${step === 'delivery' ? 'checkout-modal--wide' : ''}`}
                onClick={e => e.stopPropagation()}
            >
                <button className="modal__close" onClick={handleClose}>✕</button>

                {/* ── Шаг 1: Товары ── */}
                {step === 'confirm' && (
                    <>
                        <div className="checkout-modal__title">Оформление заказа</div>
                        <div className="checkout-modal__subtitle">{items.length} {pluralItems(items.length)}</div>

                        <div className="checkout-items">
                            {items.map(item => (
                                <div className="checkout-item" key={item.id}>
                                    <div className="checkout-item__image">
                                        {item.product.images?.[0]
                                            ? <img src={item.product.images[0]} alt={item.product.name} />
                                            : <span>—</span>}
                                    </div>
                                    <div className="checkout-item__info">
                                        {item.product.brand && (
                                            <div className="checkout-item__brand">{item.product.brand}</div>
                                        )}
                                        <div className="checkout-item__name">{item.product.name}</div>
                                        <div className="checkout-item__size">Размер: {displaySize(item.size)}</div>
                                    </div>
                                    <div className="checkout-item__price">{getItemPrice(item)}</div>
                                </div>
                            ))}
                        </div>

                        <div className="checkout-modal__total">
                            <span>Итого</span>
                            <span>{total.toLocaleString('ru-RU')} ₽</span>
                        </div>

                        <button className="btn btn--primary checkout-modal__pay-btn" onClick={() => setStep('delivery')}>
                            Выбрать доставку →
                        </button>
                    </>
                )}

                {/* ── Шаг 2: Доставка ── */}
                {step === 'delivery' && (
                    <>
                        <div className="checkout-modal__title">Адрес доставки</div>

                        <div className="courier-form">
                            <div className="account-form__row">
                                <div className="form-group">
                                    <label>Город *</label>
                                    <input
                                        type="text"
                                        placeholder="Москва"
                                        value={courierCity}
                                        onChange={e => setCourierCity(e.target.value)}
                                    />
                                </div>
                                <div className="form-group">
                                    <label>Улица *</label>
                                    <input
                                        type="text"
                                        placeholder="ул. Ленина"
                                        value={courierStreet}
                                        onChange={e => setCourierStreet(e.target.value)}
                                    />
                                </div>
                            </div>
                            <div className="account-form__row">
                                <div className="form-group">
                                    <label>Дом *</label>
                                    <input
                                        type="text"
                                        placeholder="1"
                                        value={courierHouse}
                                        onChange={e => setCourierHouse(e.target.value)}
                                    />
                                </div>
                                <div className="form-group">
                                    <label>Квартира</label>
                                    <input
                                        type="text"
                                        placeholder="42"
                                        value={courierApartment}
                                        onChange={e => setCourierApartment(e.target.value)}
                                    />
                                </div>
                            </div>
                        </div>

                        <div className="checkout-modal__nav">
                            <button className="btn btn--secondary" onClick={() => setStep('confirm')}>
                                ← Назад
                            </button>
                            <button
                                className="btn btn--primary"
                                disabled={!canProceed()}
                                onClick={handlePay}
                            >
                                Оплатить {total.toLocaleString('ru-RU')} ₽
                            </button>
                        </div>
                    </>
                )}

                {/* ── Шаг 3: Оплата ── */}
                {step === 'paying' && (
                    <div className="checkout-modal__loading">
                        <div className="spinner"></div>
                        <div className="checkout-modal__loading-text">Обработка платежа...</div>
                    </div>
                )}

                {/* ── Шаг 4: Успех ── */}
                {step === 'success' && (
                    <div className="checkout-modal__success">
                        <div className="checkout-modal__success-icon">✓</div>
                        <div className="checkout-modal__success-title">Заказ оформлен!</div>
                        <div className="checkout-modal__success-text">
                            Спасибо за покупку.<br />
                            Курьер свяжется с вами для согласования времени.
                        </div>
                        <div className="checkout-modal__success-address">
                            {getDeliveryLabel()}
                        </div>
                        <button className="btn btn--primary checkout-modal__pay-btn" onClick={handleClose}>
                            Отлично!
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
};

function pluralItems(n: number): string {
    if (n % 10 === 1 && n % 100 !== 11) return 'товар';
    if ([2, 3, 4].includes(n % 10) && ![12, 13, 14].includes(n % 100)) return 'товара';
    return 'товаров';
}

export default CheckoutModal;
