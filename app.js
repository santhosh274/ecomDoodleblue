const express = require('express')
require('dotenv').config()
const connectDB = require('./config/db')
const userRoutes = require('./routes/user.routes')
const productRoutes = require('./routes/product.routes')
const cartRoutes = require('./routes/cart.routes')
const orderRoutes = require('./routes/order.routes')

const app = express()
app.use(express.json())
app.use((req, res, next) => {
    res.setHeader('Access-Control-Allow-Origin', '*')
    res.setHeader('Access-Control-Allow-Methods', 'GET,POST,PATCH,PUT,DELETE,OPTIONS')
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization')
    if (req.method === 'OPTIONS') {
        return res.sendStatus(204)
    }
    next()
})
app.use(`/api/users/`,userRoutes)
app.use(`/api/products/`,productRoutes)
app.use(`/api/cart/`,cartRoutes)
app.use(`/api/orders/`,orderRoutes)

app.use((req, res) => {
    res.status(404).json({message:"Route not found"})
})

if (require.main === module) {
    connectDB().then(() => {
        const port = process.env.PORT || 2000;
        app.listen(port, () => {
            console.log(`Server is running on port : ${port}`);
        });
    }).catch((err) => {
        console.log(err);
        process.exit(1);
    });
}

module.exports = app