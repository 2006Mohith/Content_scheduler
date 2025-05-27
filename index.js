require('dotenv').config();

module.exports = {
    port: process.env.PORT || 5001,
    nodeEnv: process.env.NODE_ENV || 'development',
    mongoURI: process.env.MONGO_URI // Making it available if other parts of config need it
};