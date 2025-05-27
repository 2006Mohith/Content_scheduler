const asyncHandler = require('express-async-handler');
const ContentItem = require('../models/ContentItem');

// @desc    Create a new content item
// @route   POST /api/content
// @access  Private
const createContentItem = asyncHandler(async (req, res) => {
    const { title, platform, contentType, publishDate, status, tags, notes } = req.body;

    if (!title || !platform || !contentType || !publishDate) {
        res.status(400);
        throw new Error('Please provide title, platform, content type, and publish date');
    }

    const contentItem = new ContentItem({
        user: req.user._id, // Link to the logged-in user
        title,
        platform,
        contentType,
        publishDate,
        status: status || 'Draft',
        tags: tags ? (Array.isArray(tags) ? tags : tags.split(',').map(tag => tag.trim())) : [],
        notes,
    });

    const createdContentItem = await contentItem.save();
    res.status(201).json(createdContentItem);
});

// @desc    Get all content items for the logged-in user
// @route   GET /api/content
// @access  Private
const getAllContentItems = asyncHandler(async (req, res) => {
    const { platformFilter, statusFilter, tagFilter } = req.query;
    const query = { user: req.user._id };

    if (platformFilter) {
        query.platform = platformFilter;
    }
    if (statusFilter) {
    if (statusFilter.includes(',')) {
        query.status = { $in: statusFilter.split(',') };
    } else {
        query.status = statusFilter;
    }
}
    if (tagFilter) {
        // Case-insensitive search for tags
        query.tags = { $regex: tagFilter, $options: 'i' };
    }

    const contentItems = await ContentItem.find(query).sort({ publishDate: -1 }); // Sort by newest first
    res.json(contentItems);
});

// @desc    Get a single content item by ID
// @route   GET /api/content/:id
// @access  Private
const getContentItemById = asyncHandler(async (req, res) => {
    const contentItem = await ContentItem.findById(req.params.id);

    if (contentItem && contentItem.user.toString() === req.user._id.toString()) {
        res.json(contentItem);
    } else {
        res.status(404);
        throw new Error('Content item not found or not authorized');
    }
});

// @desc    Update a content item
// @route   PUT /api/content/:id
// @access  Private
const updateContentItem = asyncHandler(async (req, res) => {
    const { title, platform, contentType, publishDate, status, tags, notes } = req.body;
    const contentItem = await ContentItem.findById(req.params.id);

    if (contentItem && contentItem.user.toString() === req.user._id.toString()) {
        contentItem.title = title || contentItem.title;
        contentItem.platform = platform || contentItem.platform;
        contentItem.contentType = contentType || contentItem.contentType;
        contentItem.publishDate = publishDate || contentItem.publishDate;
        contentItem.status = status || contentItem.status;
        contentItem.tags = tags ? (Array.isArray(tags) ? tags : tags.split(',').map(tag => tag.trim())) : contentItem.tags;
        contentItem.notes = notes !== undefined ? notes : contentItem.notes;


        const updatedContentItem = await contentItem.save();
        res.json(updatedContentItem);
    } else {
        res.status(404);
        throw new Error('Content item not found or not authorized');
    }
});

// @desc    Delete a content item
// @route   DELETE /api/content/:id
// @access  Private
const deleteContentItem = asyncHandler(async (req, res) => {
    const contentItem = await ContentItem.findById(req.params.id);

    if (contentItem && contentItem.user.toString() === req.user._id.toString()) {
        await contentItem.deleteOne(); // or contentItem.remove() for older mongoose
        res.json({ message: 'Content item removed successfully' });
    } else {
        res.status(404);
        throw new Error('Content item not found or not authorized');
    }
});

module.exports = {
    createContentItem,
    getAllContentItems,
    getContentItemById,
    updateContentItem,
    deleteContentItem,
};