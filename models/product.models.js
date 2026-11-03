const mongoose = require('mongoose')
const productSchema = new mongoose.Schema(
    {
        title: {
            type: String,
            required: [true, "Title is required"],
            trim: true
        },

        description: {
            type: String,
            trim: true,
            default: ''
        },

        price: {
            type: Number,
            required: [true, "Price is required"],
            min: 0
        },

        category: {
            type: String,
            required: [true, "Category is required"],
            trim: true,
            index: true
        },

        image: {
            type: String,
            default: ''
        },

        rating: {
            type: Number,
            default: 0,
            min: 0,
            max: 5
        },

        stock: {
            type: Number,
            default: 0,
            min: 0
        },

        isActive: {
            type: Boolean,
            default: true
        },

        isDeleted: {
            type: Boolean,
            default: false
        },

        deletedAt: {
            type: Date,
            default: null
        }
    },
    {
        timestamps: true,
        collection: 'products'
    }
)

const Product = mongoose.model('Product', productSchema);
module.exports = Product;
