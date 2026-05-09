const mongoose = require('mongoose');

const orderSchema = new mongoose.Schema({
  orderNumber: { type: String, unique: true },
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  items: [{
    product:      { type: mongoose.Schema.Types.ObjectId, ref: 'Product' },
    name:         String,
    image:        String,
    price:        Number,
    discountPrice:Number,
    quantity:     Number,
    seller:       { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  }],
  shippingAddress: {
    name:    String,
    phone:   String,
    street:  String,
    city:    String,
    state:   String,
    pincode: String,
    country: { type: String, default: 'India' },
  },
  paymentMethod:  { type: String, enum: ['razorpay', 'cod'], required: true },
  paymentStatus:  { type: String, enum: ['pending', 'paid', 'failed', 'refunded'], default: 'pending' },
  paymentDetails: {
    razorpayOrderId:   String,
    razorpayPaymentId: String,
    paidAt:            Date,
  },
  orderStatus: {
    type: String,
    enum: ['placed', 'confirmed', 'processing', 'shipped', 'out_for_delivery', 'delivered', 'cancelled', 'returned'],
    default: 'placed',
  },
  statusHistory: [{
    status:    String,
    message:   String,
    updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    at: { type: Date, default: Date.now },
  }],
  trackingNumber:   String,
  courier:          String,
  estimatedDelivery:Date,
  subtotal:     Number,
  shippingCost: { type: Number, default: 0 },
  discount:     { type: Number, default: 0 },
  couponCode:   String,
  total:        Number,
  notes:        String,
  isReviewed:   { type: Boolean, default: false },
}, { timestamps: true });

orderSchema.pre('save', function (next) {
  if (!this.orderNumber) {
    this.orderNumber = 'ORD-' + Date.now() + '-' + Math.random().toString(36).substring(2, 7).toUpperCase();
  }
  next();
});

module.exports = mongoose.model('Order', orderSchema);
