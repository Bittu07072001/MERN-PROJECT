const express = require('express');
const router  = express.Router();
const ctrl    = require('../controllers/reviewController');
const { protect } = require('../middleware/auth');

router.get('/product/:productId',  ctrl.getProductReviews);
router.post('/',                   protect, ctrl.createReview);
router.put('/:reviewId/helpful',   protect, ctrl.markHelpful);
router.delete('/:reviewId',        protect, ctrl.deleteReview);

module.exports = router;
