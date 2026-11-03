const express = require('express');
const router = express.Router();

const cartController = require('../controllers/cart.controller');
const authenticate = require('../middleware/authenticate');
const authorize = require('../middleware/authorize');

// anyone logged in can shop, including admins
router.use(authenticate, authorize('customer', 'admin'));
router.get('/', cartController.getCart);
router.post('/items', cartController.addItem);
router.patch('/items', cartController.updateItem);
router.delete('/items/:productId', cartController.removeItem);
router.delete('/', cartController.clearCart);

module.exports = router;
