const express = require('express');
const router  = express.Router();
const ctrl    = require('../controllers/paymentController');
const { protect } = require('../middleware/auth');

router.post('/razorpay/create',  protect, ctrl.createRazorpayOrder);
router.post('/razorpay/verify',  protect, ctrl.verifyRazorpayPayment);
router.post('/apply-coupon',     protect, ctrl.applyCoupon);

module.exports = router;
