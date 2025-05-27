const asyncHandler = require('express-async-handler');
const User = require('../models/User');
const { comparePassword } = require('../utils/passwordUtils'); // Or use user.matchPassword

// @desc    Get user details (profile name, email, but not all settings)
// @route   GET /api/user/details
// @access  Private
const getUserDetails = asyncHandler(async (req, res) => {
    const user = await User.findById(req.user._id).select('-password'); // Exclude password
    if (user) {
        res.json({
            _id: user._id,
            username: user.username,
            email: user.email,
            profileName: user.profileName,
        });
    } else {
        res.status(404);
        throw new Error('User not found');
    }
});

// @desc    Update user profile (name, email)
// @route   PUT /api/user/profile/update
// @access  Private
const updateUserProfile = asyncHandler(async (req, res) => {
    const user = await User.findById(req.user._id);

    if (user) {
        user.profileName = req.body.profileName || user.profileName;
        user.email = req.body.email || user.email;
        // If username needs to be updatable, add checks for uniqueness
        // user.username = req.body.username || user.username;

        const updatedUser = await user.save();
        res.json({
            _id: updatedUser._id,
            username: updatedUser.username,
            email: updatedUser.email,
            profileName: updatedUser.profileName,
            message: "Profile updated successfully"
        });
    } else {
        res.status(404);
        throw new Error('User not found');
    }
});

// @desc    Update user password
// @route   PUT /api/user/password/update
// @access  Private
const updateUserPassword = asyncHandler(async (req, res) => {
    const { currentPassword, newPassword, confirmNewPassword } = req.body;
    const user = await User.findById(req.user._id);

    if (!currentPassword || !newPassword || !confirmNewPassword) {
        res.status(400);
        throw new Error('Please provide current password, new password, and confirm new password');
    }

    if (user && (await user.matchPassword(currentPassword))) {
        if (newPassword !== confirmNewPassword) {
            res.status(400);
            throw new Error('New passwords do not match');
        }
        if (newPassword.length < 6) {
            res.status(400);
            throw new Error('New password must be at least 6 characters long');
        }
        user.password = newPassword; // Mongoose pre-save hook will hash it
        await user.save();
        res.json({ message: 'Password updated successfully' });
    } else {
        res.status(401);
        throw new Error('Invalid current password or user not found');
    }
});


// @desc    Get user settings (platform, notification, theme)
// @route   GET /api/user/settings
// @access  Private
const getUserSettings = asyncHandler(async (req, res) => {
    const user = await User.findById(req.user._id).select('platformPreferences notificationSettings themeAppearanceSettings');
    if (user) {
        res.json({
            platformPreferences: user.platformPreferences,
            notificationSettings: user.notificationSettings,
            themeAppearanceSettings: user.themeAppearanceSettings,
        });
    } else {
        res.status(404);
        throw new Error('User not found');
    }
});

// @desc    Update user settings
// @route   PUT /api/user/settings
// @access  Private
const updateUserSettings = asyncHandler(async (req, res) => {
    const user = await User.findById(req.user._id);

    if (user) {
        if (req.body.platformPreferences) {
            user.platformPreferences = { ...user.platformPreferences, ...req.body.platformPreferences };
        }
        if (req.body.notificationSettings) {
            user.notificationSettings = { ...user.notificationSettings, ...req.body.notificationSettings };
        }
        if (req.body.themeAppearanceSettings) {
            user.themeAppearanceSettings = { ...user.themeAppearanceSettings, ...req.body.themeAppearanceSettings };
        }

        const updatedUser = await user.save();
        res.json({
            platformPreferences: updatedUser.platformPreferences,
            notificationSettings: updatedUser.notificationSettings,
            themeAppearanceSettings: updatedUser.themeAppearanceSettings,
            message: "Settings updated successfully"
        });
    } else {
        res.status(404);
        throw new Error('User not found');
    }
});


module.exports = {
    getUserDetails,
    updateUserProfile,
    updateUserPassword,
    getUserSettings,
    updateUserSettings,
};