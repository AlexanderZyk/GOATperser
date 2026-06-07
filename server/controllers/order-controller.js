const orderService = require('../service/order-service');

class OrderController {
    async createOrder(req, res, next) {
        try {
            const { deliveryAddress, deliveryType, totalRub, items } = req.body;
            const order = await orderService.createOrder(
                req.user.id, deliveryAddress, deliveryType, totalRub, items
            );
            return res.json(order);
        } catch (e) {
            next(e);
        }
    }

    async getOrders(req, res, next) {
        try {
            const orders = await orderService.getOrders(req.user.id);
            return res.json(orders);
        } catch (e) {
            next(e);
        }
    }
}

module.exports = new OrderController();
