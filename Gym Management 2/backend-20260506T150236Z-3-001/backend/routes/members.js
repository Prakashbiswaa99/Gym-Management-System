const express = require('express');
const router = express.Router();
const Member = require('../models/Member');
const User = require('../models/User');
const { protect, adminOnly } = require('../middleware/auth');

// GET /api/members - All members (admin)
router.get('/', protect, adminOnly, async (req, res) => {
  try {
    const { status, search, membershipType } = req.query;
    let query = {};
    if (status) query.status = status;
    if (membershipType) query.membershipType = membershipType;

    let members = await Member.find(query)
      .populate('userId', 'name email avatar createdAt')
      .sort({ createdAt: -1 });

    // Filter by name/email search
    if (search) {
      const s = search.toLowerCase();
      members = members.filter(
        (m) =>
          m.userId?.name?.toLowerCase().includes(s) ||
          m.userId?.email?.toLowerCase().includes(s)
      );
    }

    res.json(members);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// GET /api/members/stats - Dashboard stats (admin)
router.get('/stats', protect, adminOnly, async (req, res) => {
  try {
    const total = await Member.countDocuments();
    const active = await Member.countDocuments({ status: 'active' });
    const expired = await Member.countDocuments({ status: 'expired' });
    const pending = await Member.countDocuments({ status: 'pending' });
    const premium = await Member.countDocuments({ membershipType: 'premium' });
    res.json({ total, active, expired, pending, premium });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// GET /api/members/me - Own member profile (athlete)
router.get('/me', protect, async (req, res) => {
  try {
    const member = await Member.findOne({ userId: req.user._id }).populate('userId', 'name email');
    if (!member) return res.status(404).json({ message: 'Member profile not found' });
    res.json(member);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// GET /api/members/:id - Single member
router.get('/:id', protect, adminOnly, async (req, res) => {
  try {
    const member = await Member.findById(req.params.id).populate('userId', 'name email avatar createdAt');
    if (!member) return res.status(404).json({ message: 'Member not found' });
    res.json(member);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// POST /api/members - Add member (admin creates user + member record)
router.post('/', protect, adminOnly, async (req, res) => {
  try {
    const { name, email, password, phone, address, membershipType, enrollmentDate, expiryDate, gender, dateOfBirth, emergencyContact, healthNotes, goals } = req.body;

    const existingUser = await User.findOne({ email });
    if (existingUser) return res.status(400).json({ message: 'Email already registered' });

    const user = await User.create({ name, email, password: password || 'Gym@12345', role: 'athlete' });

    const member = await Member.create({
      userId: user._id,
      phone, address, membershipType, enrollmentDate, expiryDate,
      gender, dateOfBirth, emergencyContact, healthNotes, goals,
    });

    const populated = await Member.findById(member._id).populate('userId', 'name email');
    res.status(201).json(populated);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// PUT /api/members/:id - Update member (admin)
router.put('/:id', protect, adminOnly, async (req, res) => {
  try {
    const member = await Member.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true }).populate('userId', 'name email');
    if (!member) return res.status(404).json({ message: 'Member not found' });
    res.json(member);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// DELETE /api/members/:id - Remove member (admin)
router.delete('/:id', protect, adminOnly, async (req, res) => {
  try {
    const member = await Member.findById(req.params.id);
    if (!member) return res.status(404).json({ message: 'Member not found' });
    // Also delete the associated user
    await User.findByIdAndDelete(member.userId);
    await member.deleteOne();
    res.json({ message: 'Member removed successfully' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
