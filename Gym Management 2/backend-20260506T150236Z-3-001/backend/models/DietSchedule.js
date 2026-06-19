const mongoose = require('mongoose');

const foodItemSchema = new mongoose.Schema({
  name: { type: String, required: true },
  quantity: { type: String, default: '' },
  calories: { type: Number, default: 0 },
  protein: { type: Number, default: 0 }, // grams
  carbs: { type: Number, default: 0 },
  fat: { type: Number, default: 0 },
});

const mealSchema = new mongoose.Schema({
  type: { type: String, enum: ['breakfast', 'lunch', 'dinner', 'snack', 'pre-workout', 'post-workout'], required: true },
  time: { type: String, default: '' }, // e.g. "7:30 AM"
  foods: [foodItemSchema],
  totalCalories: { type: Number, default: 0 },
  notes: { type: String, default: '' },
});

const dietDaySchema = new mongoose.Schema({
  dayName: { type: String, enum: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'], required: true },
  meals: [mealSchema],
  targetCalories: { type: Number, default: 2000 },
  waterIntake: { type: String, default: '3L' },
});

const dietScheduleSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    week: { type: Number, required: true, min: 1, max: 53 },
    year: { type: Number, required: true },
    days: [dietDaySchema],
    notes: { type: String, default: '' },
    assignedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  },
  { timestamps: true }
);

dietScheduleSchema.index({ userId: 1, week: 1, year: 1 }, { unique: true });

module.exports = mongoose.model('DietSchedule', dietScheduleSchema);
