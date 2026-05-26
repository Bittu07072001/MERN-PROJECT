const Order   = require('../models/Order');
const Product = require('../models/Product');
const { Cart, Notification, Coupon } = require('../models/index');

const notify = async (userId, data, io) => {
  const notif = await Notification.create({ user: userId, ...data });
  if (io) io.to(`user_${userId}`).emit('notification', notif);
  return notif;
};

exports.createOrder = async (req, res) => {
  try {
    const { items, shippingAddress, paymentMethod, paymentPlan, couponCode, notes } = req.body;

    if (!items || items.length === 0)
      return res.status(400).json({ success: false, message: 'No items in order' });
    if (items.length !== 1 || Number(items[0].quantity) !== 1)
      return res.status(400).json({ success: false, message: 'Only one property can be purchased at a time' });
    if (paymentMethod !== 'razorpay' || paymentPlan !== 'emi')
      return res.status(400).json({ success: false, message: 'Properties can only be purchased using EMI payment' });

    let subtotal   = 0;
    const orderItems = [];

    for (const item of items) {
      const product = await Product.findById(item.product);
      if (!product || !product.isActive || product.approvalStatus !== 'approved')
        return res.status(400).json({ success: false, message: `Product not available` });
      if (product.stock < item.quantity)
        return res.status(400).json({ success: false, message: `Insufficient stock for ${product.name}` });

      const price = product.discountPrice > 0 ? product.discountPrice : product.price;
      subtotal += price * item.quantity;
      orderItems.push({
        product: product._id, name: product.name,
        image: product.images[0]?.url || '', price: product.price,
        discountPrice: product.discountPrice, quantity: item.quantity, seller: product.seller,
      });
    }

    let discount = 0;
    let appliedCoupon = null;
    if (couponCode) {
      const coupon = await Coupon.findOne({
        code: couponCode.toUpperCase(), isActive: true, validUntil: { $gt: new Date() },
      });
      if (coupon && !coupon.usedBy.includes(req.user._id) && subtotal >= coupon.minOrderAmount) {
        discount = coupon.discountType === 'percentage'
          ? Math.min((subtotal * coupon.discountValue) / 100, coupon.maxDiscountAmount || Infinity)
          : coupon.discountValue;
        appliedCoupon = coupon;
      }
    }

    const shippingCost = subtotal > 500 ? 0 : 50;
    const total        = subtotal - discount + shippingCost;

    const order = await Order.create({
      user: req.user._id, items: orderItems, shippingAddress,
      paymentMethod, paymentPlan: paymentMethod === 'razorpay' && paymentPlan === 'emi' ? 'emi' : 'full',
      subtotal, shippingCost, discount,
      couponCode: couponCode?.toUpperCase(), total, notes,
      statusHistory: [{ status: 'placed', message: 'Order placed successfully', updatedBy: req.user._id }],
    });

    // Reduce stock
    for (const item of items) {
      await Product.findByIdAndUpdate(item.product, { $inc: { stock: -item.quantity, soldCount: item.quantity } });
    }

    if (appliedCoupon) {
      await Coupon.findByIdAndUpdate(appliedCoupon._id, {
        $push: { usedBy: req.user._id }, $inc: { usedCount: 1 },
      });
    }

    await Cart.findOneAndUpdate({ user: req.user._id }, { items: [] });

    const io = req.app.get('io');
    await notify(req.user._id, {
      title: 'Order Placed! 🎉',
      message: `Your order #${order.orderNumber} has been placed successfully.`,
      type: 'order', link: `/orders/${order._id}`,
    }, io);

    if (io) io.to('admin').emit('admin:newOrder', {
      _id: order._id,
      orderNumber: order.orderNumber,
      total: order.total,
      user: req.user.name || req.user.email,
      itemCount: orderItems.length,
      createdAt: order.createdAt,
    });

    res.status(201).json({ success: true, order });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.getMyOrders = async (req, res) => {
  try {
    const { page = 1, limit = 10, status } = req.query;
    const query = { user: req.user._id };
    if (status) query.orderStatus = status;

    const total  = await Order.countDocuments(query);
    const orders = await Order.find(query)
      .populate('items.product', 'name images')
      .sort('-createdAt')
      .skip((page - 1) * limit)
      .limit(Number(limit));

    res.json({ success: true, orders, total });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.getOrder = async (req, res) => {
  try {
    const order = await Order.findOne({ _id: req.params.id, user: req.user._id })
      .populate('items.product', 'name images slug')
      .populate('items.seller', 'name');
    if (!order) return res.status(404).json({ success: false, message: 'Order not found' });
    res.json({ success: true, order });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.cancelOrder = async (req, res) => {
  try {
    const order = await Order.findOne({ _id: req.params.id, user: req.user._id });
    if (!order) return res.status(404).json({ success: false, message: 'Order not found' });
    if (!['placed', 'confirmed'].includes(order.orderStatus))
      return res.status(400).json({ success: false, message: 'Order cannot be cancelled at this stage' });

    order.orderStatus = 'cancelled';
    order.statusHistory.push({ status: 'cancelled', message: req.body.reason || 'Cancelled by user', updatedBy: req.user._id });
    await order.save();

    for (const item of order.items) {
      await Product.findByIdAndUpdate(item.product, { $inc: { stock: item.quantity } });
    }

    const io = req.app.get('io');
    await notify(req.user._id, {
      title: 'Order Cancelled',
      message: `Order #${order.orderNumber} has been cancelled.`,
      type: 'order',
    }, io);

    res.json({ success: true, order });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.updateOrderStatus = async (req, res) => {
  try {
    const { status, message, trackingNumber, courier, estimatedDelivery } = req.body;
    const order = await Order.findById(req.params.id);
    if (!order) return res.status(404).json({ success: false, message: 'Order not found' });

    order.orderStatus = status;
    order.statusHistory.push({ status, message: message || `Status: ${status}`, updatedBy: req.user._id });
    if (trackingNumber) order.trackingNumber = trackingNumber;
    if (courier)        order.courier        = courier;
    if (estimatedDelivery) order.estimatedDelivery = estimatedDelivery;
    if (status === 'delivered' && order.paymentMethod === 'cod') order.paymentStatus = 'paid';
    await order.save();

    const io = req.app.get('io');
    io?.to(`user_${order.user}`).emit('orderUpdate', { orderId: order._id, status });
    await notify(order.user, {
      title: 'Order Update 📦',
      message: `Order #${order.orderNumber} — ${status.replace(/_/g, ' ')}`,
      type: 'order',
    }, io);

    res.json({ success: true, order });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};
