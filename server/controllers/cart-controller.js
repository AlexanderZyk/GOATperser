const cartService = require('../service/cart-service');

class CartController {
    async getCart(req, res, next) {
        try {
            const items = await cartService.getCart(req.user.id);
            return res.json(items);
        } catch (e) {
            next(e);
        }
    }

    async addToCart(req, res, next) {
        try {
            const { productId, size } = req.body;
            const item = await cartService.addToCart(req.user.id, productId, size);
            return res.json(item);
        } catch (e) {
            next(e);
        }
    }

    async removeFromCart(req, res, next) {
        try {
            await cartService.removeFromCart(req.params.id, req.user.id);
            return res.json({ message: 'Удалено' });
        } catch (e) {
            next(e);
        }
    }

    async clearCart(req, res, next) {
        try {
            await cartService.clearCart(req.user.id);
            return res.json({ message: 'Корзина очищена' });
        } catch (e) {
            next(e);
        }
    }
}

module.exports = new CartController();
