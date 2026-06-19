import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import Sidebar from '../../components/Sidebar';
import Toast, { toast } from '../../components/Toast';
import api from '../../services/api';

export default function AddMember() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    name: '', email: '', password: 'Gym@12345',
    phone: '', address: '', gender: 'male', dateOfBirth: '',
    membershipType: 'basic', enrollmentDate: new Date().toISOString().split('T')[0], expiryDate: '',
    emergencyContact: { name: '', phone: '', relation: '' },
    healthNotes: '', goals: '',
  });

  const set = (field, val) => setForm(f => ({ ...f, [field]: val }));
  const setEC = (field, val) => setForm(f => ({ ...f, emergencyContact: { ...f.emergencyContact, [field]: val } }));

  const autoExpiry = (type, startDate) => {
    if (!startDate) return;
    const d = new Date(startDate);
    const months = type === 'basic' ? 1 : type === 'standard' ? 3 : 6;
    d.setMonth(d.getMonth() + months);
    set('expiryDate', d.toISOString().split('T')[0]);
  };

  const handleTypeChange = (val) => {
    set('membershipType', val);
    autoExpiry(val, form.enrollmentDate);
  };

  const handleSubmit = async e => {
    e.preventDefault();
    setLoading(true);
    try {
      await api.post('/members', form);
      toast('Member added successfully!', 'success');
      navigate('/admin/members');
    } catch (err) {
      toast(err.response?.data?.message || 'Failed to add member', 'error');
    } finally { setLoading(false); }
  };

  const inputProps = (field) => ({
    className: 'form-input',
    value: form[field],
    onChange: e => set(field, e.target.value),
  });

  return (
    <div className="app-layout">
      <Sidebar />
      <div className="main-content">
        <Toast />
        <div className="page-header">
          <Link to="/admin/members" style={{ fontSize: '0.85rem', color: 'var(--text-muted)', fontWeight: 700, display: 'inline-block', marginBottom: '0.5rem' }}>← Back to Members</Link>
          <h1>Onboard New Member</h1>
          <p>Fill in member details to create their account and membership</p>
        </div>

        <form onSubmit={handleSubmit}>
          <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '1.5rem', alignItems: 'start' }}>
            <div>
              {/* Personal Info */}
              <div className="card" style={{ marginBottom: '1.5rem' }}>
                <h4 style={{ marginBottom: '1.25rem', paddingBottom: '0.75rem', borderBottom: '2px solid var(--border-light)' }}>Personal Information</h4>
                <div className="form-row">
                  <div className="form-group">
                    <label className="form-label">Full Name *</label>
                    <input {...inputProps('name')} id="member-name" placeholder="John Doe" required />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Email *</label>
                    <input {...inputProps('email')} id="member-email" type="email" placeholder="john@email.com" required />
                  </div>
                </div>
                <div className="form-row">
                  <div className="form-group">
                    <label className="form-label">Phone</label>
                    <input {...inputProps('phone')} id="member-phone" placeholder="+91 98765 43210" />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Gender</label>
                    <select {...inputProps('gender')} id="member-gender">
                      <option value="male">Male</option>
                      <option value="female">Female</option>
                      <option value="other">Other</option>
                    </select>
                  </div>
                </div>
                <div className="form-row">
                  <div className="form-group">
                    <label className="form-label">Date of Birth</label>
                    <input {...inputProps('dateOfBirth')} id="member-dob" type="date" />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Temp Password</label>
                    <input {...inputProps('password')} id="member-password" />
                  </div>
                </div>
                <div className="form-group">
                  <label className="form-label">Address</label>
                  <textarea {...inputProps('address')} id="member-address" placeholder="Full address…" rows={2} />
                </div>
              </div>

              {/* Emergency Contact */}
              <div className="card" style={{ marginBottom: '1.5rem' }}>
                <h4 style={{ marginBottom: '1.25rem', paddingBottom: '0.75rem', borderBottom: '2px solid var(--border-light)' }}>Emergency Contact</h4>
                <div className="form-row-3">
                  <div className="form-group">
                    <label className="form-label">Name</label>
                    <input className="form-input" id="ec-name" placeholder="Contact name" value={form.emergencyContact.name} onChange={e => setEC('name', e.target.value)} />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Phone</label>
                    <input className="form-input" id="ec-phone" placeholder="Phone number" value={form.emergencyContact.phone} onChange={e => setEC('phone', e.target.value)} />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Relation</label>
                    <input className="form-input" id="ec-relation" placeholder="e.g. Spouse" value={form.emergencyContact.relation} onChange={e => setEC('relation', e.target.value)} />
                  </div>
                </div>
              </div>

              {/* Health & Goals */}
              <div className="card">
                <h4 style={{ marginBottom: '1.25rem', paddingBottom: '0.75rem', borderBottom: '2px solid var(--border-light)' }}>Health & Goals</h4>
                <div className="form-group">
                  <label className="form-label">Health Notes</label>
                  <textarea {...inputProps('healthNotes')} id="member-health" placeholder="Any injuries, conditions, allergies…" />
                </div>
                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label className="form-label">Fitness Goals</label>
                  <textarea {...inputProps('goals')} id="member-goals" placeholder="Weight loss, muscle gain, endurance…" />
                </div>
              </div>
            </div>

            {/* Membership Sidebar */}
            <div style={{ position: 'sticky', top: '1rem' }}>
              <div className="card">
                <h4 style={{ marginBottom: '1.25rem', paddingBottom: '0.75rem', borderBottom: '2px solid var(--border-light)' }}>Membership</h4>
                <div className="form-group">
                  <label className="form-label">Plan</label>
                  {['basic', 'standard', 'premium'].map(p => (
                    <label key={p} style={{
                      display: 'flex', alignItems: 'center', gap: '0.75rem',
                      padding: '0.75rem', border: `2px solid ${form.membershipType === p ? 'var(--primary)' : 'var(--border-light)'}`,
                      borderRadius: 4, cursor: 'pointer', marginBottom: '0.5rem',
                      background: form.membershipType === p ? 'var(--primary-light)' : 'white',
                    }}>
                      <input type="radio" name="plan" value={p} checked={form.membershipType === p}
                        onChange={() => handleTypeChange(p)} />
                      <div>
                        <div style={{ fontWeight: 700, textTransform: 'capitalize' }}>{p}</div>
                        <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                          {p === 'basic' ? '₹999/mo · 1 month' : p === 'standard' ? '₹1999/mo · 3 months' : '₹3499/mo · 6 months'}
                        </div>
                      </div>
                    </label>
                  ))}
                </div>
                <div className="form-group">
                  <label className="form-label">Enrollment Date *</label>
                  <input className="form-input" id="member-enroll" type="date" value={form.enrollmentDate}
                    onChange={e => { set('enrollmentDate', e.target.value); autoExpiry(form.membershipType, e.target.value); }} required />
                </div>
                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label className="form-label">Expiry Date</label>
                  <input className="form-input" id="member-expiry" type="date" value={form.expiryDate}
                    onChange={e => set('expiryDate', e.target.value)} />
                  <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>Auto-calculated from plan</div>
                </div>
              </div>

              <button id="submit-member" type="submit" className="btn btn-primary btn-full btn-lg" disabled={loading} style={{ marginTop: '1rem' }}>
                {loading ? <><div className="spinner spinner-sm" /> Adding…</> : 'Add Member →'}
              </button>
              <Link to="/admin/members" className="btn btn-outline btn-full" style={{ marginTop: '0.5rem' }}>Cancel</Link>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
