import $api from '../http';
import { AxiosResponse } from 'axios';

export interface AdminOrderItem {
    id: number;
    size: string;
    quantity: number;
    price_usd: number;
    product_id: number;
    name: string;
    brand: string;
    images: string[];
    url: string;
}

export interface AdminOrder {
    id: number;
    delivery_address: string;
    delivery_type: string;
    total_rub: number;
    status: string;
    created_at: string;
    user_id: number;
    user_email: string;
    user_first_name: string;
    user_last_name: string;
    user_phone: string;
    items: AdminOrderItem[];
}

export default class AdminService {
    static async getOrders(): Promise<AxiosResponse<AdminOrder[]>> {
        return $api.get<AdminOrder[]>('/admin/orders');
    }

    static async updateOrderStatus(orderId: number, status: string): Promise<AxiosResponse<AdminOrder>> {
        return $api.patch<AdminOrder>(`/admin/orders/${orderId}/status`, { status });
    }

}
