const mongoose = require('mongoose');

// ─── CART ─────────────────────────────────────────────────────────────────────
const cartSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, unique: true },
  items: [{
    product:  { type: mongoose.Schema.Types.ObjectId, ref: 'Product' },
    quantity: { type: Number, default: 1, min: 1 },
    addedAt:  { type: Date, default: Date.now },
  }],
}, { timestamps: true });

// ─── WISHLIST ─────────────────────────────────────────────────────────────────
const wishlistSchema = new mongoose.Schema({
  user:     { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, unique: true },
  products: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Product' }],
}, { timestamps: true });

// ─── REVIEW ───────────────────────────────────────────────────────────────────
const reviewSchema = new mongoose.Schema({
  user:    { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  product: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true },
  order:   { type: mongoose.Schema.Types.ObjectId, ref: 'Order' },
  rating:  { type: Number, required: true, min: 1, max: 5 },
  title:   String,
  comment: { type: String, required: true },
  images:  [String],
  isVerifiedPurchase: { type: Boolean, default: false },
  helpful:            { type: Number, default: 0 },
  helpfulBy: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
}, { timestamps: true });
reviewSchema.index({ product: 1, user: 1 }, { unique: true });

// ─── NOTIFICATION ─────────────────────────────────────────────────────────────
const notificationSchema = new mongoose.Schema({
  user:    { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  title:   { type: String, required: true },
  message: { type: String, required: true },
  type:    { type: String, enum: ['order', 'payment', 'promotion', 'system', 'review', 'booking'], default: 'system' },
  isRead:  { type: Boolean, default: false },
  link:    String,
  icon:    String,
}, { timestamps: true });

// ─── COUPON ───────────────────────────────────────────────────────────────────
const couponSchema = new mongoose.Schema({
  code:          { type: String, required: true, unique: true, uppercase: true },
  description:   String,
  discountType:  { type: String, enum: ['percentage', 'fixed'], required: true },
  discountValue: { type: Number, required: true },
  minOrderAmount:   { type: Number, default: 0 },
  maxDiscountAmount: Number,
  usageLimit: { type: Number, default: 100 },
  usedCount:  { type: Number, default: 0 },
  usedBy: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  validFrom:  { type: Date, default: Date.now },
  validUntil: { type: Date, required: true },
  isActive:   { type: Boolean, default: true },
  applicableCategories: [String],
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
}, { timestamps: true });

module.exports = {
  Cart:         mongoose.model('Cart',         cartSchema),
  Wishlist:     mongoose.model('Wishlist',     wishlistSchema),
  Review:       mongoose.model('Review',       reviewSchema),
  Notification: mongoose.model('Notification', notificationSchema),
  Coupon:       mongoose.model('Coupon',       couponSchema),
};
