require('dotenv').config()
const bcrypt = require('bcryptjs')
const connectDB = require('../config/db')
const User = require('../models/user.models')
const Product = require('../models/product.models')
const Coupon = require('../models/Coupon')
const mockApi = require('./mockApi')

async function seed() {
    await connectDB()

    const products = await mockApi.getProducts()
    await Product.deleteMany({})
    const saved = await Product.insertMany(products)
    console.log(`Seeded ${saved.length} products`)

    const couponExpiryDate = new Date()
    couponExpiryDate.setFullYear(couponExpiryDate.getFullYear() + 1)
    const couponResult = await Coupon.updateOne(
        { code: 'WELCOME10' },
        {
            $setOnInsert: {
                discountPercentage: 10,
                expiryDate: couponExpiryDate,
                isActive: true
            }
        },
        { upsert: true }
    )
    console.log(couponResult.upsertedCount ? 'Seeded WELCOME10 coupon' : 'WELCOME10 coupon already exists')

    const adminEmail = process.env.ADMIN_EMAIL || 'admin@ecomsite.com'
    const adminPassword = process.env.ADMIN_PASSWORD || 'admin123'
    const existingAdmin = await User.findOne({ email: adminEmail })
    if (!existingAdmin) {
        const hashedPassword = await bcrypt.hash(adminPassword, 10)
        await User.create({
            name: 'Store Admin',
            email: adminEmail,
            password: hashedPassword,
            role: 'admin'
        })
        console.log(`Admin account created (${adminEmail})`);
    } else {
        console.log('Admin account already exists');
    }

    process.exit(0)
}

seed().catch((err) => {
    console.error(err);
    process.exit(1)
})
