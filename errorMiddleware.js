// errorMiddleware.js
const errorHandler = (err, req, res, next) => {
    // Determine the status code. If it's a successful response (200),
    // it means an error occurred during processing, so we default to 500.
    // Otherwise, use the status code already set on the response.
    const statusCode = res.statusCode === 200 ? 500 : res.statusCode;
    res.status(statusCode);

    // Log the error stack in development for debugging
    if (process.env.NODE_ENV === 'development') {
        console.error(err.stack);
    }

    // Handle Mongoose validation errors
    if (err.name === 'ValidationError') {
        const messages = Object.values(err.errors).map(val => val.message);
        return res.json({
            message: "Validation Failed",
            errors: messages,
            // Only show stack in development
            stack: process.env.NODE_ENV === 'production' ? null : err.stack,
        });
    }

    // Handle Mongoose duplicate key errors (e.g., unique field constraint)
    if (err.code && err.code === 11000) {
        const field = Object.keys(err.keyValue)[0]; // Get the field that caused the duplicate error
        return res.status(400).json({
            message: `Duplicate field value entered for ${field}. Please use another value.`,
            // Only show stack in development
            stack: process.env.NODE_ENV === 'production' ? null : err.stack,
        });
    }

    // Generic error response for other types of errors
    res.json({
        message: err.message || 'Internal Server Error', // Use the error's message or a generic one
        // Only show stack in development
        stack: process.env.NODE_ENV === 'production' ? null : err.stack,
    });
};

const notFound = (req, res, next) => {
    const error = new Error(`Not Found - ${req.originalUrl}`);
    res.status(404); // Set status to 404 for not found errors
    next(error); // Pass the error to the errorHandler middleware
};

module.exports = { errorHandler, notFound };