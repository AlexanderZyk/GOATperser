import $api from '../http';
import { IOrder } from '../models/IProduct';

export interface CreateOrderPayload {
    deliveryAddress: string;
    deliveryType: string;
    totalRub: number;
    items: Array<{
        cartItemId: number;
        productId: number;
        size: string;
        quantity: number;
        priceUsd: string;
    }>;
}

export default class OrderService {
    static createOrder(data: CreateOrderPayload) {
        return $api.post<IOrder>('/orders', data);
    }

    static getOrders() {
        return $api.get<IOrder[]>('/orders');
    }
}
