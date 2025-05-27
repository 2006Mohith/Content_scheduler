const mongoose = require('mongoose');

// Use the correct environment variable for your MongoDB URI
const mongoURI = process.env.MONGODB_URI;

const connectDB = async () => {
    if (!mongoURI) {
        // This check is crucial
        console.error('FATAL ERROR: MONGODB_URI is not defined in your environment variables.');
        throw new Error('MONGODB_URI is not defined. Please check your .env file.');
    }

    try {
        await mongoose.connect(mongoURI);
        console.log('MongoDB Connected successfully!');
    } catch (err) {
        console.error('Error connecting to MongoDB:', err.message);
        // Re-throw the error so it can be caught by the caller (startServer in server.js)
        throw err;
    }
};

module.exports = connectDB;