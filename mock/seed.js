require('dotenv').config()
const bcrypt = require('bcryptjs')
const connectDB = require('../config/db')
const User = require('../models/user.models')
const Product = require('../models/product.models')
const mockApi = require('./mockApi')

async function seed() {
    await connectDB()

    const products = await mockApi.getProducts()
    await Product.deleteMany({})
    const saved = await Product.insertMany(products)
    console.log(`Seeded ${saved.length} products`)

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
