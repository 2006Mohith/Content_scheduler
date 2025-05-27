const express = require('express');
const router = express.Router();
const {
    getPlatformDistribution,
    getContentStatusCounts,
    getPublishingTimeline,
    getDashboardStats
} = require('../controllers/analyticsController');
const { protect } = require('../middlewares/authMiddleware');

router.use(protect); // Protect all analytics routes

router.get('/platform-distribution', getPlatformDistribution);
router.get('/status-counts', getContentStatusCounts);
router.get('/publishing-timeline', getPublishingTimeline);
router.get('/dashboard-stats', getDashboardStats);


module.exports = router;