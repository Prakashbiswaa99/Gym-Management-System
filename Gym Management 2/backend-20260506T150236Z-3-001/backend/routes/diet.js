const express = require('express');
const router = express.Router();
const DietSchedule = require('../models/DietSchedule');
const { protect, adminOnly } = require('../middleware/auth');

// GET /api/diet/:userId?week=&year=
router.get('/:userId', protect, async (req, res) => {
  try {
    const { week, year } = req.query;
    const query = { userId: req.params.userId };
    if (week) query.week = parseInt(week);
    if (year) query.year = parseInt(year);

    const schedule = await DietSchedule.findOne(query).populate('assignedBy', 'name');
    if (!schedule) return res.status(404).json({ message: 'No diet schedule found' });
    res.json(schedule);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// GET /api/diet/all/:userId
router.get('/all/:userId', protect, async (req, res) => {
  try {
    const schedules = await DietSchedule.find({ userId: req.params.userId }).sort({ year: -1, week: -1 });
    res.json(schedules);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// POST /api/diet - Create/update diet schedule (admin)
router.post('/', protect, adminOnly, async (req, res) => {
  try {
    const { userId, week, year, days, notes } = req.body;
    const existing = await DietSchedule.findOne({ userId, week, year });
    if (existing) {
      const updated = await DietSchedule.findByIdAndUpdate(
        existing._id,
        { days, notes, assignedBy: req.user._id },
        { new: true }
      );
      return res.json(updated);
    }
    const schedule = await DietSchedule.create({
      userId, week, year, days, notes, assignedBy: req.user._id,
    });
    res.status(201).json(schedule);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// PUT /api/diet/:id
router.put('/:id', protect, adminOnly, async (req, res) => {
  try {
    const schedule = await DietSchedule.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!schedule) return res.status(404).json({ message: 'Schedule not found' });
    res.json(schedule);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// DELETE /api/diet/:id
router.delete('/:id', protect, adminOnly, async (req, res) => {
  try {
    await DietSchedule.findByIdAndDelete(req.params.id);
    res.json({ message: 'Diet schedule deleted' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
