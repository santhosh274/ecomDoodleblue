const cartService = require('../services/cart.services');

class CartController {
    async getCart(req, res) {
        try {
            const cart = await cartService.getCart(req.user.id);
            return res.status(200).json({ cart });
        } catch (error) {
            return res.status(500).json({ message: error.message });
        }
    }

    async addItem(req, res) {
        try {
            const { productId, quantity } = req.body;
            const cart = await cartService.addItem(req.user.id, productId, quantity);
            return res.status(200).json({ message: 'Item added to cart', cart });
        } catch (error) {
            return res.status(400).json({ message: error.message });
        }
    }

    async updateItem(req, res) {
        try {
            const { productId, quantity } = req.body;
            const cart = await cartService.updateItem(req.user.id, productId, quantity);
            return res.status(200).json({ message: 'Cart updated', cart });
        } catch (error) {
            return res.status(400).json({ message: error.message });
        }
    }

    async removeItem(req, res) {
        try {
            const cart = await cartService.removeItem(req.user.id, req.params.productId);
            return res.status(200).json({ message: 'Item removed', cart });
        } catch (error) {
            return res.status(400).json({ message: error.message });
        }
    }

    async clearCart(req, res) {
        try {
            await cartService.clearCart(req.user.id);
            return res.status(200).json({ message: 'Cart cleared' });
        } catch (error) {
            return res.status(400).json({ message: error.message });
        }
    }
}

module.exports = new CartController();
