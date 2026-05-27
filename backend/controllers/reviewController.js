const { Review } = require('../models/index');
const Product    = require('../models/Product');
const Order      = require('../models/Order');

exports.createReview = async (req, res) => {
  try {
    const { productId, rating, title, comment, orderId } = req.body;

    const existing = await Review.findOne({ user: req.user._id, product: productId });
    if (existing) return res.status(400).json({ success: false, message: 'You already reviewed this product' });

    let isVerified = false;
    if (orderId) {
      const order = await Order.findOne({
        _id: orderId, user: req.user._id,
        'items.product': productId, orderStatus: 'handover_completed',
      });
      isVerified = !!order;
    }

    const review = await Review.create({
      user: req.user._id, product: productId, order: orderId,
      rating, title, comment, images: req.body.images || [], isVerifiedPurchase: isVerified,
    });

    // Update product rating
    const reviews = await Review.find({ product: productId });
    const avg = reviews.reduce((acc, r) => acc + r.rating, 0) / reviews.length;
    await Product.findByIdAndUpdate(productId, {
      'ratings.average': Math.round(avg * 10) / 10,
      'ratings.count':   reviews.length,
    });

    await review.populate('user', 'name avatar');
    res.status(201).json({ success: true, review });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.getProductReviews = async (req, res) => {
  try {
    const { page = 1, limit = 10, sort = '-createdAt' } = req.query;
    const total   = await Review.countDocuments({ product: req.params.productId });
    const reviews = await Review.find({ product: req.params.productId })
      .populate('user', 'name avatar')
      .sort(sort)
      .skip((page - 1) * limit)
      .limit(Number(limit));

    const ratingDist = await Review.aggregate([
      { $match: { product: require('mongoose').Types.ObjectId.createFromHexString(req.params.productId) } },
      { $group: { _id: '$rating', count: { $sum: 1 } } },
    ]);

    res.json({ success: true, reviews, total, ratingDist });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.markHelpful = async (req, res) => {
  try {
    const review = await Review.findById(req.params.reviewId);
    if (!review) return res.status(404).json({ success: false, message: 'Review not found' });

    const already = review.helpfulBy.some(id => id.toString() === req.user._id.toString());
    if (already) {
      review.helpfulBy = review.helpfulBy.filter(id => id.toString() !== req.user._id.toString());
      review.helpful   = Math.max(0, review.helpful - 1);
    } else {
      review.helpfulBy.push(req.user._id);
      review.helpful += 1;
    }

    await review.save();
    res.json({ success: true, helpful: review.helpful, helpfulBy: review.helpfulBy, marked: !already });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.deleteReview = async (req, res) => {
  try {
    // Fetch the review by ID first so we have the productId regardless of who's deleting
    const review = await Review.findById(req.params.reviewId);
    if (!review) return res.status(404).json({ success: false, message: 'Review not found' });

    // Only the owner or an admin may delete
    const isOwner = review.user.toString() === req.user._id.toString();
    if (!isOwner && req.user.role !== 'admin')
      return res.status(403).json({ success: false, message: 'Unauthorized' });

    const productId = review.product;
    await Review.findByIdAndDelete(req.params.reviewId);

    const reviews = await Review.find({ product: productId });
    const avg = reviews.length ? reviews.reduce((a, r) => a + r.rating, 0) / reviews.length : 0;
    await Product.findByIdAndUpdate(productId, {
      'ratings.average': Math.round(avg * 10) / 10, 'ratings.count': reviews.length,
    });

    res.json({ success: true, message: 'Review deleted' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};
