const jwt = require('jsonwebtoken');

// Get JWT secret directly from environment variables
const jwtSecret = process.env.JWT_SECRET;

if (!jwtSecret) {
    throw new Error('JWT_SECRET is not defined in environment variables');
}

const generateToken = (userId) => {
    return jwt.sign({ id: userId }, jwtSecret, {
        expiresIn: '30d', // Token expires in 30 days
    });
};

module.exports = {
    generateToken,
};