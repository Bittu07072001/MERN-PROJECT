const crypto  = require('crypto');
const Order   = require('../models/Order');
const { Coupon } = require('../models/index');

// ─── RAZORPAY ─────────────────────────────────────────────────────────────────
exports.createRazorpayOrder = async (req, res) => {
  try {
    const Razorpay = require('razorpay');
    const razorpay = new Razorpay({
      key_id:     process.env.RAZORPAY_KEY_ID,
      key_secret: process.env.RAZORPAY_KEY_SECRET,
    });

    const { amount } = req.body; // amount in paise
    const options = {
      amount:   Math.round(amount * 100),
      currency: 'INR',
      receipt:  'order_' + Date.now(),
    };

    const razorpayOrder = await razorpay.orders.create(options);
    res.json({ success: true, order: razorpayOrder, keyId: process.env.RAZORPAY_KEY_ID });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.verifyRazorpayPayment = async (req, res) => {
  try {
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature, orderId } = req.body;

    const body      = razorpay_order_id + '|' + razorpay_payment_id;
    const expected  = crypto.createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
                            .update(body).digest('hex');

    if (expected !== razorpay_signature)
      return res.status(400).json({ success: false, message: 'Payment verification failed' });

    const order = await Order.findByIdAndUpdate(orderId, {
      paymentStatus: 'paid',
      'paymentDetails.razorpayOrderId':   razorpay_order_id,
      'paymentDetails.razorpayPaymentId': razorpay_payment_id,
      'paymentDetails.paidAt':            new Date(),
      orderStatus: 'confirmed',
    }, { new: true });

    res.json({ success: true, order });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// ─── APPLY COUPON ─────────────────────────────────────────────────────────────
exports.applyCoupon = async (req, res) => {
  try {
    const { code, subtotal } = req.body;
    if (!code) return res.status(400).json({ success: false, message: 'Coupon code required' });

    const coupon = await Coupon.findOne({
      code: code.toUpperCase(), isActive: true, validUntil: { $gt: new Date() },
    });
    if (!coupon) return res.status(404).json({ success: false, message: 'Invalid or expired coupon' });
    if (coupon.usedBy.includes(req.user._id))
      return res.status(400).json({ success: false, message: 'Coupon already used' });
    if (subtotal < coupon.minOrderAmount)
      return res.status(400).json({ success: false, message: `Minimum order ₹${coupon.minOrderAmount} required` });

    const discount = coupon.discountType === 'percentage'
      ? Math.min((subtotal * coupon.discountValue) / 100, coupon.maxDiscountAmount || Infinity)
      : coupon.discountValue;

    res.json({ success: true, discount, coupon: { code: coupon.code, description: coupon.description } });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};
