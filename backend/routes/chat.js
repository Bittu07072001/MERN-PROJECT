const express = require('express');
const router = express.Router();
const Message = require('../models/Message');
const { Notification } = require('../models/index');
const { protect } = require('../middleware/auth');

function getConversationId(id1, id2) {
  return [id1.toString(), id2.toString()].sort().join('_');
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
      { path: 'lastMessage.sender', select: 'name avatar' },
      { path: 'lastMessage.receiver', select: 'name avatar' },
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
    const conversationId = getConversationId(userId, req.params.receiverId);

    const messages = await Message.find({ conversation: conversationId })
      .populate('sender', 'name avatar')
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

    const conversationId = getConversationId(req.user._id, receiverId);

    const message = await Message.create({
      conversation: conversationId,
      sender: req.user._id,
      receiver: receiverId,
      text: text.trim(),
      property: propertyId || undefined,
    });

    const populated = await message.populate([
      { path: 'sender', select: 'name avatar' },
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
        link: `/chat/${req.user._id}`,
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
