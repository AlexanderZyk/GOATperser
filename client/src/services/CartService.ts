import $api from '../http';
import { AxiosResponse } from 'axios';
import { ICartItem } from '../models/IProduct';

export default class CartService {
    static getCart(): Promise<AxiosResponse<ICartItem[]>> {
        return $api.get<ICartItem[]>('/cart');
    }

    static addToCart(productId: number, size: string): Promise<AxiosResponse> {
        return $api.post('/cart', { productId, size });
    }

    static removeFromCart(itemId: number): Promise<AxiosResponse> {
        return $api.delete(`/cart/${itemId}`);
    }

    static clearCart(): Promise<AxiosResponse> {
        return $api.delete('/cart');
    }
}
