const mongoose = require('mongoose');
const { v4: uuidv4 } = require('crypto');

const paymentSchema = new mongoose.Schema(
  {
    memberId: { type: mongoose.Schema.Types.ObjectId, ref: 'Member', required: true },
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    amount: { type: Number, required: true },
    plan: { type: String, enum: ['basic', 'standard', 'premium'], required: true },
    durationMonths: { type: Number, default: 1 },
    method: { type: String, enum: ['card', 'upi', 'cash'], required: true },
    status: { type: String, enum: ['success', 'failed', 'pending'], default: 'pending' },
    transactionId: { type: String, default: () => 'TXN' + Date.now() + Math.random().toString(36).substring(2, 7).toUpperCase() },
    cardLast4: { type: String, default: '' },
    upiId: { type: String, default: '' },
    notes: { type: String, default: '' },
    paidAt: { type: Date },
    processedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Payment', paymentSchema);
