// wishlist.js
const express = require('express');
const router  = express.Router();
const ctrl    = require('../controllers/cartController');
const { protect } = require('../middleware/auth');

router.get('/',         protect, ctrl.getWishlist);
router.post('/toggle',  protect, ctrl.toggleWishlist);

module.exports = router;
