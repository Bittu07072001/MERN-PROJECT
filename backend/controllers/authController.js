const jwt      = require('jsonwebtoken');
const crypto   = require('crypto');
const speakeasy= require('speakeasy');
const User     = require('../models/User');
const { generateOTP, sendOTPEmail } = require('../utils/email');

const signToken = (id, role) =>
  jwt.sign({ id, role }, process.env.JWT_SECRET, { expiresIn: process.env.JWT_EXPIRE || '7d' });

const signRefreshToken = (id) =>
  jwt.sign({ id }, process.env.JWT_REFRESH_SECRET, { expiresIn: process.env.JWT_REFRESH_EXPIRE || '30d' });

const getLoginRoles = (roles) => {
  const userRoles = roles && roles.length > 0 ? roles : ['customer'];
  return userRoles.includes('seller')
    ? userRoles.filter(role => role !== 'customer')
    : userRoles;
};

// ─── REGISTER ────────────────────────────────────────────────────────────────
exports.register = async (req, res) => {
  try {
    const { name, email, password, role, phone } = req.body;
    if (!name || !email || !password)
      return res.status(400).json({ success: false, message: 'Name, email and password are required' });

    if (await User.findOne({ email }))
      return res.status(400).json({ success: false, message: 'Email already registered' });

    if (phone && await User.findOne({ phone }))
      return res.status(400).json({ success: false, message: 'Phone number already registered' });

    const allowedRoles = ['customer', 'seller', 'admin'];
    // Accept either a single role or an array of roles from the request body
    const requestedRoles = Array.isArray(req.body.roles) ? req.body.roles : (role ? [role] : ['customer']);
    const userRoles = [...new Set(requestedRoles.filter(r => allowedRoles.includes(r)))];
    if (userRoles.length === 0) userRoles.push('customer');
    // Primary/active role is the first selected role
    const userRole = userRoles[0];

    const otp        = generateOTP();
    const otpExpires = new Date(Date.now() + 10 * 60 * 1000);

    console.log(`\n🔑 REGISTRATION OTP for ${email}: ${otp}\n`);

    const user = await User.create({
      name, email, password,
      phone: phone || '',
      role:  userRole,
      roles: userRoles,
      loginOtp:        otp,
      loginOtpExpires: otpExpires,
      loginOtpType:    'email',
      isEmailVerified: false,
    });

    await sendOTPEmail(email, otp, 'register');

    res.status(201).json({
      success: true,
      message: 'OTP sent to your email. Please verify to complete registration.',
      userId:  user._id,
      requireOTPVerification: true,
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// ─── VERIFY REGISTRATION OTP ─────────────────────────────────────────────────
exports.verifyRegistrationOTP = async (req, res) => {
  try {
    const { userId, otp } = req.body;
    const user = await User.findById(userId).select('+loginOtp +loginOtpExpires');

    if (!user) return res.status(404).json({ success: false, message: 'User not found' });
    if (!user.loginOtp || user.loginOtp !== otp)
      return res.status(400).json({ success: false, message: 'Invalid OTP' });
    if (user.loginOtpExpires < new Date())
      return res.status(400).json({ success: false, message: 'OTP expired. Please register again.' });

    user.isEmailVerified = true;
    user.loginOtp        = undefined;
    user.loginOtpExpires = undefined;
    user.lastLogin       = new Date();
    await user.save();

    const userRoles = user.roles && user.roles.length > 0 ? user.roles : [user.role];

    // If multiple roles registered, ask user to pick one to start with
    if (userRoles.length > 1) {
      return res.json({
        success: true,
        message: 'Account verified! Please select a role to continue.',
        requireRoleSelection: true,
        userId: user._id,
        availableRoles: userRoles,
      });
    }

    const token        = signToken(user._id, user.role);
    const refreshToken = signRefreshToken(user._id);
    await User.findByIdAndUpdate(user._id, { refreshToken, isOnline: true });

    res.json({
      success: true,
      message: 'Account verified successfully!',
      token, refreshToken,
      user: { _id: user._id, name: user.name, email: user.email, role: user.role, roles: userRoles, avatar: user.avatar, phone: user.phone },
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// ─── LOGIN ────────────────────────────────────────────────────────────────────
exports.login = async (req, res) => {
  try {
    const { emailOrPhone, password } = req.body;
    if (!emailOrPhone || !password)
      return res.status(400).json({ success: false, message: 'Email/phone and password are required' });

    const isEmail = emailOrPhone.includes('@');
    const user = await User.findOne(
      isEmail ? { email: emailOrPhone.toLowerCase() } : { phone: emailOrPhone }
    ).select('+password +twoFactorSecret +refreshToken');

    if (!user || !(await user.comparePassword(password)))
      return res.status(401).json({ success: false, message: 'Invalid credentials' });
    if (!user.isActive)
      return res.status(403).json({ success: false, message: 'Account deactivated. Contact support.' });
    if (!user.isEmailVerified)
      return res.status(403).json({ success: false, message: 'Email not verified. Please complete registration first.' });

    const otp        = generateOTP();
    const otpExpires = new Date(Date.now() + 10 * 60 * 1000);
    console.log(`\n🔑 LOGIN OTP for ${user.email}: ${otp}\n`);

    await sendOTPEmail(user.email, otp, 'login');
    await User.findByIdAndUpdate(user._id, {
      loginOtp: otp, loginOtpExpires: otpExpires, loginOtpType: 'email',
    });

    res.json({
      success: true,
      requireOTP: true,
      userId:     user._id,
      sentVia:    'email',
      maskedContact: user.email.replace(/(.{2})(.*)(@.*)/, '$1***$3'),
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// ─── VERIFY LOGIN OTP ─────────────────────────────────────────────────────────
exports.verifyLoginOTP = async (req, res) => {
  try {
    const { userId, otp } = req.body;
    const user = await User.findById(userId).select('+loginOtp +loginOtpExpires');

    if (!user) return res.status(404).json({ success: false, message: 'User not found' });
    if (!user.loginOtp || user.loginOtp !== otp)
      return res.status(400).json({ success: false, message: 'Invalid OTP' });
    if (user.loginOtpExpires < new Date())
      return res.status(400).json({ success: false, message: 'OTP expired. Please login again.' });

    user.loginOtp        = undefined;
    user.loginOtpExpires = undefined;
    user.lastLogin       = new Date();
    await user.save();

    // If the user has multiple roles, ask them to pick one before issuing a token
    const userRoles = user.roles && user.roles.length > 0 ? user.roles : [user.role];
    const loginRoles = getLoginRoles(userRoles);
    if (loginRoles.length > 1) {
      return res.json({
        success: true,
        requireRoleSelection: true,
        userId: user._id,
        availableRoles: loginRoles,
      });
    }

    const loginRole = loginRoles[0] || user.role;
    if (user.role !== loginRole) user.role = loginRole;

    const token        = signToken(user._id, loginRole);
    const refreshToken = signRefreshToken(user._id);
    await User.findByIdAndUpdate(user._id, { role: loginRole, refreshToken, isOnline: true });

    res.json({
      success: true, token, refreshToken,
      user: { _id: user._id, name: user.name, email: user.email, role: loginRole, roles: userRoles, avatar: user.avatar, phone: user.phone, preferences: user.preferences },
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// ─── SELECT ROLE (after OTP, for multi-role accounts) ─────────────────────────
exports.selectRole = async (req, res) => {
  try {
    const { userId, role } = req.body;
    if (!userId || !role) return res.status(400).json({ success: false, message: 'userId and role are required' });

    const user = await User.findById(userId).select('+refreshToken');
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });

    const userRoles = user.roles && user.roles.length > 0 ? user.roles : [user.role];
    if (!userRoles.includes(role))
      return res.status(403).json({ success: false, message: `You do not have the '${role}' role` });

    // Update the active role on the user record
    await User.findByIdAndUpdate(user._id, { role });

    const token        = signToken(user._id, role);
    const refreshToken = signRefreshToken(user._id);
    await User.findByIdAndUpdate(user._id, { refreshToken, isOnline: true });

    res.json({
      success: true, token, refreshToken,
      user: { _id: user._id, name: user.name, email: user.email, role, roles: userRoles, avatar: user.avatar, phone: user.phone, preferences: user.preferences },
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// ─── RESEND OTP ───────────────────────────────────────────────────────────────
exports.resendOTP = async (req, res) => {
  try {
    const { userId, purpose = 'login' } = req.body;
    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });

    const otp        = generateOTP();
    const otpExpires = new Date(Date.now() + 10 * 60 * 1000);
    console.log(`\n🔑 RESEND OTP for ${user.email}: ${otp}\n`);

    await sendOTPEmail(user.email, otp, purpose);

    if (purpose === 'reset') {
      await User.findByIdAndUpdate(user._id, { resetOtp: otp, resetOtpExpires: otpExpires });
    } else {
      await User.findByIdAndUpdate(user._id, { loginOtp: otp, loginOtpExpires: otpExpires, loginOtpType: 'email' });
    }

    res.json({ success: true, message: 'OTP resent to your email' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// ─── FORGOT PASSWORD ──────────────────────────────────────────────────────────
exports.forgotPassword = async (req, res) => {
  try {
    const { emailOrPhone } = req.body;
    if (!emailOrPhone) return res.status(400).json({ success: false, message: 'Email or phone required' });

    const isEmail = emailOrPhone.includes('@');
    const user = await User.findOne(
      isEmail ? { email: emailOrPhone.toLowerCase() } : { phone: emailOrPhone }
    );
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });

    const otp        = generateOTP();
    const otpExpires = new Date(Date.now() + 10 * 60 * 1000);
    console.log(`\n🔑 RESET OTP for ${user.email}: ${otp}\n`);

    await User.findByIdAndUpdate(user._id, { resetOtp: otp, resetOtpExpires: otpExpires });
    await sendOTPEmail(user.email, otp, 'reset');

    res.json({
      success: true,
      message: 'OTP sent to your email',
      userId: user._id,
      maskedContact: user.email.replace(/(.{2})(.*)(@.*)/, '$1***$3'),
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// ─── VERIFY RESET OTP ─────────────────────────────────────────────────────────
exports.verifyResetOTP = async (req, res) => {
  try {
    const { userId, otp } = req.body;
    const user = await User.findById(userId).select('+resetOtp +resetOtpExpires');

    if (!user) return res.status(404).json({ success: false, message: 'User not found' });
    if (!user.resetOtp || user.resetOtp !== otp)
      return res.status(400).json({ success: false, message: 'Invalid OTP' });
    if (user.resetOtpExpires < new Date())
      return res.status(400).json({ success: false, message: 'OTP expired' });

    const resetToken  = crypto.randomBytes(32).toString('hex');
    const hashedToken = crypto.createHash('sha256').update(resetToken).digest('hex');

    await User.findByIdAndUpdate(user._id, {
      passwordResetToken:   hashedToken,
      passwordResetExpires: new Date(Date.now() + 15 * 60 * 1000),
      resetOtp:        undefined,
      resetOtpExpires: undefined,
    });

    res.json({ success: true, message: 'OTP verified', resetToken });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// ─── RESET PASSWORD ───────────────────────────────────────────────────────────
exports.resetPassword = async (req, res) => {
  try {
    const hashedToken = crypto.createHash('sha256').update(req.params.token).digest('hex');
    const user = await User.findOne({
      passwordResetToken:   hashedToken,
      passwordResetExpires: { $gt: Date.now() },
    });
    if (!user) return res.status(400).json({ success: false, message: 'Invalid or expired token' });

    user.password            = req.body.password;
    user.passwordResetToken  = undefined;
    user.passwordResetExpires= undefined;
    await user.save();

    res.json({ success: true, message: 'Password reset successful. Please login.' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// ─── REFRESH TOKEN ────────────────────────────────────────────────────────────
exports.refreshToken = async (req, res) => {
  try {
    const { refreshToken } = req.body;
    if (!refreshToken) return res.status(400).json({ success: false, message: 'Refresh token required' });

    const decoded = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET);
    const user    = await User.findById(decoded.id).select('+refreshToken');
    if (!user || user.refreshToken !== refreshToken)
      return res.status(401).json({ success: false, message: 'Invalid refresh token' });

    const token = signToken(user._id, user.role);
    res.json({ success: true, token });
  } catch {
    res.status(401).json({ success: false, message: 'Invalid refresh token' });
  }
};

// ─── GET ME ───────────────────────────────────────────────────────────────────
exports.getMe = async (req, res) => {
  res.json({ success: true, user: req.user });
};

// ─── LOGOUT ───────────────────────────────────────────────────────────────────
exports.logout = async (req, res) => {
  await User.findByIdAndUpdate(req.user._id, { refreshToken: null, isOnline: false });
  res.json({ success: true, message: 'Logged out successfully' });
};

// ─── SETUP 2FA ────────────────────────────────────────────────────────────────
exports.setup2FA = async (req, res) => {
  try {
    const secret = speakeasy.generateSecret({ name: `HomeConnect (${req.user.email})` });
    await User.findByIdAndUpdate(req.user._id, { twoFactorSecret: secret.base32 });
    res.json({ success: true, secret: secret.base32, otpauthUrl: secret.otpauth_url });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// ─── ENABLE 2FA ───────────────────────────────────────────────────────────────
exports.enable2FA = async (req, res) => {
  try {
    const user = await User.findById(req.user._id).select('+twoFactorSecret');
    const ok = speakeasy.totp.verify({
      secret: user.twoFactorSecret, encoding: 'base32',
      token: req.body.otp, window: 1,
    });
    if (!ok) return res.status(400).json({ success: false, message: 'Invalid 2FA OTP' });
    await User.findByIdAndUpdate(req.user._id, { isTwoFactorEnabled: true });
    res.json({ success: true, message: '2FA enabled successfully' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// ─── DISABLE 2FA ──────────────────────────────────────────────────────────────
exports.disable2FA = async (req, res) => {
  try {
    await User.findByIdAndUpdate(req.user._id, { isTwoFactorEnabled: false, twoFactorSecret: undefined });
    res.json({ success: true, message: '2FA disabled' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};
