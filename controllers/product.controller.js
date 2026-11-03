const productService = require('../services/product.services');

class ProductController {
    async getProducts(req, res) {
        try {
            const { category, search } = req.query;
            const products = await productService.getAllProducts({ category, search });
            return res.status(200).json({ products });
        } catch (error) {
            return res.status(500).json({ message: error.message });
        }
    }

    async getProductById(req, res) {
        try {
            const product = await productService.getProductById(req.params.id);
            if (!product) {
                return res.status(404).json({ message: 'Product not found' });
            }
            return res.status(200).json({ product });
        } catch (error) {
            return res.status(500).json({ message: error.message });
        }
    }

    async getCategories(req, res) {
        try {
            const categories = await productService.getCategories();
            return res.status(200).json({ categories });
        } catch (error) {
            return res.status(500).json({ message: error.message });
        }
    }

    async createProduct(req, res) {
        try {
            const product = await productService.createProduct(req.body);
            return res.status(201).json({ message: 'Product created', product });
        } catch (error) {
            return res.status(400).json({ message: error.message });
        }
    }

    async updateProduct(req, res) {
        try {
            const product = await productService.updateProduct(req.params.id, req.body);
            if (!product) {
                return res.status(404).json({ message: 'Product not found' });
            }
            return res.status(200).json({ product });
        } catch (error) {
            return res.status(400).json({ message: error.message });
        }
    }

    async deleteProduct(req, res) {
        try {
            const product = await productService.softDelete(req.params.id);
            if (!product) {
                return res.status(404).json({ message: 'Product not found' });
            }
            return res.status(200).json({ message: 'Product deleted' });
        } catch (error) {
            return res.status(500).json({ message: error.message });
        }
    }
}

module.exports = new ProductController();
