const express = require('express');
const router = express.Router();
const Booking = require('../models/Booking');
const { Notification } = require('../models/index');
const { protect, authorize } = require('../middleware/auth');

// Helper — create a DB notification and push via socket
async function notify(req, { userId, title, message, link }) {
  try {
    const notif = await Notification.create({
      user: userId,
      title,
      message,
      type: 'booking',
      icon: '📅',
      link,
    });
    const io = req.app.get('io');
    if (io) {
      io.to(`user_${userId}`).emit('notification', {
        _id: notif._id,
        title,
        message,
        type: 'booking',
        icon: '📅',
        link,
        isRead: false,
        createdAt: notif.createdAt,
      });
    }
  } catch (e) {
    console.error('Booking notify error:', e.message);
  }
}

const STATUS_MESSAGES = {
  confirmed:  { title: 'Visit Confirmed! 🎉',       message: (p, d, t) => `Your ${p} visit on ${d} at ${t} has been confirmed by our team.` },
  cancelled:  { title: 'Booking Cancelled',          message: (p, d, t) => `Your visit to ${p} on ${d} at ${t} has been cancelled.` },
  completed:  { title: 'Visit Completed ✅',          message: (p, d, t) => `Your visit to ${p} on ${d} is marked as completed. We hope you loved it!` },
  pending:    { title: 'Booking Under Review',        message: (p, d, t) => `Your visit to ${p} on ${d} at ${t} is being reviewed.` },
};

function fmtDate(d) {
  return new Date(d).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
}

// POST /api/bookings — create booking (logged-in users)
router.post('/', protect, async (req, res) => {
  try {
    const { property, name, phone, email, visitDate, visitTime, visitType, message } = req.body;

    if (!property || !name || !phone || !email || !visitDate || !visitTime) {
      return res.status(400).json({ success: false, message: 'All required fields must be provided.' });
    }

    const visit = new Date(visitDate);
    if (visit < new Date()) {
      return res.status(400).json({ success: false, message: 'Visit date must be in the future.' });
    }

    const booking = await Booking.create({
      property,
      user: req.user._id,
      name, phone, email, visitDate: visit, visitTime,
      visitType: visitType || 'site-visit',
      message: message || '',
    });

    const populated = await booking.populate('property', 'name images category');
    const propName = populated.property?.name || 'the property';

    await notify(req, {
      userId: req.user._id,
      title: 'Visit Scheduled! 📅',
      message: `Your ${visitType === 'video-call' ? 'video call' : 'site visit'} for ${propName} on ${fmtDate(visitDate)} at ${visitTime} has been received. We'll confirm shortly.`,
      link: '/bookings',
    });

    const io = req.app.get('io');
    if (io) io.to('admin').emit('admin:newBooking', {
      _id: booking._id,
      name,
      property: populated.property?.name || 'a property',
      visitDate,
      visitTime,
      visitType: visitType || 'site-visit',
      createdAt: booking.createdAt,
    });

    res.status(201).json({ success: true, booking: populated });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// GET /api/bookings/my — get current user's bookings
router.get('/my', protect, async (req, res) => {
  try {
    const bookings = await Booking.find({ user: req.user._id })
      .populate('property', 'name images category price discountPrice')
      .sort('-createdAt');
    res.json({ success: true, bookings });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// PATCH /api/bookings/:id/cancel — cancel own booking
router.patch('/:id/cancel', protect, async (req, res) => {
  try {
    const booking = await Booking.findOne({ _id: req.params.id, user: req.user._id })
      .populate('property', 'name');
    if (!booking) return res.status(404).json({ success: false, message: 'Booking not found.' });
    if (['cancelled', 'completed'].includes(booking.status)) {
      return res.status(400).json({ success: false, message: `Cannot cancel a ${booking.status} booking.` });
    }
    booking.status = 'cancelled';
    await booking.save();

    await notify(req, {
      userId: req.user._id,
      title: 'Booking Cancelled',
      message: `Your visit to ${booking.property?.name || 'the property'} on ${fmtDate(booking.visitDate)} at ${booking.visitTime} has been cancelled.`,
      link: '/bookings',
    });

    res.json({ success: true, booking });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// GET /api/bookings — admin: get all bookings
router.get('/', protect, authorize('admin'), async (req, res) => {
  try {
    const { status, page = 1, limit = 20 } = req.query;
    const filter = status ? { status } : {};
    const total = await Booking.countDocuments(filter);
    const bookings = await Booking.find(filter)
      .populate('property', 'name images category')
      .populate('user', 'name email')
      .sort('-createdAt')
      .skip((page - 1) * limit)
      .limit(Number(limit));
    res.json({ success: true, bookings, total, pages: Math.ceil(total / limit) });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// GET /api/bookings/:id — get single booking (owner or admin)
router.get('/:id', protect, async (req, res) => {
  try {
    const booking = await Booking.findById(req.params.id)
      .populate('property', 'name images category price discountPrice location')
      .populate('user', 'name email');
    if (!booking) return res.status(404).json({ success: false, message: 'Booking not found.' });
    const isOwner = booking.user._id.toString() === req.user._id.toString();
    if (!isOwner && req.user.role !== 'admin') {
      return res.status(403).json({ success: false, message: 'Unauthorized.' });
    }
    res.json({ success: true, booking });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// PATCH /api/bookings/:id/status — admin: update booking status
router.patch('/:id/status', protect, authorize('admin'), async (req, res) => {
  try {
    const { status, adminNote } = req.body;
    const allowed = ['pending', 'confirmed', 'cancelled', 'completed'];
    if (!allowed.includes(status)) {
      return res.status(400).json({ success: false, message: 'Invalid status.' });
    }

    const booking = await Booking.findByIdAndUpdate(
      req.params.id,
      { status, ...(adminNote !== undefined && { adminNote }) },
      { new: true }
    ).populate('property', 'name images category').populate('user', 'name email');

    if (!booking) return res.status(404).json({ success: false, message: 'Booking not found.' });

    const tpl = STATUS_MESSAGES[status];
    if (tpl && booking.user?._id) {
      const propName = booking.property?.name || 'the property';
      await notify(req, {
        userId: booking.user._id,
        title: tpl.title,
        message: tpl.message(propName, fmtDate(booking.visitDate), booking.visitTime),
        link: '/bookings',
      });
    }

    res.json({ success: true, booking });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

module.exports = router;
