const mongoose = require('mongoose')
const userSchema = new mongoose.Schema(
    {
        name:{
            type: String,
            required: [true, "Name is required"],
            trim: true
        },

        email: {
            type: String,
            required: [true, "Email is required"],
            trim:true,
            lowercase: true,
            unique: true
        },

        password: {
            type: String,
            required: [true, "Password is required"],
            select: false
        },

        address: {
            type: String,
            trim: true,
            default: ''
        },

        phone: {
            type: String,
            trim: true,
            default: ''
        },

        isActive: {
            type: Boolean,
            default: true
        },

        role: {
            type: String,
            required: true,
            enum: ['customer', 'admin'],
            default: 'customer',
            select: true,
        }
    },
    {
        timestamps: true,
        collection: 'ecomsite'
    }
)

const User = mongoose.model('User', userSchema);
module.exports = User;
