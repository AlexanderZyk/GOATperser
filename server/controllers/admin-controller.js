const orderService = require('../service/order-service');
const ApiError = require('../exceptions/api-error');

class AdminController {
    async getAllOrders(req, res, next) {
        try {
            const orders = await orderService.getAllOrders();
            return res.json(orders);
        } catch (e) {
            next(e);
        }
    }

    async updateOrderStatus(req, res, next) {
        try {
            const { id } = req.params;
            const { status } = req.body;
            if (!status) {
                return next(ApiError.BadRequest('Статус не указан'));
            }
            const order = await orderService.updateOrderStatus(id, status);
            if (!order) {
                return next(ApiError.BadRequest('Заказ не найден'));
            }
            return res.json(order);
        } catch (e) {
            next(e);
        }
    }

}


module.exports = new AdminController();
