const Cart = require('../models/cart.models');
const Product = require('../models/product.models');

class CartService {
    async getCart(userId) {
        let cart = await Cart.findOne({ user: userId }).populate('items.productId');
        if (!cart) {
            cart = await Cart.create({ user: userId, items: [] });
            return cart;
        }

        const availableItems = cart.items.filter((item) => item.productId);
        if (availableItems.length !== cart.items.length) {
            cart.items = availableItems;
            await cart.save();
        }

        return cart;
    }

    async addItem(userId, productId, quantity) {
        const product = await Product.findOne({ _id: productId, isActive: true, isDeleted: { $ne: true } });
        if (!product) {
            throw new Error('Product not found or unavailable');
        }
        const qty = Math.max(1, Number(quantity) || 1);
        if (qty > product.stock) {
            throw new Error(`Only ${product.stock} items left in stock`);
        }

        let cart = await Cart.findOne({ user: userId });
        if (!cart) {
            cart = await Cart.create({ user: userId, items: [] });
        }

        const existing = cart.items.find((item) => item.productId.toString() === productId);
        if (existing) {
            const newQty = existing.quantity + qty;
            if (newQty > product.stock) {
                throw new Error(`Only ${product.stock} items left in stock`);
            }
            existing.quantity = newQty;
        } else {
            cart.items.push({ productId: product._id, quantity: qty, price: product.price });
        }

        await cart.save();
        return await this.getCart(userId);
    }

    async updateItem(userId, productId, quantity) {
        const cart = await Cart.findOne({ user: userId });
        if (!cart) {
            throw new Error('Cart not found');
        }
        const item = cart.items.find((i) => i.productId.toString() === productId);
        if (!item) {
            throw new Error('Item not in cart');
        }
        const qty = Number(quantity);
        if (!qty || qty < 1) {
            cart.items = cart.items.filter((i) => i.productId.toString() !== productId);
        } else {
            const product = await Product.findById(productId);
            if (product && qty > product.stock) {
                throw new Error(`Only ${product.stock} items left in stock`);
            }
            item.quantity = qty;
        }
        await cart.save();
        return await this.getCart(userId);
    }

    async removeItem(userId, productId) {
        const cart = await Cart.findOne({ user: userId });
        if (!cart) {
            throw new Error('Cart not found');
        }
        cart.items = cart.items.filter((i) => i.productId.toString() !== productId);
        await cart.save();
        return await this.getCart(userId);
    }

    async clearCart(userId) {
        const cart = await Cart.findOne({ user: userId });
        if (!cart) {
            throw new Error('Cart not found');
        }
        cart.items = [];
        await cart.save();
        return cart;
    }
}

module.exports = new CartService();
