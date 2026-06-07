const OrderModel = require('../models/order-model');

class OrderService {
    async createOrder(userId, deliveryAddress, deliveryType, totalRub, items) {
        return OrderModel.create(userId, deliveryAddress, deliveryType, totalRub, items);
    }

    async getOrders(userId) {
        return OrderModel.getByUser(userId);
    }

    async getAllOrders() {
        return OrderModel.getAll();
    }

    async updateOrderStatus(orderId, status) {
        return OrderModel.updateStatus(orderId, status);
    }

}

module.exports = new OrderService();
