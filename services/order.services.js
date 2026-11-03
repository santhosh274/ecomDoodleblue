const mongoose = require('mongoose');
const Order = require('../models/order.models');
const Product = require('../models/product.models');
const Cart = require('../models/cart.models');

class OrderService {
    async createOrder(userId, { shippingAddress }) {
        const cart = await Cart.findOne({ user: userId }).populate('items.productId');
        if (!cart || cart.items.length === 0) {
            throw new Error('Cart is empty');
        }

        const items = [];
        for (const item of cart.items) {
            const product = await Product.findById(item.productId._id);
            if (!product || product.isDeleted || !product.isActive) {
                throw new Error(`${item.productId.title} is no longer available`);
            }
            if (product.stock < item.quantity) {
                throw new Error(`Only ${product.stock} items left of ${product.title}`);
            }
            items.push({
                productId: product._id,
                title: product.title,
                image: product.image,
                quantity: item.quantity,
                price: product.price
            });
        }

        const total = items.reduce((sum, item) => sum + item.price * item.quantity, 0);
        const order = await Order.create({ user: userId, items, total, shippingAddress });

        for (const item of items) {
            await Product.findByIdAndUpdate(item.productId, { $inc: { stock: -item.quantity } });
        }

        cart.items = [];
        await cart.save();

        return order;
    }

    async getOrders(userId) {
        return await Order.find({ user: userId }).sort({ createdAt: -1 });
    }

    async getAllOrders() {
        return await Order.find({}).populate('user', 'name email').sort({ createdAt: -1 });
    }

    async updateStatus(id, status) {
        if (!mongoose.isValidObjectId(id)) {
            return null;
        }
        return await Order.findByIdAndUpdate(id, { status }, { new: true });
    }
}

module.exports = new OrderService();
