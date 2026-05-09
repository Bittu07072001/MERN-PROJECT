const express = require('express');
const router  = express.Router();
const { protect } = require('../middleware/auth');
const User = require('../models/User');

router.get('/profile', protect, (req, res) => res.json({ success: true, user: req.user }));

router.put('/profile', protect, async (req, res) => {
  try {
    const allowed = ['name', 'phone', 'avatar', 'preferences'];
    const data = {};
    allowed.forEach(f => { if (req.body[f] !== undefined) data[f] = req.body[f]; });
    const user = await User.findByIdAndUpdate(req.user._id, data, { new: true });
    res.json({ success: true, user });
  } catch (err) { res.status(400).json({ success: false, message: err.message }); }
});

router.put('/change-password', protect, async (req, res) => {
  try {
    const user = await User.findById(req.user._id).select('+password');
    if (!(await user.comparePassword(req.body.currentPassword)))
      return res.status(400).json({ success: false, message: 'Current password incorrect' });
    user.password = req.body.newPassword;
    await user.save();
    res.json({ success: true, message: 'Password changed' });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
});

router.post('/address', protect, async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    if (req.body.isDefault) user.addresses.forEach(a => a.isDefault = false);
    user.addresses.push(req.body);
    await user.save();
    res.json({ success: true, addresses: user.addresses });
  } catch (err) { res.status(400).json({ success: false, message: err.message }); }
});

router.put('/address/:idx', protect, async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    if (!user.addresses[req.params.idx]) return res.status(404).json({ success: false, message: 'Address not found' });
    if (req.body.isDefault) user.addresses.forEach(a => a.isDefault = false);
    user.addresses[req.params.idx] = { ...user.addresses[req.params.idx].toObject(), ...req.body };
    await user.save();
    res.json({ success: true, addresses: user.addresses });
  } catch (err) { res.status(400).json({ success: false, message: err.message }); }
});

router.delete('/address/:idx', protect, async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    user.addresses.splice(req.params.idx, 1);
    await user.save();
    res.json({ success: true, addresses: user.addresses });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
});

module.exports = router;
