const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const platformPreferencesSchema = new mongoose.Schema({
    Instagram: { type: Boolean, default: true },
    Twitter: { type: Boolean, default: true },
    Facebook: { type: Boolean, default: true },
    YouTube: { type: Boolean, default: true },
    Blog: { type: Boolean, default: true },
    defaultPlatform: { type: String, default: '' },
}, { _id: false });

const notificationSettingsSchema = new mongoose.Schema({
    emailEnabled: { type: Boolean, default: false },
    inAppEnabled: { type: Boolean, default: false }, // Note: In-app needs more infrastructure (e.g., WebSockets)
    postReminder: { type: String, enum: ['none', '15min', '1hr', '24hr'], default: 'none' },
}, { _id: false });

const themeAppearanceSettingsSchema = new mongoose.Schema({
    mode: { type: String, enum: ['light', 'dark'], default: 'light' },
    fontSize: { type: String, enum: ['small', 'medium', 'large'], default: 'medium' },
}, { _id: false });

const userSchema = new mongoose.Schema(
    {
        username: {
            type: String,
            required: [true, 'Username is required'],
            unique: true,
            trim: true,
        },
        email: {
            type: String,
            required: [true, 'Email is required'],
            unique: true,
            trim: true,
            lowercase: true,
            match: [/.+\@.+\..+/, 'Please fill a valid email address'],
        },
        password: {
            type: String,
            required: [true, 'Password is required'],
            minlength: [6, 'Password must be at least 6 characters long'],
        },
        profileName: {
            type: String,
            default: function () {
                return this.username;
            },
        },
        platformPreferences: {
            type: platformPreferencesSchema,
            default: () => ({}),
        },
        notificationSettings: {
            type: notificationSettingsSchema,
            default: () => ({}),
        },
        themeAppearanceSettings: {
            type: themeAppearanceSettingsSchema,
            default: () => ({}),
        },
    },
    {
        timestamps: true, // Adds createdAt and updatedAt automatically
    }
);

// Hash password before saving
userSchema.pre('save', async function (next) {
    if (!this.isModified('password')) {
        return next();
    }
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    next();
});

// Method to compare entered password with hashed password in DB
userSchema.methods.matchPassword = async function (enteredPassword) {
    return await bcrypt.compare(enteredPassword, this.password);
};

const User = mongoose.model('User', userSchema);
module.exports = User;