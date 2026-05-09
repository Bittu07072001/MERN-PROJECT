const mongoose = require('mongoose');

const bookingSchema = new mongoose.Schema({
  property: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Product',
    required: true,
  },
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  name: { type: String, required: true, trim: true },
  phone: { type: String, required: true, trim: true },
  email: { type: String, required: true, trim: true, lowercase: true },
  visitDate: { type: Date, required: true },
  visitTime: { type: String, required: true },
  visitType: {
    type: String,
    enum: ['site-visit', 'video-call'],
    default: 'site-visit',
  },
  message: { type: String, trim: true, maxlength: 500 },
  status: {
    type: String,
    enum: ['pending', 'confirmed', 'cancelled', 'completed'],
    default: 'pending',
  },
  adminNote: { type: String, trim: true },
}, { timestamps: true });

module.exports = mongoose.model('Booking', bookingSchema);
