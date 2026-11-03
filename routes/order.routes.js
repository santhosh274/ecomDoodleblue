const express = require('express');
const router = express.Router();

const orderController = require('../controllers/order.controller');
const authenticate = require('../middleware/authenticate');
const authorize = require('../middleware/authorize');

// customers and admins place and view their own orders
router.post('/', authenticate, authorize('customer', 'admin'), orderController.createOrder);
router.get('/me', authenticate, authorize('customer', 'admin'), orderController.getMyOrders);

// admin manages every order
router.get('/', authenticate, authorize('admin'), orderController.getAllOrders);
router.patch('/:id/status', authenticate, authorize('admin'), orderController.updateStatus);

module.exports = router;
