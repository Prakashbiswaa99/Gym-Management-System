const mongoose = require('mongoose');

const attendanceSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    date: { type: Date, required: true },
    status: { type: String, enum: ['present', 'absent', 'late'], required: true },
    reason: { type: String, default: '' }, // Required when absent or late
    checkInTime: { type: String, default: '' },
    checkOutTime: { type: String, default: '' },
    loggedBy: { type: String, enum: ['self', 'admin'], default: 'self' },
  },
  { timestamps: true }
);

// One record per user per day
attendanceSchema.index({ userId: 1, date: 1 }, { unique: true });

module.exports = mongoose.model('Attendance', attendanceSchema);
