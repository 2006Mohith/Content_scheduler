// ./app.js

// Core and Third-Party Modules
const express = require('express');
const cors = require('cors');

// Custom Middleware & Route Imports
// IMPORTANT: Use relative paths for your custom modules for portability.
// Assuming 'middlewares' and 'routes' directories are at the same level as 'app.js'
// or one level down from the project root if app.js is in the root.
// If your 'backend' directory is the root of your Node.js project, and app.js is inside 'backend',
// then the path should be relative from 'app.js'.
//
// Example: If your structure is:
// backend/
// |- app.js
// |- middlewares/
//    |- errorMiddleware.js
// |- routes/
//    |- authRoutes.js
// ...then the paths below are correct.
const { errorHandler, notFound } = require('./middlewares/errorMiddleware.js'); // Corrected path
const authRoutes = require('./routes/authRoutes');
const contentRoutes = require('./routes/contentRoutes');
const userRoutes = require('./routes/userRoutes');
const analyticsRoutes = require('./routes/analyticsRoutes');

// Initialize Express App
const app = express();

app.use(cors({
    origin: [
        'http://127.0.0.1:5500', // Common for Live Server extension in VS Code
        'http://localhost:5500',  // Alias for 127.0.0.1
        'http://localhost:3000'   // Common for React, Vue, Angular dev servers
    ],
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'], // Added PATCH and OPTIONS
    allowedHeaders: ['Content-Type', 'Authorization'], // Common headers
    credentials: true // If you need to send cookies or use authorization headers with sessions
}));

app.use(express.json()); // For parsing application/json
app.use(express.urlencoded({ extended: true })); // For parsing application/x-www-form-urlencoded
app.get('/api', (req, res) => res.json({ message: 'API is running successfully!' }));
app.use('/api/auth', authRoutes);
app.use('/api/content', contentRoutes);
app.use('/api/user', userRoutes);
app.use('/api/analytics', analyticsRoutes);

app.use(notFound);

app.use(errorHandler);

// Export the configured Express app to be used by server.js
module.exports = app;