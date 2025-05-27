const asyncHandler = require('express-async-handler');
const ContentItem = require('../models/ContentItem');
const mongoose = require('mongoose');

// @desc    Get content distribution by platform
// @route   GET /api/analytics/platform-distribution
// @access  Private
const getPlatformDistribution = asyncHandler(async (req, res) => {
    const distribution = await ContentItem.aggregate([
        { $match: { user: new mongoose.Types.ObjectId(req.user._id) } },
        { $group: { _id: '$platform', count: { $sum: 1 } } },
        { $project: { platform: '$_id', count: 1, _id: 0 } },
    ]);
    res.json(distribution);
});

// @desc    Get content counts by status
// @route   GET /api/analytics/status-counts
// @access  Private
const getContentStatusCounts = asyncHandler(async (req, res) => {
    const statusCounts = await ContentItem.aggregate([
        { $match: { user: new mongoose.Types.ObjectId(req.user._id) } },
        { $group: { _id: '$status', count: { $sum: 1 } } },
        { $project: { status: '$_id', count: 1, _id: 0 } },
    ]);
    res.json(statusCounts);
});

// @desc    Get publishing timeline data (e.g., posts per day for last N days)
// @route   GET /api/analytics/publishing-timeline
// @access  Private
const getPublishingTimeline = asyncHandler(async (req, res) => {
    const days = parseInt(req.query.days) || 7; // Default to last 7 days
    const endDate = new Date();
    endDate.setUTCHours(23, 59, 59, 999); // End of today
    const startDate = new Date();
    startDate.setUTCDate(startDate.getUTCDate() - (days -1));
    startDate.setUTCHours(0, 0, 0, 0); // Start of N days ago


    const timeline = await ContentItem.aggregate([
        {
            $match: {
                user: new mongoose.Types.ObjectId(req.user._id),
                publishDate: { $gte: startDate, $lte: endDate },
            },
        },
        {
            $group: {
                _id: {
                    year: { $year: '$publishDate' },
                    month: { $month: '$publishDate' },
                    day: { $dayOfMonth: '$publishDate' },
                },
                publishedCount: {
                    $sum: { $cond: [{ $eq: ['$status', 'Published'] }, 1, 0] }
                },
                scheduledCount: {
                    $sum: { $cond: [{ $eq: ['$status', 'Scheduled'] }, 1, 0] }
                }
            },
        },
        {
            $project: {
                date: {
                    $dateFromParts: {
                        year: '$_id.year',
                        month: '$_id.month',
                        day: '$_id.day',
                    },
                },
                published: '$publishedCount',
                scheduled: '$scheduledCount',
                _id: 0,
            },
        },
        { $sort: { date: 1 } }, // Sort by date ascending
    ]);
    res.json(timeline);
});


// @desc    Get dashboard stats (total posts, blogs, videos, stories)
// @route   GET /api/analytics/dashboard-stats
// @access  Private
const getDashboardStats = asyncHandler(async (req, res) => {
    const stats = await ContentItem.aggregate([
        { $match: { user: new mongoose.Types.ObjectId(req.user._id) } },
        {
            $group: {
                _id: '$contentType',
                count: { $sum: 1 }
            }
        },
        {
            $group: {
                _id: null, // Group all content types together
                counts: {
                    $push: { k: '$_id', v: '$count' }
                }
            }
        },
        {
            $replaceRoot: {
                newRoot: { $arrayToObject: '$counts' }
            }
        }
    ]);

    const result = {
        Post: stats[0]?.Post || 0,
        Blog: stats[0]?.Blog || 0,
        Video: stats[0]?.Video || 0,
        Story: stats[0]?.Story || 0,
    };

    res.json(result);
});


module.exports = {
    getPlatformDistribution,
    getContentStatusCounts,
    getPublishingTimeline,
    getDashboardStats
};