require('dotenv').config();

// DEBUG: Check if env vars are loaded
console.log('JWT_SECRET exists:', !!process.env.JWT_SECRET);
console.log('PORT:', process.env.PORT);
console.log('NODE_ENV:', process.env.NODE_ENV);

const app = require('./app'); // Your Express app instance
const connectDB = require('./config/db'); // Your database connection function
const { port } = require('./config'); // Destructure port from your config file

const nodeEnv = process.env.NODE_ENV || 'development';

// Asynchronous function to start the server
const startServer = async () => {
    try {
        await connectDB();

        // Start the Express server on all network interfaces (0.0.0.0)
        app.listen(port, '0.0.0.0', () => {
            console.log(`Server running in ${nodeEnv} mode on port ${port}`);
            console.log(`Accessible on other devices via: http://<YOUR_LOCAL_IP>:${port}`);
        });

    } catch (error) {
        // Log any errors that occur during the startup process (e.g., DB connection failure)
        console.error('Failed to start the server:', error.message);
        // Exit the process with a failure code if critical startup tasks fail
        process.exit(1);
    }
};

// Call the function to start the server
startServer();