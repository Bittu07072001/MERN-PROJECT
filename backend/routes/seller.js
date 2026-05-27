const express = require('express');
const router  = express.Router();
const { protect, authorize } = require('../middleware/auth');
const Product = require('../models/Product');
const Order   = require('../models/Order');

router.use(protect, authorize('seller', 'admin'));

router.get('/dashboard', async (req, res) => {
  try {
    const sellerId = req.user._id;
    const [totalProducts, products] = await Promise.all([
      Product.countDocuments({ seller: sellerId, isActive: true }),
      Product.find({ seller: sellerId, isActive: true }).sort('-createdAt').limit(5),
    ]);
    const sellerOrders = await Order.find({ 'items.seller': sellerId }).sort('-createdAt');
    const revenue = sellerOrders.filter(o => o.paymentStatus === 'paid').reduce((acc, o) => {
      const si = o.items.filter(i => i.seller?.toString() === sellerId.toString());
      return acc + si.reduce((s, i) => s + (i.discountPrice || i.price) * i.quantity, 0);
    }, 0);
    const pendingOrders = sellerOrders.filter(o => ['placed','confirmed','processing'].includes(o.orderStatus)).length;
    res.json({ success: true, stats: { totalProducts, totalOrders: sellerOrders.length, revenue, pendingOrders }, recentProducts: products });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
});

router.get('/orders', async (req, res) => {
  try {
    const { page = 1, limit = 20, status } = req.query;
    const query = { 'items.seller': req.user._id };
    if (status) query.orderStatus = status;
    const total  = await Order.countDocuments(query);
    const orders = await Order.find(query).populate('user', 'name email').sort('-createdAt')
      .skip((page - 1) * limit).limit(Number(limit));
    res.json({ success: true, orders, total });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
});

router.get('/products', async (req, res) => {
  try {
    const { page = 1, limit = 100 } = req.query;
    const total    = await Product.countDocuments({ seller: req.user._id });
    const products = await Product.find({ seller: req.user._id }).sort('-createdAt')
      .skip((page - 1) * limit).limit(Number(limit));
    res.json({ success: true, products, total, page: Number(page), pages: Math.ceil(total / limit) });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
});

router.get('/inventory', async (req, res) => {
  try {
    const lowStock   = await Product.find({ seller: req.user._id, stock: { $lt: 10, $gt: 0 }, isActive: true }).sort('stock');
    const outOfStock = await Product.find({ seller: req.user._id, stock: 0, isActive: true });
    res.json({ success: true, lowStock, outOfStock });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
});

module.exports = router;
