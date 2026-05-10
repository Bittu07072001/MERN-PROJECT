const mongoose = require('mongoose');

const meetingSchema = new mongoose.Schema({
  title: { type: String, required: true, trim: true },
  roomName: { type: String, required: true, unique: true, trim: true },
  date: { type: String, required: true },
  time: { type: String, required: true },
  audience: {
    type: String,
    enum: ['all', 'admin-seller', 'buyer-seller'],
    default: 'all',
  },
  autoApproveJoinRequests: { type: Boolean, default: false },
  joinRequests: [{
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    status: { type: String, enum: ['pending', 'approved', 'rejected'], default: 'pending' },
    requestedAt: { type: Date, default: Date.now },
    decidedAt: { type: Date },
  }],
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
}, { timestamps: true });

meetingSchema.index({ createdAt: -1 });
meetingSchema.index({ audience: 1, createdAt: -1 });

module.exports = mongoose.model('Meeting', meetingSchema);
