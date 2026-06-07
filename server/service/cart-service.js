const CartModel = require('../models/cart-model');
const ApiError = require('../exceptions/api-error');

class CartService {
    async getCart(userId) {
        const items = await CartModel.getByUser(userId);
        return items.map(item => ({
            id: item.id,
            size: item.size,
            quantity: item.quantity,
            addedAt: item.added_at,
            product: {
                id: item.product_id,
                url: item.url,
                name: item.name,
                brand: item.brand,
                images: item.images,
                lowestPrice: item.lowest_price,
                sizes: item.sizes,
            },
        }));
    }

    async addToCart(userId, productId, size) {
        if (!productId || !size) {
            throw ApiError.BadRequest('Укажите товар и размер');
        }
        return CartModel.add(userId, productId, size);
    }

    async removeFromCart(itemId, userId) {
        await CartModel.remove(itemId, userId);
    }

    async clearCart(userId) {
        await CartModel.clear(userId);
    }
}

module.exports = new CartService();
