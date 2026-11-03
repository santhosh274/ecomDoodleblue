const mongoose = require('mongoose');
const connectDB = async () => {
    const MONGODB_URI = process.env.MONGODB_URL || process.env.MONGODB_URI;
    if (!MONGODB_URI) {
        console.error('Neither MONGODB_URL nor MONGODB_URI is defined in the environment variables.');
        process.exit(1);
    }

    try {
        await mongoose.connect(MONGODB_URI, {family: 4});
        console.log('MongoDB connected successfully');
    } catch (err) {
        console.error('Error connecting to MongoDB:', err.message);
        process.exit(1);
    }
};

module.exports = connectDB;