const express = require('express');
const Meeting = require('../models/Meeting');
const { protect, authorize } = require('../middleware/auth');

const router = express.Router();

const meetingPath = (meeting) =>
  `/meeting/${encodeURIComponent(meeting.roomName)}?audience=${encodeURIComponent(meeting.audience)}`;

const canJoinAudience = (role, audience) => {
  if (audience === 'admin-seller') return ['admin', 'seller'].includes(role);
  if (audience === 'buyer-seller') return ['customer', 'seller'].includes(role);
  return ['admin', 'seller', 'customer'].includes(role);
};

const joinableAudienceFilter = (role) => {
  if (role === 'admin') return { audience: { $in: ['all', 'admin-seller'] } };
  if (role === 'customer') return { audience: { $in: ['all', 'buyer-seller'] } };
  return {};
};

const findMeetingByRoom = (roomName) => Meeting.findOne({ roomName: decodeURIComponent(roomName) });

const requestForUser = (meeting, userId) =>
  meeting.joinRequests?.find(req => req.user?._id?.toString?.() === userId.toString() || req.user?.toString() === userId.toString());

const requesterRolesFor = (audience) => {
  if (audience === 'buyer-seller') return ['customer'];
  if (audience === 'admin-seller') return ['seller'];
  if (audience === 'all') return ['customer', 'seller'];
  return [];
};

const approverRoleFor = (audience) => {
  if (audience === 'buyer-seller') return 'seller';
  if (['admin-seller', 'all'].includes(audience)) return 'admin';
  return null;
};

router.post('/', protect, authorize('admin'), async (req, res) => {
  try {
    const { title, roomName, date, time, audience = 'all' } = req.body;
    if (!title || !roomName || !date || !time) {
      return res.status(400).json({ success: false, message: 'Title, room, date and time are required.' });
    }

    const meeting = await Meeting.create({
      title,
      roomName,
      date,
      time,
      audience,
      createdBy: req.user._id,
    });

    res.status(201).json({ success: true, meeting: { ...meeting.toObject(), link: meetingPath(meeting) } });
  } catch (err) {
    if (err.code === 11000) {
      return res.status(409).json({ success: false, message: 'Meeting room already exists. Please try again.' });
    }
    res.status(500).json({ success: false, message: 'Could not schedule meeting.' });
  }
});

router.get('/', protect, authorize('admin'), async (req, res) => {
  try {
    const meetings = await Meeting.find().sort('-createdAt').limit(20);
    res.json({ success: true, meetings: meetings.map(meeting => ({ ...meeting.toObject(), link: meetingPath(meeting) })) });
  } catch {
    res.status(500).json({ success: false, message: 'Could not load meetings.' });
  }
});

router.delete('/:id', protect, authorize('admin'), async (req, res) => {
  try {
    const meeting = await Meeting.findByIdAndDelete(req.params.id);
    if (!meeting) {
      return res.status(404).json({ success: false, message: 'Meeting not found.' });
    }

    res.json({ success: true, message: 'Meeting deleted.' });
  } catch {
    res.status(500).json({ success: false, message: 'Could not delete meeting.' });
  }
});

router.patch('/:id/auto-approve', protect, authorize('admin'), async (req, res) => {
  try {
    const meeting = await Meeting.findById(req.params.id);
    if (!meeting) {
      return res.status(404).json({ success: false, message: 'Meeting not found.' });
    }

    meeting.autoApproveJoinRequests = Boolean(req.body.enabled);
    if (meeting.autoApproveJoinRequests) {
      meeting.joinRequests.forEach(request => {
        if (request.status === 'pending') {
          request.status = 'approved';
          request.decidedAt = new Date();
        }
      });
    }

    await meeting.save();
    res.json({
      success: true,
      meeting: { ...meeting.toObject(), link: meetingPath(meeting) },
    });
  } catch {
    res.status(500).json({ success: false, message: 'Could not update auto join setting.' });
  }
});

router.get('/latest', protect, authorize('admin', 'seller', 'customer'), async (req, res) => {
  try {
    const filter = joinableAudienceFilter(req.user.role);
    const meeting = await Meeting.findOne(filter).sort('-createdAt');

    if (!meeting || !canJoinAudience(req.user.role, meeting.audience)) {
      return res.json({ success: true, meeting: null });
    }

    res.json({ success: true, meeting: { ...meeting.toObject(), link: meetingPath(meeting) } });
  } catch {
    res.status(500).json({ success: false, message: 'Could not load latest meeting.' });
  }
});

router.get('/room/:roomName/join-status', protect, authorize('admin', 'seller', 'customer'), async (req, res) => {
  try {
    const meeting = await findMeetingByRoom(req.params.roomName);
    if (!meeting) return res.status(404).json({ success: false, message: 'Meeting not found.' });
    if (!canJoinAudience(req.user.role, meeting.audience)) {
      return res.status(403).json({ success: false, message: 'Access denied.' });
    }

    const requesterRoles = requesterRolesFor(meeting.audience);
    if (!requesterRoles.includes(req.user.role)) {
      return res.json({ success: true, status: 'approved', approved: true });
    }

    const joinRequest = requestForUser(meeting, req.user._id);
    res.json({
      success: true,
      status: joinRequest?.status || 'none',
      approved: joinRequest?.status === 'approved',
    });
  } catch {
    res.status(500).json({ success: false, message: 'Could not load meeting access status.' });
  }
});

router.post('/room/:roomName/join-request', protect, authorize('customer', 'seller'), async (req, res) => {
  try {
    const meeting = await findMeetingByRoom(req.params.roomName);
    if (!meeting) return res.status(404).json({ success: false, message: 'Meeting not found.' });
    const requesterRoles = requesterRolesFor(meeting.audience);
    if (requesterRoles.length === 0) {
      return res.status(400).json({ success: false, message: 'Join approval is not required for this meeting.' });
    }
    if (!requesterRoles.includes(req.user.role)) {
      return res.status(403).json({ success: false, message: 'This account does not need join approval for this meeting.' });
    }

    const nextStatus = meeting.autoApproveJoinRequests ? 'approved' : 'pending';
    const existing = requestForUser(meeting, req.user._id);
    if (existing) {
      if (existing.status === 'rejected') {
        existing.status = nextStatus;
        existing.requestedAt = new Date();
        existing.decidedAt = nextStatus === 'approved' ? new Date() : undefined;
      }
    } else {
      meeting.joinRequests.push({
        user: req.user._id,
        status: nextStatus,
        decidedAt: nextStatus === 'approved' ? new Date() : undefined,
      });
    }

    await meeting.save();
    const joinRequest = requestForUser(meeting, req.user._id);
    res.json({ success: true, status: joinRequest.status, approved: joinRequest.status === 'approved' });
  } catch {
    res.status(500).json({ success: false, message: 'Could not request meeting access.' });
  }
});

router.get('/room/:roomName/join-requests', protect, authorize('admin', 'seller'), async (req, res) => {
  try {
    const meeting = await findMeetingByRoom(req.params.roomName).populate('joinRequests.user', 'name email role');
    if (!meeting) return res.status(404).json({ success: false, message: 'Meeting not found.' });
    const approverRole = approverRoleFor(meeting.audience);
    if (!approverRole) {
      return res.json({ success: true, requests: [], autoApproveJoinRequests: meeting.autoApproveJoinRequests });
    }
    if (req.user.role !== approverRole) {
      return res.status(403).json({ success: false, message: 'Access denied.' });
    }

    const requests = (meeting.joinRequests || [])
      .filter(req => req.status === 'pending')
      .map(req => ({
        user: req.user,
        status: req.status,
        requestedAt: req.requestedAt,
      }));

    res.json({ success: true, requests, autoApproveJoinRequests: meeting.autoApproveJoinRequests });
  } catch {
    res.status(500).json({ success: false, message: 'Could not load join requests.' });
  }
});

router.patch('/room/:roomName/auto-approve', protect, authorize('admin', 'seller'), async (req, res) => {
  try {
    const meeting = await findMeetingByRoom(req.params.roomName);
    if (!meeting) return res.status(404).json({ success: false, message: 'Meeting not found.' });
    const approverRole = approverRoleFor(meeting.audience);
    if (!approverRole) {
      return res.status(400).json({ success: false, message: 'Approval is not available for this meeting.' });
    }
    if (req.user.role !== approverRole) {
      return res.status(403).json({ success: false, message: 'Access denied.' });
    }

    meeting.autoApproveJoinRequests = Boolean(req.body.enabled);
    if (meeting.autoApproveJoinRequests) {
      meeting.joinRequests.forEach(request => {
        if (request.status === 'pending') {
          request.status = 'approved';
          request.decidedAt = new Date();
        }
      });
    }

    await meeting.save();
    res.json({ success: true, autoApproveJoinRequests: meeting.autoApproveJoinRequests });
  } catch {
    res.status(500).json({ success: false, message: 'Could not update auto join setting.' });
  }
});

router.patch('/room/:roomName/join-requests/:userId', protect, authorize('admin', 'seller'), async (req, res) => {
  try {
    const { status } = req.body;
    if (!['approved', 'rejected'].includes(status)) {
      return res.status(400).json({ success: false, message: 'Status must be approved or rejected.' });
    }

    const meeting = await findMeetingByRoom(req.params.roomName);
    if (!meeting) return res.status(404).json({ success: false, message: 'Meeting not found.' });
    const approverRole = approverRoleFor(meeting.audience);
    if (!approverRole) {
      return res.status(400).json({ success: false, message: 'Approval is not available for this meeting.' });
    }
    if (req.user.role !== approverRole) {
      return res.status(403).json({ success: false, message: 'Access denied.' });
    }

    const joinRequest = requestForUser(meeting, req.params.userId);
    if (!joinRequest) return res.status(404).json({ success: false, message: 'Join request not found.' });

    joinRequest.status = status;
    joinRequest.decidedAt = new Date();
    await meeting.save();

    res.json({ success: true, status });
  } catch {
    res.status(500).json({ success: false, message: 'Could not update join request.' });
  }
});

module.exports = router;
