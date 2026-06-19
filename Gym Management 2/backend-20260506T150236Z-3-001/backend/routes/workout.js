const express = require('express');
const router = express.Router();
const WorkoutSchedule = require('../models/WorkoutSchedule');
const { protect, adminOnly } = require('../middleware/auth');

// GET /api/workout/:userId?week=&year=
router.get('/:userId', protect, async (req, res) => {
  try {
    const { week, year } = req.query;
    const query = { userId: req.params.userId };
    if (week) query.week = parseInt(week);
    if (year) query.year = parseInt(year);

    const schedule = await WorkoutSchedule.findOne(query).populate('assignedBy', 'name');
    if (!schedule) return res.status(404).json({ message: 'No workout schedule found' });
    res.json(schedule);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// GET /api/workout/all/:userId - Get all schedules for a user
router.get('/all/:userId', protect, async (req, res) => {
  try {
    const schedules = await WorkoutSchedule.find({ userId: req.params.userId }).sort({ year: -1, week: -1 });
    res.json(schedules);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// POST /api/workout - Create/update workout schedule (admin)
router.post('/', protect, adminOnly, async (req, res) => {
  try {
    const { userId, week, year, days, notes } = req.body;
    const existing = await WorkoutSchedule.findOne({ userId, week, year });
    if (existing) {
      const updated = await WorkoutSchedule.findByIdAndUpdate(
        existing._id,
        { days, notes, assignedBy: req.user._id },
        { new: true }
      );
      return res.json(updated);
    }
    const schedule = await WorkoutSchedule.create({
      userId, week, year, days, notes, assignedBy: req.user._id,
    });
    res.status(201).json(schedule);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// PUT /api/workout/:id - Update a schedule
router.put('/:id', protect, adminOnly, async (req, res) => {
  try {
    const schedule = await WorkoutSchedule.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!schedule) return res.status(404).json({ message: 'Schedule not found' });
    res.json(schedule);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// DELETE /api/workout/:id
router.delete('/:id', protect, adminOnly, async (req, res) => {
  try {
    await WorkoutSchedule.findByIdAndDelete(req.params.id);
    res.json({ message: 'Workout schedule deleted' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
