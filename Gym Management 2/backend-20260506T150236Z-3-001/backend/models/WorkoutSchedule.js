const mongoose = require('mongoose');

const exerciseSchema = new mongoose.Schema({
  name: { type: String, required: true },
  sets: { type: Number, default: 3 },
  reps: { type: String, default: '10' },
  rest: { type: String, default: '60s' },
  notes: { type: String, default: '' },
});

const workoutDaySchema = new mongoose.Schema({
  dayName: { type: String, enum: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'], required: true },
  isRestDay: { type: Boolean, default: false },
  exercises: [exerciseSchema],
  focus: { type: String, default: '' }, // e.g. "Chest & Triceps"
});

const workoutScheduleSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    week: { type: Number, required: true, min: 1, max: 53 },
    year: { type: Number, required: true },
    days: [workoutDaySchema],
    notes: { type: String, default: '' },
    assignedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  },
  { timestamps: true }
);

workoutScheduleSchema.index({ userId: 1, week: 1, year: 1 }, { unique: true });

module.exports = mongoose.model('WorkoutSchedule', workoutScheduleSchema);
