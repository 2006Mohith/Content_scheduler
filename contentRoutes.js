const express = require('express');
const router = express.Router();
const {
    createContentItem,
    getAllContentItems,
    getContentItemById,
    updateContentItem,
    deleteContentItem,
} = require('../controllers/contentController');
const { protect } = require('../middlewares/authMiddleware');

// Apply protect middleware to all routes in this file
router.use(protect);

router.route('/')
    .post(createContentItem)
    .get(getAllContentItems);

router.route('/:id')
    .get(getContentItemById)
    .put(updateContentItem)
    .delete(deleteContentItem);

module.exports = router;