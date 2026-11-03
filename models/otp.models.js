const mongoose = require('mongoose')
const otpSchema = new mongoose.Schema(
    {

        email: {
            type: String,
            required: [true, "Email is required"],
            trim:true,
            lowercase: true,
            index: true
        },

        otp: {
            type: String,
            required: true,
            index: true
        },

        used: {
            type: Boolean,
            default: false
        },
        
        expiresAt: {
            type: Date,
            required: true,
            default: () => new Date(Date.now() + 10 * 60 * 1000)

        }
    },
    {
        timestamps: true,
        collection: 'otps'
    }
)

const otp = mongoose.model('otp', otpSchema);
module.exports = otp;