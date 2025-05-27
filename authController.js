const asyncHandler = require('express-async-handler');
const User = require('../models/User');
const { generateToken } = require('../utils/tokenUtils');

// @desc    Register a new user
// @route   POST /api/auth/register
// @access  Public
const registerUser = asyncHandler(async (req, res) => {
    const { username, email, password, profileName } = req.body;

    if (!username || !email || !password) {
        res.status(400);
        throw new Error('Please add all fields (username, email, password)');
    }

    const userExists = await User.findOne({ $or: [{ email }, { username }] });

    if (userExists) {
        res.status(400);
        throw new Error('User already exists with this email or username');
    }

    const user = await User.create({
        username,
        email,
        password,
        profileName: profileName || username, // Default profileName to username if not provided
    });

    if (user) {
        res.status(201).json({
            _id: user._id,
            username: user.username,
            email: user.email,
            profileName: user.profileName,
            token: generateToken(user._id),
            message: 'Registration successful!',
        });
    } else {
        res.status(400);
        throw new Error('Invalid user data');
    }
});

// @desc    Authenticate user & get token
// @route   POST /api/auth/login
// @access  Public
const loginUser = asyncHandler(async (req, res) => {
    const { username, password } = req.body; // Can login with username or email

    if (!username || !password) {
        res.status(400);
        throw new Error('Please provide username/email and password');
    }

    const user = await User.findOne({ $or: [{ email: username }, { username: username }] });

    if (user && (await user.matchPassword(password))) {
        res.json({
            _id: user._id,
            username: user.username,
            email: user.email,
            profileName: user.profileName,
            token: generateToken(user._id),
            message: 'Login successful!',
        });
    } else {
        res.status(401); // Unauthorized
        throw new Error('Invalid username/email or password');
    }
});


// @desc    Get user profile (example, more detailed profile is in userController)
// @route   GET /api/auth/profile
// @access  Private
const getUserProfile = asyncHandler(async (req, res) => {
    // req.user is set by the protect middleware
    if (req.user) {
        res.json({
            _id: req.user._id,
            username: req.user.username,
            email: req.user.email,
            profileName: req.user.profileName,
        });
    } else {
        res.status(404);
        throw new Error('User not found');
    }
});


module.exports = {
    registerUser,
    loginUser,
    getUserProfile
};