const express = require('express');
const router  = express.Router();
const User    = require('../models/User');
const Product = require('../models/Product');

// Public analytics endpoint — no auth required
router.get('/public', async (req, res) => {
  try {
    const [totalBuyers, totalSellers, totalProperties, approvedProperties] = await Promise.all([
      User.countDocuments({ role: 'customer', isActive: true, isOnline: true }),
      User.countDocuments({ role: 'seller',   isActive: true, isOnline: true }),
      Product.countDocuments({ isActive: true }),
      Product.countDocuments({ approvalStatus: 'approved', isActive: true }),
    ]);

    // Per-seller stats: total properties + breakdown by category
    const sellerStats = await Product.aggregate([
      { $match: { isActive: true, approvalStatus: 'approved' } },
      {
        $group: {
          _id:        '$seller',
          total:      { $sum: 1 },
          sold:       { $sum: '$soldCount' },
          views:      { $sum: '$viewCount' },
          categories: { $push: '$category' },
        }
      },
      { $lookup: { from: 'users', localField: '_id', foreignField: '_id', as: 'sellerInfo' } },
      { $unwind: { path: '$sellerInfo', preserveNullAndEmptyArrays: true } },
      {
        $project: {
          sellerName:  '$sellerInfo.name',
          sellerEmail: '$sellerInfo.email',
          total: 1, sold: 1, views: 1,
          categories: 1,
        }
      },
      { $sort: { total: -1 } },
    ]);

    // Property category distribution
    const categoryDist = await Product.aggregate([
      { $match: { isActive: true } },
      {
        $group: {
          _id:   '$category',
          count: { $sum: 1 },
          sold:  { $sum: '$soldCount' },
          views: { $sum: '$viewCount' },
        }
      },
      { $sort: { count: -1 } },
    ]);

    // Heatmap: seller × category → property count
    const heatmap = await Product.aggregate([
      { $match: { isActive: true } },
      {
        $group: {
          _id:   { seller: '$seller', category: '$category' },
          count: { $sum: 1 },
          sold:  { $sum: '$soldCount' },
        }
      },
      { $lookup: { from: 'users', localField: '_id.seller', foreignField: '_id', as: 'si' } },
      { $unwind: { path: '$si', preserveNullAndEmptyArrays: true } },
      {
        $project: {
          sellerName: '$si.name',
          category:   '$_id.category',
          count: 1,
          sold:  1,
        }
      },
      { $sort: { count: -1 } },
    ]);

    res.json({
      success: true,
      totals: { buyers: totalBuyers, sellers: totalSellers, properties: totalProperties, approvedProperties },
      sellerStats,
      categoryDist,
      heatmap,
    });
  } catch (err) {
    console.error('Analytics error:', err);
    res.status(500).json({ success: false, message: err.message });
  }
});

module.exports = router;
