export interface ISize {
    size: string;
    price: string | null;
}

export interface IProduct {
    id: number;
    url: string;
    name: string;
    brand?: string;
    images: string[];
    lowestPrice?: string;
    sizes: ISize[];
}

export interface ICartItem {
    id: number;
    size: string;
    quantity: number;
    addedAt: string;
    product: IProduct;
}

export interface IOrderItem {
    id: number;
    product_id: number;
    size: string;
    quantity: number;
    price_usd: string;
    name: string;
    brand?: string;
    images: string[];
    url: string;
}

export interface IOrder {
    id: number;
    user_id: number;
    delivery_address: string;
    delivery_type: string;
    total_rub: number;
    status: string;
    created_at: string;
    items: IOrderItem[];
}
