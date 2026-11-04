const mongoose = require('mongoose')
const orderItemSchema = new mongoose.Schema(
    {
        productId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Product',
            required: true
        },

        title: {
            type: String,
            required: true
        },

        image: {
            type: String,
            default: ''
        },

        quantity: {
            type: Number,
            required: true,
            min: 1
        },

        price: {
            type: Number,
            required: true,
            min: 0
        }
    },
    { _id: false }
)

const orderSchema = new mongoose.Schema(
    {
        user: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            required: true,
            index: true
        },

        items: {
            type: [orderItemSchema],
            required: true
        },

        total: {
            type: Number,
            required: true,
            min: 0
        },

        subtotal: {
            type: Number,
            required: true,
            min: 0
        },

        discountPercentage: {
            type: Number,
            default: 0,
            min: 0,
            max: 100
        },

        couponCode: {
            type: String,
            default: null
        },

        shippingAddress: {
            type: String,
            required: [true, "Shipping address is required"],
            trim: true
        },

        status: {
            type: String,
            enum: ['pending', 'shipped', 'delivered', 'cancelled'],
            default: 'pending'
        }
    },
    {
        timestamps: true,
        collection: 'orders'
    }
)

const Order = mongoose.model('Order', orderSchema);
module.exports = Order;
