const express = require('express');
const router = express.Router();
const Message = require('../models/Message');
const User = require('../models/User');
const { Notification } = require('../models/index');
const { protect } = require('../middleware/auth');

function getConversationId(id1, id2) {
  return [id1.toString(), id2.toString()].sort().join('_');
}

function isBuyerToBuyer(sender, receiver) {
  return sender?.role === 'customer' && receiver?.role === 'customer';
}

// IMPORTANT: /unread/count MUST come before /:receiverId to avoid "unread" being treated as a receiverId
router.get('/unread/count', protect, async (req, res) => {
  try {
    const count = await Message.countDocuments({ receiver: req.user._id, isRead: false });
    res.json({ success: true, count });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// List every active buyer, seller, and admin except the current user so a chat can be started directly.
router.get('/users', protect, async (req, res) => {
  try {
    const { search = '', role = '' } = req.query;
    const query = {
      _id: { $ne: req.user._id },
      isActive: true,
    };

    if (req.user.role === 'customer') {
      query.role = { $ne: 'customer' };
    }

    if (role && ['customer', 'seller', 'admin'].includes(role)) {
      if (req.user.role === 'customer' && role === 'customer') {
        return res.json({ success: true, users: [] });
      }
      query.$or = [{ role }, { roles: role }];
    }

    if (search.trim()) {
      const rx = new RegExp(search.trim().replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i');
      query.$and = [
        ...(query.$and || []),
        { $or: [{ name: rx }, { email: rx }, { phone: rx }, { role: rx }] },
      ];
    }

    const users = await User.find(query)
      .select('name email avatar role roles isOnline')
      .sort({ isOnline: -1, name: 1 })
      .limit(100);

    res.json({ success: true, users });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

router.get('/users/:userId', protect, async (req, res) => {
  try {
    const user = await User.findOne({ _id: req.params.userId, isActive: true })
      .select('name email avatar role roles isOnline');

    if (!user) return res.status(404).json({ success: false, message: 'User not found' });
    if (isBuyerToBuyer(req.user, user)) {
      return res.status(403).json({ success: false, message: 'Buyers cannot message other buyers' });
    }
    res.json({ success: true, user });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

router.get('/conversations', protect, async (req, res) => {
  try {
    const userId = req.user._id;

    const conversations = await Message.aggregate([
      {
        $match: {
          $or: [{ sender: userId }, { receiver: userId }],
        },
      },
      { $sort: { createdAt: -1 } },
      {
        $group: {
          _id: '$conversation',
          lastMessage: { $first: '$$ROOT' },
          unreadCount: {
            $sum: {
              $cond: [{ $and: [{ $eq: ['$receiver', userId] }, { $eq: ['$isRead', false] }] }, 1, 0],
            },
          },
        },
      },
      { $sort: { 'lastMessage.createdAt': -1 } },
      { $limit: 30 },
    ]);

    const populated = await Message.populate(conversations, [
      { path: 'lastMessage.sender', model: User, select: 'name email avatar role isOnline' },
      { path: 'lastMessage.receiver', model: User, select: 'name email avatar role isOnline' },
      { path: 'lastMessage.property', select: 'name images category' },
    ]);

    res.json({ success: true, conversations: populated });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

router.get('/:receiverId', protect, async (req, res) => {
  try {
    const { page = 1, limit = 30 } = req.query;
    const userId = req.user._id;
    const receiver = await User.findOne({ _id: req.params.receiverId, isActive: true }).select('role');
    if (!receiver) return res.status(404).json({ success: false, message: 'Receiver not found' });
    if (isBuyerToBuyer(req.user, receiver)) {
      return res.status(403).json({ success: false, message: 'Buyers cannot message other buyers' });
    }

    const conversationId = getConversationId(userId, req.params.receiverId);

    const messages = await Message.find({ conversation: conversationId })
      .populate('sender', 'name email avatar role isOnline')
      .populate('receiver', 'name email avatar role isOnline')
      .populate('property', 'name images')
      .sort('-createdAt')
      .skip((page - 1) * limit)
      .limit(Number(limit));

    await Message.updateMany(
      { conversation: conversationId, receiver: userId, isRead: false },
      { isRead: true, readAt: new Date() }
    );

    res.json({ success: true, messages: messages.reverse() });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

router.post('/', protect, async (req, res) => {
  try {
    const { receiverId, text, propertyId } = req.body;
    if (!receiverId || !text?.trim()) {
      return res.status(400).json({ success: false, message: 'Receiver and message text are required' });
    }
    if (receiverId.toString() === req.user._id.toString()) {
      return res.status(400).json({ success: false, message: 'You cannot message yourself' });
    }

    const receiver = await User.findOne({ _id: receiverId, isActive: true }).select('role');
    if (!receiver) {
      return res.status(404).json({ success: false, message: 'Receiver not found' });
    }
    if (isBuyerToBuyer(req.user, receiver)) {
      return res.status(403).json({ success: false, message: 'Buyers cannot message other buyers' });
    }

    const conversationId = getConversationId(req.user._id, receiverId);

    const message = await Message.create({
      conversation: conversationId,
      sender: req.user._id,
      receiver: receiverId,
      text: text.trim(),
      property: propertyId || undefined,
    });

    const populated = await message.populate([
      { path: 'sender', select: 'name email avatar role isOnline' },
      { path: 'receiver', select: 'name email avatar role isOnline' },
      { path: 'property', select: 'name images category' },
    ]);

    const io = req.app.get('io');
    if (io) {
      io.to(`user_${receiverId}`).emit('newMessage', populated);
      io.to(`user_${req.user._id}`).emit('newMessage', populated);
    }

    try {
      await Notification.create({
        user: receiverId,
        title: `New message from ${req.user.name}`,
        message: text.trim().substring(0, 80),
        type: 'system',
        icon: '💬',
        link: `${receiver.role === 'admin' ? '/admin/chat' : receiver.role === 'seller' ? '/seller/chat' : '/chat'}/${req.user._id}`,
      });
      if (io) {
        io.to(`user_${receiverId}`).emit('notification', {
          title: `New message from ${req.user.name}`,
          message: text.trim().substring(0, 80),
          type: 'system',
          icon: '💬',
        });
      }
    } catch {}

    res.status(201).json({ success: true, message: populated });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

module.exports = router;
