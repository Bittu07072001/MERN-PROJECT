const mongoose = require('mongoose');

const productSchema = new mongoose.Schema({
  name:             { type: String, required: true, trim: true },
  slug:             { type: String, unique: true },
  description:      { type: String, required: true },
  shortDescription: String,
  price:            { type: Number, required: true, min: 0 },
  discountPrice:    { type: Number, default: 0 },
  discountPercent:  { type: Number, default: 0 },
  category:         { type: String, required: true },
  subcategory:      String,
  brand:            String,
  location: {
    address: { type: String, trim: true },
    city: { type: String, trim: true },
    state: { type: String, trim: true },
    pincode: { type: String, trim: true },
    lat: { type: Number },
    lng: { type: Number },
    placeId: { type: String, trim: true },
  },
  seller: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  images: [{ url: String, publicId: String }],
  videos: [{ url: String, title: String }],
  stock:  { type: Number, required: true, default: 0 },
  unit:   { type: String, default: 'piece' },
  attributes: [{ key: String, value: String }],
  tags:      [String],
  ratings: {
    average: { type: Number, default: 0 },
    count:   { type: Number, default: 0 },
  },
  isActive:       { type: Boolean, default: true },
  approvalStatus: { type: String, enum: ['pending', 'approved', 'rejected'], default: 'pending' },
  rejectionReason:{ type: String, default: '' },
  isFeatured: { type: Boolean, default: false },
  isTrending: { type: Boolean, default: false },
  viewCount: { type: Number, default: 0 },
  soldCount: { type: Number, default: 0 },
  shippingInfo: {
    freeShipping: Boolean,
    shippingCost: Number,
    deliveryDays:  Number,
  },
}, { timestamps: true });

productSchema.index({ name: 'text', description: 'text', tags: 'text', brand: 'text', 'location.city': 'text' });
productSchema.index({ category: 1, price: 1 });
productSchema.index({ seller: 1 });
productSchema.index({ 'location.city': 1 });
productSchema.index({ 'location.lat': 1, 'location.lng': 1 });

productSchema.pre('save', function (next) {
  if (this.isModified('name') && !this.slug) {
    const base = this.name.toLowerCase().replace(/[^a-z0-9]/g, '-').replace(/-+/g, '-').replace(/^-|-$/g, '');
    // Append a short random suffix to prevent slug collisions between products with the same name
    this.slug = base + '-' + Math.random().toString(36).slice(2, 7);
  }
  if (this.discountPrice > 0 && this.price > 0) {
    this.discountPercent = Math.round(((this.price - this.discountPrice) / this.price) * 100);
  }
  next();
});

module.exports = mongoose.model('Product', productSchema);
