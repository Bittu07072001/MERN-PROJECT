const crypto  = require('crypto');
const Order   = require('../models/Order');
const { Coupon, Notification } = require('../models/index');
const { sendEmiPaymentEmail } = require('../utils/email');

const RAZORPAY_MAX_AMOUNT = 500000;
const BOOKING_PERCENTAGE = 0.01;
const MIN_BOOKING_AMOUNT = 1000;

const getOnlineBookingAmount = (total = 0) => {
  const normalizedTotal = Math.max(0, Number(total) || 0);
  if (normalizedTotal <= RAZORPAY_MAX_AMOUNT) return Math.round(normalizedTotal);

  return Math.round(Math.min(
    RAZORPAY_MAX_AMOUNT,
    Math.max(MIN_BOOKING_AMOUNT, normalizedTotal * BOOKING_PERCENTAGE),
  ));
};

const addMonths = (date, months) => {
  const next = new Date(date);
  next.setMonth(next.getMonth() + months);
  return next;
};

const getEstimatedEmiAmount = (principal = 0) => {
  const annualRate = 0.085;
  const months = 240;
  const monthlyRate = annualRate / 12;
  const amount = Math.max(0, Number(principal) || 0);
  if (!amount) return 0;
  return Math.round((amount * monthlyRate * ((1 + monthlyRate) ** months)) / (((1 + monthlyRate) ** months) - 1));
};

const notify = async (userId, data, io) => {
  const notif = await Notification.create({ user: userId, ...data });
  if (io) io.to(`user_${userId}`).emit('notification', notif);
  return notif;
};

// ─── RAZORPAY ─────────────────────────────────────────────────────────────────
exports.createRazorpayOrder = async (req, res) => {
  try {
    if (!process.env.RAZORPAY_KEY_ID || !process.env.RAZORPAY_KEY_SECRET) {
      return res.status(503).json({ success: false, message: 'Razorpay is not configured on the server' });
    }

    const Razorpay = require('razorpay');
    const razorpay = new Razorpay({
      key_id:     process.env.RAZORPAY_KEY_ID,
      key_secret: process.env.RAZORPAY_KEY_SECRET,
    });

    const { amount, orderId } = req.body;
    let payableAmount = Number(amount);
    let appOrder = null;

    if (orderId) {
      appOrder = await Order.findOne({ _id: orderId, user: req.user._id });
      if (!appOrder) return res.status(404).json({ success: false, message: 'Order not found' });
      if (appOrder.paymentStatus === 'paid')
        return res.status(400).json({ success: false, message: 'Order is already paid' });

      payableAmount = getOnlineBookingAmount(appOrder.total);
    }

    if (!Number.isFinite(payableAmount) || payableAmount <= 0) {
      return res.status(400).json({ success: false, message: 'Invalid payment amount' });
    }

    const options = {
      amount:   Math.round(payableAmount * 100),
      currency: 'INR',
      receipt:  `order_${appOrder?._id || Date.now()}`.slice(0, 40),
    };

    const razorpayOrder = await razorpay.orders.create(options);

    if (appOrder) {
      appOrder.paymentDetails.razorpayOrderId = razorpayOrder.id;
      appOrder.paymentDetails.amountPaid = payableAmount;
      await appOrder.save();
    }

    res.json({
      success: true,
      order: razorpayOrder,
      keyId: process.env.RAZORPAY_KEY_ID,
      payableAmount,
    });
  } catch (err) {
    res.status(err.statusCode || 500).json({
      success: false,
      message: err.error?.description || err.message || 'Unable to create Razorpay order',
    });
  }
};

exports.verifyRazorpayPayment = async (req, res) => {
  try {
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature, orderId } = req.body;

    const existingOrder = await Order.findOne({ _id: orderId, user: req.user._id });
    if (!existingOrder) return res.status(404).json({ success: false, message: 'Order not found' });
    if (existingOrder.paymentStatus === 'paid') {
      return res.json({ success: true, order: existingOrder });
    }
    if (existingOrder.paymentDetails?.razorpayOrderId !== razorpay_order_id)
      return res.status(400).json({ success: false, message: 'Payment order mismatch' });

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
    }, { new: true }).populate('user', 'name email');

    const io = req.app.get('io');
    await notify(order.user._id || req.user._id, {
      title: 'Order Placed!',
      message: `Your order #${order.orderNumber} has been placed successfully.`,
      type: 'order',
      link: `/orders/${order._id}`,
    }, io);

    if (order.paymentPlan === 'emi' && order.user?.email) {
      const paidAt = order.paymentDetails.paidAt || new Date();
      const paidAmount = order.paymentDetails.amountPaid || getOnlineBookingAmount(order.total);
      const remainingAmount = Math.max(0, order.total - paidAmount);
      await sendEmiPaymentEmail(order.user.email, {
        buyerName: order.user.name,
        orderNumber: order.orderNumber,
        paidAmount,
        paidAt,
        paymentId: razorpay_payment_id,
        nextEmiAmount: getEstimatedEmiAmount(remainingAmount),
        nextEmiDate: addMonths(paidAt, 1),
        remainingAmount,
        tenureMonths: 240,
        annualRate: 8.5,
      });
    }

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
