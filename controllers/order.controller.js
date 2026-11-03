const orderService = require('../services/order.services');

class OrderController {
    async createOrder(req, res) {
        try {
            const order = await orderService.createOrder(req.user.id, req.body);
            return res.status(201).json({ message: 'Order placed', order });
        } catch (error) {
            return res.status(400).json({ message: error.message });
        }
    }

    async getMyOrders(req, res) {
        try {
            const orders = await orderService.getOrders(req.user.id);
            return res.status(200).json({ orders });
        } catch (error) {
            return res.status(500).json({ message: error.message });
        }
    }

    async getAllOrders(req, res) {
        try {
            const orders = await orderService.getAllOrders();
            return res.status(200).json({ orders });
        } catch (error) {
            return res.status(500).json({ message: error.message });
        }
    }

    async updateStatus(req, res) {
        try {
            const order = await orderService.updateStatus(req.params.id, req.body.status);
            if (!order) {
                return res.status(404).json({ message: 'Order not found' });
            }
            return res.status(200).json({ order });
        } catch (error) {
            return res.status(400).json({ message: error.message });
        }
    }
}

module.exports = new OrderController();
