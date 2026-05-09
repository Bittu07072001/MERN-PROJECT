const express = require('express');
const router  = express.Router();
const { protect } = require('../middleware/auth');
const { Notification } = require('../models/index');

router.get('/', protect, async (req, res) => {
  try {
    const notifs = await Notification.find({ user: req.user._id }).sort('-createdAt').limit(30);
    const unread = await Notification.countDocuments({ user: req.user._id, isRead: false });
    res.json({ success: true, notifications: notifs, unread });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
});

router.put('/read-all', protect, async (req, res) => {
  try {
    await Notification.updateMany({ user: req.user._id, isRead: false }, { isRead: true });
    res.json({ success: true, message: 'All marked as read' });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
});

router.put('/:id/read', protect, async (req, res) => {
  try {
    await Notification.findOneAndUpdate({ _id: req.params.id, user: req.user._id }, { isRead: true });
    res.json({ success: true });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
});

module.exports = router;
