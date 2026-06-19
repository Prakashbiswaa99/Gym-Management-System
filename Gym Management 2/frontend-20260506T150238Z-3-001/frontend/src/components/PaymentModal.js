import React, { useState } from 'react';
import api from '../services/api';
import { toast } from './Toast';

const PLANS = [
  { key: 'basic', label: 'Basic', price: 999 },
  { key: 'standard', label: 'Standard', price: 1999 },
  { key: 'premium', label: 'Premium', price: 3499 },
];

export default function PaymentModal({ memberId, currentPlan, onClose, onSuccess }) {
  const [plan, setPlan] = useState(currentPlan || 'basic');
  const [duration, setDuration] = useState(1);
  const [method, setMethod] = useState('card');
  const [cardNum, setCardNum] = useState('');
  const [cardExpiry, setCardExpiry] = useState('');
  const [cardCvv, setCardCvv] = useState('');
  const [upiId, setUpiId] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);

  const selectedPlan = PLANS.find(p => p.key === plan);
  const total = selectedPlan.price * duration;

  const handlePay = async () => {
    setLoading(true);
    try {
      const payload = {
        memberId, plan, durationMonths: duration, method,
        cardLast4: method === 'card' ? cardNum.slice(-4) : '',
        upiId: method === 'upi' ? upiId : '',
      };
      const res = await api.post('/payments/mock-charge', payload);
      setResult(res.data);
      if (res.data.success) {
        toast('Payment successful! Membership updated.', 'success');
        onSuccess && onSuccess(res.data);
      } else {
        toast('Payment failed. Please try again.', 'error');
      }
    } catch (err) {
      toast(err.response?.data?.message || 'Payment error', 'error');
    } finally {
      setLoading(false);
    }
  };

  if (result) {
    return (
      <div className="modal-overlay" onClick={onClose}>
        <div className="modal" onClick={e => e.stopPropagation()} style={{ maxWidth: 400 }}>
          <div className="modal-body" style={{ textAlign: 'center', padding: '2.5rem' }}>
            <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>{result.success ? '✅' : '❌'}</div>
            <h3 style={{ marginBottom: '0.5rem' }}>{result.success ? 'Payment Successful' : 'Payment Failed'}</h3>
            <p style={{ color: 'var(--text-secondary)', marginBottom: '1rem', fontSize: '0.9rem' }}>{result.message}</p>
            {result.success && (
              <div style={{ background: 'var(--success-light)', border: '2px solid var(--success)', borderRadius: 4, padding: '0.75rem', marginBottom: '1rem', fontSize: '0.8rem' }}>
                <strong>Transaction ID:</strong> {result.payment?.transactionId}
              </div>
            )}
            <button className="btn btn-primary btn-full" onClick={onClose}>Close</button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <h3>Renew Membership</h3>
          <button className="modal-close" onClick={onClose}>×</button>
        </div>
        <div className="modal-body">
          {/* Plan Selection */}
          <div className="form-group">
            <label className="form-label">Select Plan</label>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: '0.5rem' }}>
              {PLANS.map(p => (
                <button key={p.key} onClick={() => setPlan(p.key)}
                  className={`method-tab${plan === p.key ? ' active' : ''}`}
                  style={{ flexDirection: 'column', gap: '0.25rem' }}>
                  <span>{p.label}</span>
                  <span style={{ fontSize: '0.7rem', opacity: 0.8 }}>₹{p.price}/mo</span>
                </button>
              ))}
            </div>
          </div>

          {/* Duration */}
          <div className="form-group">
            <label className="form-label">Duration (Months)</label>
            <select className="form-input" value={duration} onChange={e => setDuration(Number(e.target.value))}>
              {[1,2,3,6,12].map(d => <option key={d} value={d}>{d} Month{d > 1 ? 's' : ''} — ₹{selectedPlan.price * d}</option>)}
            </select>
          </div>

          {/* Total */}
          <div style={{ background: 'var(--primary-light)', border: '2px solid var(--primary)', borderRadius: 4, padding: '0.875rem 1rem', marginBottom: '1.25rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontWeight: 700, fontSize: '0.85rem' }}>Total Amount</span>
            <span style={{ fontWeight: 900, fontSize: '1.3rem', color: 'var(--primary)' }}>₹{total.toLocaleString()}</span>
          </div>

          {/* Payment Method */}
          <div className="form-group">
            <label className="form-label">Payment Method</label>
            <div className="payment-method-tabs">
              {['card','upi','cash'].map(m => (
                <button key={m} className={`method-tab${method === m ? ' active' : ''}`} onClick={() => setMethod(m)}>
                  {m === 'card' ? '💳 Card' : m === 'upi' ? '📱 UPI' : '💵 Cash'}
                </button>
              ))}
            </div>
          </div>

          {/* Card mock */}
          {method === 'card' && (
            <>
              <div className="card-mockup">
                <div style={{ fontSize: '0.7rem', opacity: 0.7, letterSpacing: '0.15em' }}>GYM MEMBERSHIP CARD</div>
                <div className="card-number">{cardNum.replace(/(.{4})/g,'$1 ').trim() || '•••• •••• •••• ••••'}</div>
                <div className="card-meta">
                  <span>{cardExpiry || 'MM/YY'}</span>
                  <span>GymOS Pay</span>
                </div>
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">Card Number</label>
                  <input className="form-input" placeholder="1234 5678 9012 3456" maxLength={16} value={cardNum} onChange={e => setCardNum(e.target.value.replace(/\D/g,''))} />
                </div>
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">Expiry</label>
                  <input className="form-input" placeholder="MM/YY" maxLength={5} value={cardExpiry} onChange={e => setCardExpiry(e.target.value)} />
                </div>
                <div className="form-group">
                  <label className="form-label">CVV</label>
                  <input className="form-input" placeholder="•••" maxLength={3} type="password" value={cardCvv} onChange={e => setCardCvv(e.target.value.replace(/\D/g,''))} />
                </div>
              </div>
            </>
          )}

          {method === 'upi' && (
            <div className="form-group">
              <label className="form-label">UPI ID</label>
              <input className="form-input" placeholder="yourname@upi" value={upiId} onChange={e => setUpiId(e.target.value)} />
            </div>
          )}

          {method === 'cash' && (
            <div className="alert alert-warning">Cash payment will be recorded manually. Confirm with front desk.</div>
          )}
        </div>
        <div className="modal-footer">
          <button className="btn btn-outline" onClick={onClose}>Cancel</button>
          <button className="btn btn-success" onClick={handlePay} disabled={loading}>
            {loading ? <><div className="spinner spinner-sm" /> Processing…</> : `Pay ₹${total.toLocaleString()}`}
          </button>
        </div>
      </div>
    </div>
  );
}
