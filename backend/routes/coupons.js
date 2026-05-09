const express = require('express');
const router  = express.Router();
const { protect, authorize } = require('../middleware/auth');
const { Coupon } = require('../models/index');

// All coupon routes are admin-only
router.use(protect, authorize('admin'));

router.get('/', async (req, res) => {
  try {
    const coupons = await Coupon.find().sort('-createdAt');
    res.json({ success: true, coupons });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
});

router.post('/', async (req, res) => {
  try {
    const c = await Coupon.create({ ...req.body, createdBy: req.user._id });
    res.status(201).json({ success: true, coupon: c });
  } catch (err) { res.status(400).json({ success: false, message: err.message }); }
});

router.put('/:id', async (req, res) => {
  try {
    const c = await Coupon.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
    if (!c) return res.status(404).json({ success: false, message: 'Coupon not found' });
    res.json({ success: true, coupon: c });
  } catch (err) { res.status(400).json({ success: false, message: err.message }); }
});

router.delete('/:id', async (req, res) => {
  try {
    const c = await Coupon.findByIdAndDelete(req.params.id);
    if (!c) return res.status(404).json({ success: false, message: 'Coupon not found' });
    res.json({ success: true, message: 'Deleted' });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
});

module.exports = router;
