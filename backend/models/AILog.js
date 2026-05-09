const mongoose = require('mongoose');

const aiLogSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
  },
  type: {
    type: String,
    enum: ['chat', 'recommendation', 'price_estimate', 'location_suggestion'],
    required: true,
    index: true,
  },
  prompt: {
    type: String,
    default: '',
  },
  response: {
    type: String,
    default: '',
  },
  model: {
    type: String,
    default: 'llama-3.3-70b-versatile',
  },
  property: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Product',
  },
  tokensUsed: {
    type: Number,
    default: 0,
  },
  durationMs: {
    type: Number,
    default: 0,
  },
  success: {
    type: Boolean,
    default: true,
  },
  error: {
    type: String,
  },
  metadata: {
    type: mongoose.Schema.Types.Mixed,
  },
}, { timestamps: true });

aiLogSchema.index({ createdAt: -1 });
aiLogSchema.index({ user: 1, type: 1 });

module.exports = mongoose.model('AILog', aiLogSchema);
