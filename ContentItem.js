const mongoose = require('mongoose');

const contentItemSchema = new mongoose.Schema(
    {
        user: {
            type: mongoose.Schema.Types.ObjectId,
            required: true,
            ref: 'User', // Reference to the User model
        },
        title: {
            type: String,
            required: [true, 'Content title is required'],
            trim: true,
        },
        platform: {
            type: String,
            required: [true, 'Platform is required'],
            enum: ['Instagram', 'Twitter', 'Facebook', 'YouTube', 'Blog'],
        },
        contentType: {
            type: String,
            required: [true, 'Content type is required'],
            enum: ['Post', 'Blog', 'Video', 'Story'],
        },
        publishDate: {
            type: Date,
            required: [true, 'Publish date is required'],
        },
        status: {
            type: String,
            required: [true, 'Status is required'],
            enum: ['Draft', 'Scheduled', 'Published'],
            default: 'Draft',
        },
        tags: {
            type: [String], // Array of strings
            default: [],
        },
        notes: {
            type: String,
            trim: true,
            default: '',
        },
    },
    {
        timestamps: true, // Adds createdAt and updatedAt
    }
);

const ContentItem = mongoose.model('ContentItem', contentItemSchema);
module.exports = ContentItem;