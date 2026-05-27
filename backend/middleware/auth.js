const jwt  = require('jsonwebtoken');
const User = require('../models/User');

const MAIN_ADMIN_NAME = 'project2.0';
const MAIN_ADMIN_EMAIL = 'projectchandra420@gmail.com';

const isMainAdmin = (user) => (
  user?.role === 'admin' &&
  String(user?.name || '').trim().toLowerCase() === MAIN_ADMIN_NAME &&
  String(user?.email || '').trim().toLowerCase() === MAIN_ADMIN_EMAIL
);

const hasApprovedAdminAccess = (user) => isMainAdmin(user) || user?.adminApproved === true;

exports.protect = async (req, res, next) => {
  try {
    const token = req.headers.authorization?.startsWith('Bearer ')
      ? req.headers.authorization.split(' ')[1]
      : null;

    if (!token) return res.status(401).json({ success: false, message: 'Not authenticated' });

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user    = await User.findById(decoded.id);
    if (!user || !user.isActive) return res.status(401).json({ success: false, message: 'User not found or deactivated' });

    req.user = user;
    next();
  } catch {
    return res.status(401).json({ success: false, message: 'Invalid or expired token' });
  }
};

exports.authorize = (...roles) => (req, res, next) => {
  const userRoles = req.user.roles && req.user.roles.length > 0 ? req.user.roles : [req.user.role];
  const hasAllowedRole = roles.some(role => req.user.role === role || userRoles.includes(role));

  if (!hasAllowedRole) {
    return res.status(403).json({ success: false, message: 'Access denied' });
  }

  const matchedNonAdminRole = roles.some(role => role !== 'admin' && (req.user.role === role || userRoles.includes(role)));
  if (roles.includes('admin') && userRoles.includes('admin') && !matchedNonAdminRole && !hasApprovedAdminAccess(req.user)) {
    return res.status(403).json({ success: false, message: 'Admin access pending approval from main admin' });
  }

  next();
};

exports.optionalAuth = async (req, res, next) => {
  try {
    const token = req.headers.authorization?.startsWith('Bearer ')
      ? req.headers.authorization.split(' ')[1]
      : null;
    if (token) {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      req.user = await User.findById(decoded.id);
    }
  } catch {}
  next();
};
