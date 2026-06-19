import React, { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import Sidebar from '../../components/Sidebar';
import Toast, { toast } from '../../components/Toast';
import PaymentModal from '../../components/PaymentModal';
import api from '../../services/api';

export default function MemberDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [member, setMember] = useState(null);
  const [payments, setPayments] = useState([]);
  const [attendance, setAttendance] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showPayment, setShowPayment] = useState(false);
  const [activeTab, setActiveTab] = useState('overview');
  const [editing, setEditing] = useState(false);
  const [editForm, setEditForm] = useState({});
  const [saving, setSaving] = useState(false);

  const fetchMember = async () => {
    try {
      const [mRes, pRes, aRes] = await Promise.all([
        api.get(`/members/${id}`),
        api.get(`/payments/${id}`),
        api.get(`/attendance/${member?.userId?._id || ''}`).catch(() => ({ data: [] })),
      ]);
      setMember(mRes.data);
      setEditForm({ membershipType: mRes.data.membershipType, status: mRes.data.status, phone: mRes.data.phone, address: mRes.data.address, healthNotes: mRes.data.healthNotes, goals: mRes.data.goals });
      setPayments(pRes.data);
    } catch { toast('Failed to load member', 'error'); }
  };

  const fetchAttendance = async (userId) => {
    const now = new Date();
    try {
      const res = await api.get(`/attendance/${userId}?month=${now.getMonth() + 1}&year=${now.getFullYear()}`);
      setAttendance(res.data);
    } catch { setAttendance([]); }
  };

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const [mRes, pRes] = await Promise.all([api.get(`/members/${id}`), api.get(`/payments/${id}`)]);
        setMember(mRes.data);
        setEditForm({ membershipType: mRes.data.membershipType, status: mRes.data.status, phone: mRes.data.phone, address: mRes.data.address, healthNotes: mRes.data.healthNotes, goals: mRes.data.goals });
        setPayments(pRes.data);
        if (mRes.data.userId?._id) await fetchAttendance(mRes.data.userId._id);
      } catch { toast('Failed to load member', 'error'); }
      finally { setLoading(false); }
    };
    load();
  }, [id]);

  const handleSave = async () => {
    setSaving(true);
    try {
      const res = await api.put(`/members/${id}`, editForm);
      setMember(res.data);
      setEditing(false);
      toast('Member updated!', 'success');
    } catch { toast('Update failed', 'error'); }
    finally { setSaving(false); }
  };

  const daysLeft = member?.expiryDate ? Math.ceil((new Date(member.expiryDate) - new Date()) / 86400000) : null;

  if (loading) return (
    <div className="app-layout"><Sidebar /><div className="main-content"><div className="spinner-container"><div className="spinner" /></div></div></div>
  );
  if (!member) return (
    <div className="app-layout"><Sidebar /><div className="main-content"><div className="empty-state"><h3>Member not found</h3></div></div></div>
  );

  return (
    <div className="app-layout">
      <Sidebar />
      <div className="main-content">
        <Toast />
        {showPayment && (
          <PaymentModal memberId={id} currentPlan={member.membershipType}
            onClose={() => setShowPayment(false)}
            onSuccess={() => { setShowPayment(false); window.location.reload(); }} />
        )}

        {/* Header */}
        <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
          <div>
            <Link to="/admin/members" style={{ fontSize: '0.85rem', color: 'var(--text-muted)', fontWeight: 700, display: 'inline-block', marginBottom: '0.5rem' }}>← Members</Link>
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
              <div style={{ width: 56, height: 56, borderRadius: '50%', background: 'var(--primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontWeight: 900, fontSize: '1.3rem', border: '3px solid var(--border)' }}>
                {member.userId?.name?.[0] ?? '?'}
              </div>
              <div>
                <h1 style={{ fontSize: '2rem' }}>{member.userId?.name}</h1>
                <div style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>{member.userId?.email}</div>
              </div>
            </div>
          </div>
          <div style={{ display: 'flex', gap: '0.75rem' }}>
            <Link to={`/admin/workout/${member.userId?._id}`} className="btn btn-outline">💪 Workout</Link>
            <Link to={`/admin/diet/${member.userId?._id}`} className="btn btn-outline">🥗 Diet</Link>
            <button className="btn btn-primary" onClick={() => setShowPayment(true)}>💳 Renew</button>
          </div>
        </div>

        {/* Status Bar */}
        <div style={{ display: 'flex', gap: '1rem', marginBottom: '1.5rem', flexWrap: 'wrap' }}>
          <span className={`badge badge-${member.status}`} style={{ fontSize: '0.8rem', padding: '0.3rem 0.8rem' }}>{member.status}</span>
          <span className="badge badge-primary" style={{ fontSize: '0.8rem', padding: '0.3rem 0.8rem', textTransform: 'capitalize' }}>{member.membershipType}</span>
          {daysLeft !== null && (
            <span className={`badge ${daysLeft < 0 ? 'badge-expired' : daysLeft < 7 ? 'badge-pending' : 'badge-active'}`} style={{ fontSize: '0.8rem', padding: '0.3rem 0.8rem' }}>
              {daysLeft > 0 ? `${daysLeft} days left` : `Expired ${Math.abs(daysLeft)}d ago`}
            </span>
          )}
        </div>

        {/* Tabs */}
        <div className="tab-bar">
          {['overview', 'payments', 'attendance'].map(tab => (
            <button key={tab} className={`tab-btn${activeTab === tab ? ' active' : ''}`}
              onClick={() => setActiveTab(tab)} style={{ textTransform: 'capitalize' }}>{tab}</button>
          ))}
        </div>

        {/* Overview Tab */}
        {activeTab === 'overview' && (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
            <div className="card">
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1.25rem' }}>
                <h4>Membership Details</h4>
                {!editing && <button className="btn btn-outline btn-sm" onClick={() => setEditing(true)}>Edit</button>}
              </div>
              {editing ? (
                <>
                  <div className="form-group">
                    <label className="form-label">Membership Type</label>
                    <select className="form-input" value={editForm.membershipType} onChange={e => setEditForm(f => ({ ...f, membershipType: e.target.value }))}>
                      <option value="basic">Basic</option>
                      <option value="standard">Standard</option>
                      <option value="premium">Premium</option>
                    </select>
                  </div>
                  <div className="form-group">
                    <label className="form-label">Status</label>
                    <select className="form-input" value={editForm.status} onChange={e => setEditForm(f => ({ ...f, status: e.target.value }))}>
                      <option value="active">Active</option>
                      <option value="expired">Expired</option>
                      <option value="pending">Pending</option>
                    </select>
                  </div>
                  <div className="form-group">
                    <label className="form-label">Phone</label>
                    <input className="form-input" value={editForm.phone || ''} onChange={e => setEditForm(f => ({ ...f, phone: e.target.value }))} />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Goals</label>
                    <textarea className="form-input" value={editForm.goals || ''} onChange={e => setEditForm(f => ({ ...f, goals: e.target.value }))} />
                  </div>
                  <div style={{ display: 'flex', gap: '0.5rem' }}>
                    <button className="btn btn-success btn-sm" onClick={handleSave} disabled={saving}>{saving ? 'Saving…' : 'Save'}</button>
                    <button className="btn btn-outline btn-sm" onClick={() => setEditing(false)}>Cancel</button>
                  </div>
                </>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                  {[
                    { label: 'Plan', value: member.membershipType },
                    { label: 'Enrolled', value: member.enrollmentDate ? new Date(member.enrollmentDate).toLocaleDateString('en-IN') : '—' },
                    { label: 'Expires', value: member.expiryDate ? new Date(member.expiryDate).toLocaleDateString('en-IN') : '—' },
                    { label: 'Phone', value: member.phone || '—' },
                    { label: 'Gender', value: member.gender || '—' },
                    { label: 'Goals', value: member.goals || '—' },
                    { label: 'Health Notes', value: member.healthNotes || '—' },
                  ].map(({ label, value }) => (
                    <div key={label} style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid var(--border-light)', paddingBottom: '0.5rem', fontSize: '0.875rem' }}>
                      <span style={{ fontWeight: 700, color: 'var(--text-muted)', fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.06em' }}>{label}</span>
                      <span style={{ textAlign: 'right', maxWidth: '60%', textTransform: 'capitalize' }}>{value}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="card">
              <h4 style={{ marginBottom: '1.25rem' }}>Emergency Contact</h4>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                {[
                  { label: 'Name', value: member.emergencyContact?.name || '—' },
                  { label: 'Phone', value: member.emergencyContact?.phone || '—' },
                  { label: 'Relation', value: member.emergencyContact?.relation || '—' },
                ].map(({ label, value }) => (
                  <div key={label} style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid var(--border-light)', paddingBottom: '0.5rem', fontSize: '0.875rem' }}>
                    <span style={{ fontWeight: 700, color: 'var(--text-muted)', fontSize: '0.75rem', textTransform: 'uppercase' }}>{label}</span>
                    <span>{value}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Payments Tab */}
        {activeTab === 'payments' && (
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1.25rem', alignItems: 'center' }}>
              <h4>Payment History</h4>
              <button className="btn btn-primary btn-sm" onClick={() => setShowPayment(true)}>+ New Payment</button>
            </div>
            {payments.length === 0 ? (
              <div className="empty-state"><h3>No payments yet</h3><p>Process the first payment to activate membership</p></div>
            ) : (
              <div className="table-wrapper">
                <table>
                  <thead><tr><th>Transaction ID</th><th>Plan</th><th>Amount</th><th>Method</th><th>Status</th><th>Date</th></tr></thead>
                  <tbody>
                    {payments.map(p => (
                      <tr key={p._id}>
                        <td><code style={{ fontSize: '0.78rem', background: 'var(--bg)', padding: '0.2rem 0.4rem', borderRadius: 2 }}>{p.transactionId}</code></td>
                        <td style={{ textTransform: 'capitalize', fontWeight: 600 }}>{p.plan}</td>
                        <td style={{ fontWeight: 700 }}>₹{p.amount?.toLocaleString()}</td>
                        <td style={{ textTransform: 'uppercase', fontSize: '0.8rem', fontWeight: 700 }}>{p.method}</td>
                        <td><span className={`badge ${p.status === 'success' ? 'badge-active' : p.status === 'failed' ? 'badge-expired' : 'badge-pending'}`}>{p.status}</span></td>
                        <td style={{ fontSize: '0.82rem', color: 'var(--text-secondary)' }}>{p.paidAt ? new Date(p.paidAt).toLocaleDateString('en-IN') : '—'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* Attendance Tab */}
        {activeTab === 'attendance' && (
          <div>
            <h4 style={{ marginBottom: '1.25rem' }}>This Month's Attendance</h4>
            {attendance.length === 0 ? (
              <div className="empty-state"><h3>No attendance records</h3></div>
            ) : (
              <div className="table-wrapper">
                <table>
                  <thead><tr><th>Date</th><th>Status</th><th>Check In</th><th>Reason</th></tr></thead>
                  <tbody>
                    {attendance.map(a => (
                      <tr key={a._id}>
                        <td style={{ fontWeight: 600 }}>{new Date(a.date).toLocaleDateString('en-IN', { weekday: 'short', day: '2-digit', month: 'short' })}</td>
                        <td><span className={`badge badge-${a.status}`}>{a.status}</span></td>
                        <td style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>{a.checkInTime || '—'}</td>
                        <td style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>{a.reason || '—'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
