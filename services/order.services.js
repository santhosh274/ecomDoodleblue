const mongoose = require('mongoose');
const Order = require('../models/order.models');
const Product = require('../models/product.models');
const Cart = require('../models/cart.models');
const Coupon = require('../models/Coupon');

class OrderService {
    async createOrder(userId, { shippingAddress, couponCode }) {
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

        const subtotal = items.reduce((sum, item) => sum + item.price * item.quantity, 0);
        let discountPercentage = 0;
        let normalizedCouponCode = null;

        if (couponCode) {
            normalizedCouponCode = typeof couponCode === 'string' ? couponCode.trim().toUpperCase() : '';
            const coupon = await Coupon.findOne({ code: normalizedCouponCode, isActive: true });
            if (!coupon || (coupon.expiryDate && coupon.expiryDate <= new Date())) {
                throw new Error('Invalid or expired coupon code');
            }
            discountPercentage = coupon.discountPercentage;
        }

        const total = Number((subtotal * (1 - discountPercentage / 100)).toFixed(2));
        const order = await Order.create({
            user: userId,
            items,
            subtotal,
            discountPercentage,
            couponCode: normalizedCouponCode,
            total,
            shippingAddress
        });

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
