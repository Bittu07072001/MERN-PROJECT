const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
  name:  { type: String, required: true, trim: true },
  email: { type: String, required: true, unique: true, lowercase: true },
  password: { type: String, required: true, minlength: 6, select: false },
  // Active role for the current session (set on login)
  role: { type: String, enum: ['customer', 'seller', 'admin'], default: 'customer' },
  // All roles this account holds
  roles: { type: [String], enum: ['customer', 'seller', 'admin'], default: ['customer'] },
  avatar: { type: String, default: '' },
  phone:  { type: String, default: '' },
  googleId: { type: String, default: '', index: true },
  authProvider: { type: String, enum: ['local', 'google'], default: 'local' },
  isPhoneVerified: { type: Boolean, default: false },

  addresses: [{
    label:   String,
    street:  String,
    city:    String,
    state:   String,
    pincode: String,
    country: { type: String, default: 'India' },
    isDefault: { type: Boolean, default: false },
  }],

  isEmailVerified:     { type: Boolean, default: false },
  isTwoFactorEnabled:  { type: Boolean, default: false },
  adminApproved:       { type: Boolean, default: false },
  twoFactorSecret:     { type: String, select: false },

  emailVerificationToken: String,
  passwordResetToken:     String,
  passwordResetExpires:   Date,

  // OTP for login / registration
  loginOtp:        { type: String, select: false },
  loginOtpExpires: { type: Date,   select: false },
  loginOtpType:    { type: String, enum: ['email', 'sms'], select: false },

  // OTP for password reset
  resetOtp:        { type: String, select: false },
  resetOtpExpires: { type: Date,   select: false },

  lastLogin: Date,
  isActive:  { type: Boolean, default: true },
  isOnline:  { type: Boolean, default: false },

  viewedProducts: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Product' }],
  searchHistory:  [{ query: String, at: { type: Date, default: Date.now } }],

  preferences: {
    categories: [String],
    priceRange: { min: Number, max: Number },
    darkMode: { type: Boolean, default: false },
  },

  refreshToken: { type: String, select: false },
}, { timestamps: true });

userSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next();
  this.password = await bcrypt.hash(this.password, 12);
  next();
});

userSchema.methods.comparePassword = async function (candidate) {
  return bcrypt.compare(candidate, this.password);
};

module.exports = mongoose.model('User', userSchema);

// Sparse index: allows multiple docs with empty/null phone while still enforcing uniqueness for non-empty values
// (defined outside schema to avoid Mongoose merging it with the field definition)
