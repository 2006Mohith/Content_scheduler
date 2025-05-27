const express = require('express');
const router = express.Router();
const {
    getUserDetails,
    updateUserProfile,
    updateUserPassword,
    getUserSettings,
    updateUserSettings,
} = require('../controllers/userController');
const { protect } = require('../middlewares/authMiddleware');

router.use(protect); // Protect all user routes

router.route('/details').get(getUserDetails); // Renamed from /profile to avoid conflict with /api/auth/profile
router.route('/profile/update').put(updateUserProfile);
router.route('/password/update').put(updateUserPassword);

router.route('/settings')
    .get(getUserSettings)
    .put(updateUserSettings);

module.exports = router;