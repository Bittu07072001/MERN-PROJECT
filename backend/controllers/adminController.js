const User    = require('../models/User');
const Product = require('../models/Product');
const Order   = require('../models/Order');
const Booking = require('../models/Booking');
const { Review, Coupon, Notification } = require('../models/index');
const AILog   = require('../models/AILog');

const MAIN_ADMIN_NAME = 'project2.0';
const MAIN_ADMIN_EMAIL = 'projectchandra420@gmail.com';
const STATUS_QUERY_ALIASES = {
  inquiry_received: ['inquiry_received', 'placed'],
  booking_confirmed: ['booking_confirmed', 'confirmed'],
  documents_verification: ['documents_verification', 'processing'],
  registered: ['registered', 'shipped'],
  handover_completed: ['handover_completed', 'out_for_delivery', 'delivered'],
  cancelled: ['cancelled', 'returned'],
};

const isMainAdmin = (user) => (
  user?.role === 'admin' &&
  String(user?.name || '').trim().toLowerCase() === MAIN_ADMIN_NAME &&
  String(user?.email || '').trim().toLowerCase() === MAIN_ADMIN_EMAIL
);

exports.getDashboard = async (req, res) => {
  try {
    const [totalBuyers, totalSellers, activeBuyers, activeSellers, totalProducts, totalOrders, pendingOrders, revenue, recentOrders, topProducts] =
      await Promise.all([
        User.countDocuments({ role: 'customer' }),
        User.countDocuments({ role: 'seller' }),
        User.countDocuments({ role: 'customer', isActive: true, isOnline: true }),
        User.countDocuments({ role: 'seller', isActive: true, isOnline: true }),
        Product.countDocuments({ isActive: true }),
        Order.countDocuments(),
        Order.countDocuments({ orderStatus: { $in: STATUS_QUERY_ALIASES.inquiry_received } }),
        Order.aggregate([{ $match: { paymentStatus: 'paid' } }, { $group: { _id: null, total: { $sum: '$total' } } }]),
        Order.find().sort('-createdAt').limit(5).populate('user', 'name email').populate('items.product', 'name'),
        Product.find().sort('-soldCount').limit(5).select('name soldCount price images'),
      ]);

    const monthlyRevenue = await Order.aggregate([
      { $match: { paymentStatus: 'paid' } },
      { $group: { _id: { $month: '$createdAt' }, revenue: { $sum: '$total' }, orders: { $sum: 1 } } },
      { $sort: { _id: 1 } },
    ]);

    const categoryRevenue = await Order.aggregate([
      { $unwind: '$items' },
      { $lookup: { from: 'products', localField: 'items.product', foreignField: '_id', as: 'prod' } },
      { $unwind: '$prod' },
      { $group: { _id: '$prod.category', revenue: { $sum: { $multiply: ['$items.discountPrice', '$items.quantity'] } } } },
      { $sort: { revenue: -1 } }, { $limit: 6 },
    ]);

    res.json({
      success: true,
      stats: { totalBuyers, totalSellers, activeBuyers, activeSellers, totalUsers: totalBuyers, totalProducts, totalOrders, pendingOrders, totalRevenue: revenue[0]?.total || 0 },
      recentOrders, topProducts, monthlyRevenue, categoryRevenue,
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// ── Overview stats: buyers, sellers, seller→buyer transactions, seller property counts ──
exports.getOverviewStats = async (req, res) => {
  try {
    const [totalBuyers, totalSellers, pendingProperties, approvedProperties, rejectedProperties] = await Promise.all([
      User.countDocuments({ role: 'customer' }),
      User.countDocuments({ role: 'seller' }),
      Product.countDocuments({ approvalStatus: 'pending' }),
      Product.countDocuments({ approvalStatus: 'approved' }),
      Product.countDocuments({ approvalStatus: 'rejected' }),
    ]);

    // Seller → buyer transactions: bookings with status 'confirmed' or 'completed'
    const sellerBuyerTransactions = await Booking.aggregate([
      { $match: { status: { $in: ['confirmed', 'completed', 'visited'] } } },
      { $lookup: { from: 'products', localField: 'property', foreignField: '_id', as: 'propertyData' } },
      { $unwind: { path: '$propertyData', preserveNullAndEmptyArrays: true } },
      { $lookup: { from: 'users', localField: 'user', foreignField: '_id', as: 'buyerData' } },
      { $unwind: { path: '$buyerData', preserveNullAndEmptyArrays: true } },
      { $lookup: { from: 'users', localField: 'propertyData.seller', foreignField: '_id', as: 'sellerData' } },
      { $unwind: { path: '$sellerData', preserveNullAndEmptyArrays: true } },
      {
        $project: {
          buyerName:    '$buyerData.name',
          buyerEmail:   '$buyerData.email',
          sellerName:   '$sellerData.name',
          sellerEmail:  '$sellerData.email',
          propertyName: '$propertyData.name',
          propertyType: '$propertyData.category',
          status:       1,
          visitDate:    1,
          createdAt:    1,
        }
      },
      { $sort: { createdAt: -1 } },
      { $limit: 50 },
    ]);

    // Per-seller property stats
    const sellerPropertyStats = await Product.aggregate([
      {
        $group: {
          _id:   '$seller',
          total: { $sum: 1 },
          types: { $addToSet: '$category' },
          approved: { $sum: { $cond: [{ $eq: ['$approvalStatus', 'approved'] }, 1, 0] } },
          pending:  { $sum: { $cond: [{ $eq: ['$approvalStatus', 'pending'] },  1, 0] } },
          rejected: { $sum: { $cond: [{ $eq: ['$approvalStatus', 'rejected'] }, 1, 0] } },
        }
      },
      { $lookup: { from: 'users', localField: '_id', foreignField: '_id', as: 'sellerInfo' } },
      { $unwind: { path: '$sellerInfo', preserveNullAndEmptyArrays: true } },
      { $project: { sellerName: '$sellerInfo.name', sellerEmail: '$sellerInfo.email', total: 1, types: 1, approved: 1, pending: 1, rejected: 1 } },
      { $sort: { total: -1 } },
    ]);

    res.json({
      success: true,
      totalBuyers, totalSellers,
      propertyApprovalStats: { pending: pendingProperties, approved: approvedProperties, rejected: rejectedProperties },
      sellerBuyerTransactions,
      sellerPropertyStats,
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.getUsers = async (req, res) => {
  try {
    const { page = 1, limit = 20, role, search } = req.query;
    const query = {};
    if (role)   query.role = role;
    if (search) query.$or = [{ name: new RegExp(search, 'i') }, { email: new RegExp(search, 'i') }];

    const total = await User.countDocuments(query);
    const users = await User.find(query).sort('-createdAt').skip((page - 1) * limit).limit(Number(limit));
    res.json({ success: true, users, total });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.toggleUserStatus = async (req, res) => {
  try {
    const user = await User.findById(req.params.userId);
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });

    if (user.role === 'admin') {
      if (!isMainAdmin(req.user)) {
        return res.status(403).json({ success: false, message: 'Only the main admin can grant admin portal access' });
      }
      if (String(user._id) === String(req.user._id) || isMainAdmin(user)) {
        return res.status(400).json({ success: false, message: 'Main admin access cannot be changed' });
      }
      user.adminApproved = !user.adminApproved;
      if (user.adminApproved) user.isActive = true;
    } else {
      user.isActive = !user.isActive;
    }

    await user.save();
    res.json({ success: true, user });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.deleteUser = async (req, res) => {
  try {
    const user = await User.findById(req.params.userId);
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });

    if (String(user._id) === String(req.user._id)) {
      return res.status(400).json({ success: false, message: 'You cannot delete your own account' });
    }

    if (user.role === 'admin' && !isMainAdmin(req.user)) {
      return res.status(403).json({ success: false, message: 'Only the main admin can delete admins' });
    }

    if (isMainAdmin(user)) {
      return res.status(400).json({ success: false, message: 'Main admin cannot be deleted' });
    }

    await user.deleteOne();
    res.json({ success: true, message: `${user.role === 'admin' ? 'Admin' : 'User'} removed` });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// ── Seller management ──────────────────────────────────────────────────────────
exports.getSellers = async (req, res) => {
  try {
    const { search } = req.query;
    const query = { role: 'seller' };
    if (search) query.$or = [{ name: new RegExp(search, 'i') }, { email: new RegExp(search, 'i') }];
    const sellers = await User.find(query).sort('-createdAt');
    res.json({ success: true, sellers });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.addSeller = async (req, res) => {
  try {
    const { name, email, phone, password } = req.body;
    if (!name || !email || !password)
      return res.status(400).json({ success: false, message: 'Name, email and password are required' });
    if (await User.findOne({ email }))
      return res.status(400).json({ success: false, message: 'Email already registered' });

    // Do NOT pre-hash the password — User model's pre-save hook handles bcrypt hashing.
    // Passing a pre-hashed string would cause double-hashing and break login.
    const seller = await User.create({
      name, email, phone: phone || '',
      password,           // plain text; pre-save hook will hash it
      role:  'seller',
      roles: ['seller'],  // keep roles array consistent with multi-role schema
      isEmailVerified: true,
      isActive: true,
    });
    res.status(201).json({ success: true, seller });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.updateSeller = async (req, res) => {
  try {
    const { name, email, phone, isActive } = req.body;
    const seller = await User.findOneAndUpdate(
      { _id: req.params.sellerId, role: 'seller' },
      { name, email, phone, isActive },
      { new: true }
    );
    if (!seller) return res.status(404).json({ success: false, message: 'Seller not found' });
    res.json({ success: true, seller });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.removeSeller = async (req, res) => {
  try {
    const seller = await User.findOneAndDelete({ _id: req.params.sellerId, role: 'seller' });
    if (!seller) return res.status(404).json({ success: false, message: 'Seller not found' });
    res.json({ success: true, message: 'Seller removed' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// ── Property management (approve/reject/add/edit/delete) ─────────────────────
exports.getAllProducts = async (req, res) => {
  try {
    const { page = 1, limit = 50, search, approvalStatus } = req.query;
    const query = {};
    if (search) query.$or = [{ name: new RegExp(search, 'i') }, { description: new RegExp(search, 'i') }];
    if (approvalStatus) query.approvalStatus = approvalStatus;
    const total    = await Product.countDocuments(query);
    const products = await Product.find(query).populate('seller', 'name email').sort('-createdAt')
      .skip((page - 1) * limit).limit(Number(limit));
    res.json({ success: true, products, total });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.approveProperty = async (req, res) => {
  try {
    const product = await Product.findByIdAndUpdate(
      req.params.id,
      { approvalStatus: 'approved', rejectionReason: '', isActive: true },
      { new: true }
    ).populate('seller', 'name email');
    if (!product) return res.status(404).json({ success: false, message: 'Property not found' });
    res.json({ success: true, product });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.rejectProperty = async (req, res) => {
  try {
    const { reason } = req.body;
    const product = await Product.findByIdAndUpdate(
      req.params.id,
      { approvalStatus: 'rejected', rejectionReason: reason || 'Rejected by admin', isActive: false },
      { new: true }
    ).populate('seller', 'name email');
    if (!product) return res.status(404).json({ success: false, message: 'Property not found' });
    res.json({ success: true, product });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.adminAddProperty = async (req, res) => {
  try {
    const { name, description, price, category, stock, seller } = req.body;
    if (!name || !description || !price || !category || !seller)
      return res.status(400).json({ success: false, message: 'Name, description, price, category and seller are required' });

    const slug = name.toLowerCase().replace(/[^a-z0-9]/g, '-').replace(/-+/g, '-') + '-' + Date.now();
    const product = await Product.create({
      ...req.body, slug,
      approvalStatus: 'approved',
      isActive: true,
    });
    const populated = await product.populate('seller', 'name email');
    res.status(201).json({ success: true, product: populated });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.adminUpdateProperty = async (req, res) => {
  try {
    const product = await Product.findByIdAndUpdate(req.params.id, req.body, { new: true }).populate('seller', 'name email');
    if (!product) return res.status(404).json({ success: false, message: 'Property not found' });
    res.json({ success: true, product });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.adminDeleteProperty = async (req, res) => {
  try {
    const product = await Product.findByIdAndDelete(req.params.id);
    if (!product) return res.status(404).json({ success: false, message: 'Property not found' });
    res.json({ success: true, message: 'Property deleted' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.getAllOrders = async (req, res) => {
  try {
    const { page = 1, limit = 20, status, search } = req.query;
    const query = {};
    if (status) query.orderStatus = { $in: STATUS_QUERY_ALIASES[status] || [status] };
    if (search) query.orderNumber = new RegExp(search, 'i');

    const total  = await Order.countDocuments(query);
    const orders = await Order.find(query)
      .populate('user', 'name email')
      .populate('items.product', 'name')
      .sort('-createdAt')
      .skip((page - 1) * limit)
      .limit(Number(limit));

    res.json({ success: true, orders, total });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.createCoupon = async (req, res) => {
  try {
    const coupon = await Coupon.create({ ...req.body, createdBy: req.user._id });
    res.status(201).json({ success: true, coupon });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
};

exports.getCoupons = async (req, res) => {
  try {
    const coupons = await Coupon.find().sort('-createdAt');
    res.json({ success: true, coupons });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.updateCoupon = async (req, res) => {
  try {
    const coupon = await Coupon.findByIdAndUpdate(req.params.id, req.body, { new: true });
    res.json({ success: true, coupon });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
};

exports.deleteCoupon = async (req, res) => {
  try {
    await Coupon.findByIdAndDelete(req.params.id);
    res.json({ success: true, message: 'Coupon deleted' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.getLiveCounts = async (req, res) => {
  try {
    const [pendingBookings, pendingOrders, pendingProperties] = await Promise.all([
      Booking.countDocuments({ status: 'pending' }),
      Order.countDocuments({ orderStatus: { $in: STATUS_QUERY_ALIASES.inquiry_received } }),
      Product.countDocuments({ approvalStatus: 'pending' }),
    ]);
    res.json({ success: true, pendingBookings, pendingOrders, pendingProperties });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.broadcastNotification = async (req, res) => {
  try {
    const { title, message, type, targetRole } = req.body;
    const query = { isActive: true };
    if (targetRole) query.role = targetRole;

    const users = await User.find(query).select('_id');
    const notifications = users.map(u => ({ user: u._id, title, message, type: type || 'system' }));
    await Notification.insertMany(notifications);

    const io = req.app.get('io');
    if (io) users.forEach(u => io.to(`user_${u._id}`).emit('notification', { title, message, type }));

    res.json({ success: true, message: `Notification sent to ${users.length} users` });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.getAILogs = async (req, res) => {
  try {
    const { page = 1, limit = 20, type } = req.query;
    const filter = type ? { type } : {};

    const [logs, total, stats] = await Promise.all([
      AILog.find(filter)
        .populate('user', 'name email')
        .sort('-createdAt')
        .skip((page - 1) * limit)
        .limit(Number(limit)),
      AILog.countDocuments(filter),
      AILog.aggregate([
        { $group: {
          _id: '$type',
          count: { $sum: 1 },
          totalTokens: { $sum: '$tokensUsed' },
        }},
      ]),
    ]);

    const statsMap = { total: 0, totalTokens: 0 };
    stats.forEach(s => {
      statsMap[s._id] = s.count;
      statsMap.total += s.count;
      statsMap.totalTokens = (statsMap.totalTokens || 0) + s.totalTokens;
    });

    res.json({ success: true, logs, total, stats: statsMap });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};
