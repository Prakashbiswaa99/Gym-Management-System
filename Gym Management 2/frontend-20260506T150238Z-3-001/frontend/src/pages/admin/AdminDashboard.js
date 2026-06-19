import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import Sidebar from '../../components/Sidebar';
import Toast, { toast } from '../../components/Toast';
import api from '../../services/api';

const StatCard = ({ label, value, sub, color, icon }) => (
  <div className={`stat-card ${color}`}>
    <div className="stat-label">{icon} {label}</div>
    <div className="stat-value">{value}</div>
    {sub && <div className="stat-sub">{sub}</div>}
  </div>
);

export default function AdminDashboard() {
  const [stats, setStats] = useState(null);
  const [revenue, setRevenue] = useState(null);
  const [members, setMembers] = useState([]);
  const [attendance, setAttendance] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const now = new Date();
    Promise.all([
      api.get('/members/stats'),
      api.get('/payments/revenue/summary'),
      api.get('/members?limit=5'),
      api.get(`/attendance/summary?month=${now.getMonth() + 1}&year=${now.getFullYear()}`),
    ]).then(([s, r, m, a]) => {
      setStats(s.data);
      setRevenue(r.data);
      setMembers(m.data.slice(0, 5));
      setAttendance(a.data);
    }).catch(() => toast('Failed to load dashboard', 'error'))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return (
    <div className="app-layout">
      <Sidebar />
      <div className="main-content"><div className="spinner-container"><div className="spinner" /></div></div>
    </div>
  );

  return (
    <div className="app-layout">
      <Sidebar />
      <div className="main-content">
        <Toast />
        <div className="page-header">
          <div className="label">Command Center</div>
          <h1>Dashboard</h1>
          <p>Overview of your gym operations</p>
        </div>

        {/* Stats Row */}
        <div className="stat-grid">
          <StatCard label="Total Members" value={stats?.total ?? '—'} sub="All time" color="indigo" icon="👥" />
          <StatCard label="Active" value={stats?.active ?? '—'} sub="Valid memberships" color="green" icon="✅" />
          <StatCard label="Expired" value={stats?.expired ?? '—'} sub="Need renewal" color="coral" icon="⚠️" />
          <StatCard label="Monthly Revenue" value={revenue ? `₹${revenue.monthlyRevenue.toLocaleString()}` : '—'} sub={`${revenue?.totalTransactions ?? 0} transactions total`} color="amber" icon="💰" />
          <StatCard label="Premium Members" value={stats?.premium ?? '—'} sub="Highest tier" color="indigo" icon="⭐" />
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
          {/* Recent Members */}
          <div className="card" style={{ padding: 0 }}>
            <div style={{ padding: '1.25rem 1.5rem', borderBottom: '2px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h4>Recent Members</h4>
              <Link to="/admin/members" className="btn btn-outline btn-sm">View All</Link>
            </div>
            <div>
              {members.length === 0 && <div className="empty-state"><p>No members yet</p></div>}
              {members.map(m => (
                <div key={m._id} style={{ display: 'flex', alignItems: 'center', gap: '1rem', padding: '0.875rem 1.5rem', borderBottom: '1px solid var(--border-light)' }}>
                  <div style={{ width: 38, height: 38, borderRadius: '50%', background: 'var(--primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontWeight: 800, fontSize: '0.85rem', flexShrink: 0 }}>
                    {m.userId?.name?.[0] ?? '?'}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontWeight: 700, fontSize: '0.9rem', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{m.userId?.name}</div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{m.membershipType}</div>
                  </div>
                  <span className={`badge badge-${m.status}`}>{m.status}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Attendance Summary */}
          <div className="card">
            <h4 style={{ marginBottom: '1.25rem' }}>Attendance This Month</h4>
            {attendance ? (
              <>
                {[
                  { label: 'Present', value: attendance.present, color: 'var(--success)', bg: 'var(--success-light)' },
                  { label: 'Absent', value: attendance.absent, color: 'var(--danger)', bg: 'var(--danger-light)' },
                  { label: 'Late', value: attendance.late, color: 'var(--warning)', bg: 'var(--warning-light)' },
                ].map(item => (
                  <div key={item.label} style={{ marginBottom: '0.875rem' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.3rem', fontSize: '0.85rem', fontWeight: 600 }}>
                      <span>{item.label}</span><span>{item.value}</span>
                    </div>
                    <div style={{ height: 10, background: 'var(--bg)', border: '2px solid var(--border)', borderRadius: 2, overflow: 'hidden' }}>
                      <div style={{ width: `${attendance.total ? (item.value / attendance.total) * 100 : 0}%`, height: '100%', background: item.color, transition: 'width 0.5s' }} />
                    </div>
                  </div>
                ))}
                <div style={{ marginTop: '1rem' }}>
                  <div className="label" style={{ marginBottom: '0.5rem' }}>Top Absence Reasons</div>
                  {attendance.reasons?.slice(0, 3).map(r => (
                    <div key={r._id} style={{ display: 'flex', justifyContent: 'space-between', padding: '0.4rem 0', borderBottom: '1px solid var(--border-light)', fontSize: '0.82rem' }}>
                      <span style={{ color: 'var(--text-secondary)' }}>{r._id}</span>
                      <span style={{ fontWeight: 700 }}>{r.count}x</span>
                    </div>
                  ))}
                </div>
              </>
            ) : <p style={{ color: 'var(--text-muted)' }}>No attendance data</p>}
          </div>
        </div>

        {/* Quick Actions */}
        <div style={{ marginTop: '1.5rem' }}>
          <div className="label" style={{ marginBottom: '0.75rem' }}>Quick Actions</div>
          <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
            <Link to="/admin/members/new" className="btn btn-primary">+ Add Member</Link>
            <Link to="/admin/members" className="btn btn-outline">View All Members</Link>
            <Link to="/admin/attendance" className="btn btn-outline">Attendance Report</Link>
          </div>
        </div>
      </div>
    </div>
  );
}
