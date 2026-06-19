const express = require('express');
const router = express.Router();
const Attendance = require('../models/Attendance');
const { protect, adminOnly } = require('../middleware/auth');

// POST /api/attendance - Log attendance (athlete self-log)
router.post('/', protect, async (req, res) => {
  try {
    const { date, status, reason, checkInTime, checkOutTime } = req.body;
    const dayStart = new Date(date);
    dayStart.setHours(0, 0, 0, 0);
    const dayEnd = new Date(date);
    dayEnd.setHours(23, 59, 59, 999);

    // Check if already logged
    const existing = await Attendance.findOne({
      userId: req.user._id,
      date: { $gte: dayStart, $lte: dayEnd },
    });

    if (existing) {
      const updated = await Attendance.findByIdAndUpdate(
        existing._id,
        { status, reason, checkInTime, checkOutTime },
        { new: true }
      );
      return res.json(updated);
    }

    if ((status === 'absent' || status === 'late') && !reason) {
      return res.status(400).json({ message: 'Reason is required for absent or late status' });
    }

    const record = await Attendance.create({
      userId: req.user._id,
      date: new Date(date),
      status,
      reason: reason || '',
      checkInTime: checkInTime || '',
      checkOutTime: checkOutTime || '',
      loggedBy: 'self',
    });
    res.status(201).json(record);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// GET /api/attendance/me?month=&year= - Own attendance
router.get('/me', protect, async (req, res) => {
  try {
    const { month, year } = req.query;
    let query = { userId: req.user._id };
    if (month && year) {
      const start = new Date(year, month - 1, 1);
      const end = new Date(year, month, 0, 23, 59, 59);
      query.date = { $gte: start, $lte: end };
    }
    const records = await Attendance.find(query).sort({ date: -1 });
    res.json(records);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// GET /api/attendance/summary - All members stats (admin)
router.get('/summary', protect, adminOnly, async (req, res) => {
  try {
    const { month, year } = req.query;
    let dateQuery = {};
    if (month && year) {
      const start = new Date(year, month - 1, 1);
      const end = new Date(year, month, 0, 23, 59, 59);
      dateQuery = { date: { $gte: start, $lte: end } };
    }
    const total = await Attendance.countDocuments(dateQuery);
    const present = await Attendance.countDocuments({ ...dateQuery, status: 'present' });
    const absent = await Attendance.countDocuments({ ...dateQuery, status: 'absent' });
    const late = await Attendance.countDocuments({ ...dateQuery, status: 'late' });

    // Top absent reasons
    const reasons = await Attendance.aggregate([
      { $match: { ...dateQuery, status: { $in: ['absent', 'late'] }, reason: { $ne: '' } } },
      { $group: { _id: '$reason', count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: 5 },
    ]);

    res.json({ total, present, absent, late, reasons });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// GET /api/attendance/:userId - A member's attendance (admin)
router.get('/:userId', protect, adminOnly, async (req, res) => {
  try {
    const { month, year } = req.query;
    let query = { userId: req.params.userId };
    if (month && year) {
      const start = new Date(year, month - 1, 1);
      const end = new Date(year, month, 0, 23, 59, 59);
      query.date = { $gte: start, $lte: end };
    }
    const records = await Attendance.find(query).sort({ date: -1 });
    res.json(records);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
