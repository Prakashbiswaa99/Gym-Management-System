import React, { useEffect, useState } from 'react';
import Sidebar from '../../components/Sidebar';
import Toast, { toast } from '../../components/Toast';
import { useAuth } from '../../context/AuthContext';
import api from '../../services/api';

export default function AthleteProfile() {
  const { user } = useAuth();
  const [member, setMember] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/members/me')
      .then(res => setMember(res.data))
      .catch(() => toast('Could not load profile', 'error'))
      .finally(() => setLoading(false));
  }, []);

  const daysLeft = member?.expiryDate ? Math.ceil((new Date(member.expiryDate) - new Date()) / 86400000) : null;
  const initials = user?.name?.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2) || 'U';

  const PLAN_DETAILS = {
    basic:    { color: 'var(--text)', label: 'Basic', perks: ['Access to gym floor', 'Basic equipment', 'Locker room access'] },
    standard: { color: 'var(--primary)', label: 'Standard', perks: ['All Basic perks', 'Group classes', 'Weekly trainer check-in', 'Diet plan'] },
    premium:  { color: '#7C3AED', label: 'Premium', perks: ['All Standard perks', 'Personal trainer sessions', 'Custom workout plan', 'Nutrition coaching', 'Priority booking'] },
  };

  const plan = PLAN_DETAILS[member?.membershipType] || PLAN_DETAILS.basic;

  if (loading) return (
    <div className="app-layout"><Sidebar />
      <div className="main-content"><div className="spinner-container"><div className="spinner" /></div></div>
    </div>
  );

  return (
    <div className="app-layout">
      <Sidebar />
      <div className="main-content">
        <Toast />
        <div className="page-header">
          <div className="label">Account</div>
          <h1>My Profile</h1>
          <p>Your membership and personal details</p>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
          {/* Profile Card */}
          <div className="card" style={{ textAlign: 'center', padding: '2.5rem' }}>
            <div style={{ width: 80, height: 80, borderRadius: '50%', background: 'var(--primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontWeight: 900, fontSize: '2rem', margin: '0 auto 1.25rem', border: '3px solid var(--border)', boxShadow: 'var(--shadow)' }}>
              {initials}
            </div>
            <h2 style={{ marginBottom: '0.25rem' }}>{user?.name}</h2>
            <div style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginBottom: '1rem' }}>{user?.email}</div>
            <span className={`badge badge-${member?.status || 'pending'}`} style={{ fontSize: '0.82rem', padding: '0.3rem 0.875rem' }}>{member?.status || 'pending'}</span>

            <div style={{ marginTop: '2rem', display: 'flex', flexDirection: 'column', gap: '0.75rem', textAlign: 'left' }}>
              {[
                { label: 'Phone', value: member?.phone || 'Not set' },
                { label: 'Gender', value: member?.gender || '—', capitalize: true },
                { label: 'Date of Birth', value: member?.dateOfBirth ? new Date(member.dateOfBirth).toLocaleDateString('en-IN') : '—' },
                { label: 'Address', value: member?.address || 'Not set' },
                { label: 'Member Since', value: member?.enrollmentDate ? new Date(member.enrollmentDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' }) : '—' },
              ].map(({ label, value, capitalize }) => (
                <div key={label} style={{ display: 'flex', justifyContent: 'space-between', padding: '0.5rem 0', borderBottom: '1px solid var(--border-light)', fontSize: '0.875rem' }}>
                  <span style={{ fontWeight: 700, color: 'var(--text-muted)', fontSize: '0.72rem', textTransform: 'uppercase', letterSpacing: '0.06em' }}>{label}</span>
                  <span style={{ textAlign: 'right', textTransform: capitalize ? 'capitalize' : 'none' }}>{value}</span>
                </div>
              ))}
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            {/* Membership Card */}
            <div style={{ background: plan.color, border: '2px solid var(--border)', borderRadius: 4, boxShadow: 'var(--shadow)', padding: '1.75rem', color: 'white' }}>
              <div style={{ fontSize: '0.65rem', fontWeight: 700, letterSpacing: '0.2em', textTransform: 'uppercase', opacity: 0.7, marginBottom: '0.75rem' }}>Current Plan</div>
              <div className="display" style={{ fontSize: '3rem', lineHeight: 1, marginBottom: '0.75rem' }}>{plan.label}</div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
                <div>
                  <div style={{ fontSize: '0.8rem', opacity: 0.7, marginBottom: '0.2rem' }}>Expires</div>
                  <div style={{ fontWeight: 700 }}>{member?.expiryDate ? new Date(member.expiryDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' }) : '—'}</div>
                </div>
                {daysLeft !== null && (
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontSize: '2rem', fontWeight: 900, lineHeight: 1 }}>{Math.abs(daysLeft)}</div>
                    <div style={{ fontSize: '0.72rem', opacity: 0.75 }}>{daysLeft >= 0 ? 'days left' : 'days ago'}</div>
                  </div>
                )}
              </div>
            </div>

            {/* Plan Perks */}
            <div className="card">
              <h4 style={{ marginBottom: '1rem' }}>Plan Includes</h4>
              {plan.perks.map((p, i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '0.5rem 0', borderBottom: i < plan.perks.length - 1 ? '1px solid var(--border-light)' : 'none', fontSize: '0.875rem' }}>
                  <span style={{ color: 'var(--success)', fontWeight: 800, fontSize: '1rem' }}>✓</span>
                  {p}
                </div>
              ))}
            </div>

            {/* Goals */}
            {member?.goals && (
              <div className="card">
                <h4 style={{ marginBottom: '0.75rem' }}>My Fitness Goals</h4>
                <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', lineHeight: 1.7 }}>{member.goals}</p>
              </div>
            )}

            {/* Emergency Contact */}
            {(member?.emergencyContact?.name) && (
              <div className="card">
                <h4 style={{ marginBottom: '1rem' }}>Emergency Contact</h4>
                {[
                  { l: 'Name', v: member.emergencyContact.name },
                  { l: 'Phone', v: member.emergencyContact.phone },
                  { l: 'Relation', v: member.emergencyContact.relation },
                ].map(({ l, v }) => v ? (
                  <div key={l} style={{ display: 'flex', justifyContent: 'space-between', padding: '0.4rem 0', borderBottom: '1px solid var(--border-light)', fontSize: '0.875rem' }}>
                    <span style={{ fontWeight: 700, color: 'var(--text-muted)', fontSize: '0.72rem', textTransform: 'uppercase' }}>{l}</span>
                    <span>{v}</span>
                  </div>
                ) : null)}
              </div>
            )}

            {daysLeft !== null && daysLeft <= 14 && (
              <div className={`alert ${daysLeft < 0 ? 'alert-error' : 'alert-warning'}`}>
                {daysLeft < 0 ? `Your membership expired ${Math.abs(daysLeft)} days ago.` : `Membership expiring in ${daysLeft} days.`} Contact your gym admin to renew.
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
