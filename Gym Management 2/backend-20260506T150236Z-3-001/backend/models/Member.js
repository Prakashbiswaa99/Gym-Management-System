const mongoose = require('mongoose');

const memberSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, unique: true },
    phone: { type: String, default: '' },
    address: { type: String, default: '' },
    dateOfBirth: { type: Date },
    gender: { type: String, enum: ['male', 'female', 'other'], default: 'male' },
    membershipType: { type: String, enum: ['basic', 'standard', 'premium'], default: 'basic' },
    enrollmentDate: { type: Date, default: Date.now },
    expiryDate: { type: Date },
    status: { type: String, enum: ['active', 'expired', 'pending'], default: 'pending' },
    emergencyContact: {
      name: { type: String, default: '' },
      phone: { type: String, default: '' },
      relation: { type: String, default: '' },
    },
    healthNotes: { type: String, default: '' },
    goals: { type: String, default: '' },
  },
  { timestamps: true }
);

// Auto-calculate status based on expiryDate
memberSchema.pre('save', function (next) {
  if (this.expiryDate) {
    this.status = new Date(this.expiryDate) > new Date() ? 'active' : 'expired';
  }
  next();
});

module.exports = mongoose.model('Member', memberSchema);
