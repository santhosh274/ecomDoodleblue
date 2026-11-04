const mongoose = require('mongoose');
const Product = require('../models/product.models');

class ProductService {
    async getAllProducts({ category, search }) {
        const filter = { isDeleted: { $ne: true } };
        if (category) filter.category = category;
        if (search) filter.title = { $regex: search, $options: 'i' };
        return await Product.find(filter).sort({ createdAt: -1 });
    }

    async getProductById(id) {
        if (!mongoose.isValidObjectId(id)) {
            return null;
        }
        return await Product.findOne({ _id: id, isDeleted: { $ne: true } });
    }

    async getCategories() {
        const products = await Product.find({ isDeleted: { $ne: true } }).select('category');
        return [...new Set(products.map((p) => p.category))];
    }

    async createProduct(data) {
        return await Product.create(data);
    }

    async updateProduct(id, changes) {
        if (!mongoose.isValidObjectId(id)) {
            return null;
        }
        return await Product.findOneAndUpdate(
            { _id: id, isDeleted: { $ne: true } },
            {
                title: changes.title,
                description: changes.description,
                price: changes.price,
                category: changes.category,
                image: changes.image,
                stock: changes.stock
            },
            { new: true, runValidators: true }
        );
    }

    async softDelete(id) {
        if (!mongoose.isValidObjectId(id)) {
            return null;
        }
        return await Product.findOneAndUpdate(
            { _id: id, isDeleted: { $ne: true } },
            { isActive: false, isDeleted: true, deletedAt: new Date() },
            { new: true }
        );
    }
}

module.exports = new ProductService();
