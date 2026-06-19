const express = require('express');
const router = express.Router();
const Payment = require('../models/Payment');
const Member = require('../models/Member');
const { protect, adminOnly } = require('../middleware/auth');

const PLAN_PRICES = { basic: 999, standard: 1999, premium: 3499 };

// POST /api/payments/mock-charge - Process mock payment
router.post('/mock-charge', protect, adminOnly, async (req, res) => {
  try {
    const { memberId, plan, durationMonths, method, cardLast4, upiId, notes } = req.body;

    const member = await Member.findById(memberId);
    if (!member) return res.status(404).json({ message: 'Member not found' });

    const amount = PLAN_PRICES[plan] * (durationMonths || 1);

    // Simulate payment processing (90% success rate mock)
    const isSuccess = Math.random() > 0.1;

    const payment = await Payment.create({
      memberId,
      userId: member.userId,
      amount,
      plan,
      durationMonths: durationMonths || 1,
      method,
      status: isSuccess ? 'success' : 'failed',
      cardLast4: cardLast4 || '',
      upiId: upiId || '',
      notes: notes || '',
      paidAt: isSuccess ? new Date() : null,
      processedBy: req.user._id,
    });

    // If payment succeeded, update membership
    if (isSuccess) {
      const newExpiry = new Date(member.expiryDate && member.expiryDate > new Date() ? member.expiryDate : new Date());
      newExpiry.setMonth(newExpiry.getMonth() + (durationMonths || 1));
      await Member.findByIdAndUpdate(memberId, {
        membershipType: plan,
        expiryDate: newExpiry,
        status: 'active',
        enrollmentDate: member.enrollmentDate || new Date(),
      });
    }

    res.status(201).json({
      payment,
      success: isSuccess,
      message: isSuccess ? 'Payment processed successfully' : 'Payment failed. Please try again.',
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// GET /api/payments/:memberId - Payment history for a member
router.get('/:memberId', protect, adminOnly, async (req, res) => {
  try {
    const payments = await Payment.find({ memberId: req.params.memberId })
      .populate('processedBy', 'name')
      .sort({ createdAt: -1 });
    res.json(payments);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// GET /api/payments - All payments (admin)
router.get('/', protect, adminOnly, async (req, res) => {
  try {
    const payments = await Payment.find()
      .populate('userId', 'name email')
      .populate('processedBy', 'name')
      .sort({ createdAt: -1 })
      .limit(50);
    res.json(payments);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// GET /api/payments/revenue/summary - Revenue stats
router.get('/revenue/summary', protect, adminOnly, async (req, res) => {
  try {
    const result = await Payment.aggregate([
      { $match: { status: 'success' } },
      { $group: { _id: null, total: { $sum: '$amount' }, count: { $sum: 1 } } },
    ]);
    const monthly = await Payment.aggregate([
      { $match: { status: 'success', paidAt: { $gte: new Date(new Date().getFullYear(), new Date().getMonth(), 1) } } },
      { $group: { _id: null, total: { $sum: '$amount' } } },
    ]);
    res.json({
      totalRevenue: result[0]?.total || 0,
      totalTransactions: result[0]?.count || 0,
      monthlyRevenue: monthly[0]?.total || 0,
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
