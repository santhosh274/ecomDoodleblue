const express = require('express');
const router = express.Router();

const productController = require('../controllers/product.controller');
const authenticate = require('../middleware/authenticate');
const authorize = require('../middleware/authorize');

// Public
router.get('/', productController.getProducts);
router.get('/categories', productController.getCategories);
router.get('/:id', productController.getProductById);

// Admin only
router.post('/', authenticate, authorize('admin'), productController.createProduct);
router.patch('/:id', authenticate, authorize('admin'), productController.updateProduct);
router.delete('/:id', authenticate, authorize('admin'), productController.deleteProduct);

module.exports = router;
