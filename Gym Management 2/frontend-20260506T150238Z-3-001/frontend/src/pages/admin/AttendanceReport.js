import React, { useEffect, useState } from 'react';
import Sidebar from '../../components/Sidebar';
import Toast, { toast } from '../../components/Toast';
import api from '../../services/api';

const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

const getWeekNumber = (d) => {
  const date = new Date(d);
  date.setHours(0, 0, 0, 0);
  date.setDate(date.getDate() + 4 - (date.getDay() || 7));
  const yearStart = new Date(date.getFullYear(), 0, 1);
  return Math.ceil(((date - yearStart) / 86400000 + 1) / 7);
};

export default function AttendanceReport() {
  const [members, setMembers] = useState([]);
  const [summary, setSummary] = useState(null);
  const [selectedMember, setSelectedMember] = useState(null);
  const [memberAttendance, setMemberAttendance] = useState([]);
  const [loading, setLoading] = useState(true);
  const now = new Date();
  const [month, setMonth] = useState(now.getMonth() + 1);
  const [year, setYear] = useState(now.getFullYear());

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const [mRes, sRes] = await Promise.all([
          api.get('/members'),
          api.get(`/attendance/summary?month=${month}&year=${year}`),
        ]);
        setMembers(mRes.data);
        setSummary(sRes.data);
      } catch { toast('Failed to load attendance', 'error'); }
      finally { setLoading(false); }
    };
    load();
  }, [month, year]);

  const loadMemberAttendance = async (userId) => {
    setSelectedMember(userId);
    try {
      const res = await api.get(`/attendance/${userId}?month=${month}&year=${year}`);
      setMemberAttendance(res.data);
    } catch { setMemberAttendance([]); }
  };

  const calendarDays = () => {
    const days = [];
    const firstDay = new Date(year, month - 1, 1).getDay();
    const daysInMonth = new Date(year, month, 0).getDate();
    for (let i = 0; i < (firstDay === 0 ? 6 : firstDay - 1); i++) days.push(null);
    for (let d = 1; d <= daysInMonth; d++) days.push(d);
    return days;
  };

  const getStatusForDay = (day) => {
    if (!day) return null;
    const record = memberAttendance.find(a => new Date(a.date).getDate() === day);
    return record?.status || null;
  };

  const MONTHS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];

  return (
    <div className="app-layout">
      <Sidebar />
      <div className="main-content">
        <Toast />
        <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
          <div>
            <div className="label">Reports</div>
            <h1>Attendance</h1>
            <p>Monitor member attendance and spot patterns</p>
          </div>
          <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
            <select className="form-input" style={{ width: 'auto' }} value={month} onChange={e => setMonth(Number(e.target.value))}>
              {MONTHS.map((m, i) => <option key={i} value={i + 1}>{m}</option>)}
            </select>
            <select className="form-input" style={{ width: 'auto' }} value={year} onChange={e => setYear(Number(e.target.value))}>
              {[2024, 2025, 2026].map(y => <option key={y} value={y}>{y}</option>)}
            </select>
          </div>
        </div>

        {/* Summary Stats */}
        {summary && (
          <div className="stat-grid" style={{ marginBottom: '2rem' }}>
            <div className="stat-card green"><div className="stat-label">✅ Present</div><div className="stat-value">{summary.present}</div></div>
            <div className="stat-card coral"><div className="stat-label">❌ Absent</div><div className="stat-value">{summary.absent}</div></div>
            <div className="stat-card amber"><div className="stat-label">⏰ Late</div><div className="stat-value">{summary.late}</div></div>
            <div className="stat-card indigo"><div className="stat-label">📊 Total Logs</div><div className="stat-value">{summary.total}</div></div>
          </div>
        )}

        <div style={{ display: 'grid', gridTemplateColumns: '280px 1fr', gap: '1.5rem' }}>
          {/* Member List */}
          <div className="card" style={{ padding: 0 }}>
            <div style={{ padding: '1rem 1.25rem', borderBottom: '2px solid var(--border)', fontWeight: 800, fontSize: '0.9rem' }}>Members</div>
            {loading ? <div className="spinner-container"><div className="spinner" /></div> :
              members.map(m => (
                <button key={m._id} onClick={() => loadMemberAttendance(m.userId?._id)}
                  style={{ width: '100%', display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '0.875rem 1.25rem', background: selectedMember === m.userId?._id ? 'var(--primary-light)' : 'white', border: 'none', borderBottom: '1px solid var(--border-light)', cursor: 'pointer', textAlign: 'left', borderLeft: selectedMember === m.userId?._id ? '3px solid var(--primary)' : '3px solid transparent' }}>
                  <div style={{ width: 34, height: 34, borderRadius: '50%', background: 'var(--primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontWeight: 800, fontSize: '0.8rem', flexShrink: 0 }}>
                    {m.userId?.name?.[0] ?? '?'}
                  </div>
                  <div style={{ minWidth: 0 }}>
                    <div style={{ fontWeight: 700, fontSize: '0.85rem', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{m.userId?.name}</div>
                    <span className={`badge badge-${m.status}`} style={{ fontSize: '0.62rem' }}>{m.status}</span>
                  </div>
                </button>
              ))
            }
          </div>

          {/* Calendar */}
          <div className="card">
            {selectedMember ? (
              <>
                <h4 style={{ marginBottom: '1.25rem' }}>
                  {members.find(m => m.userId?._id === selectedMember)?.userId?.name} — {MONTHS[month - 1]} {year}
                </h4>
                <div className="calendar-grid">
                  {['Mon','Tue','Wed','Thu','Fri','Sat','Sun'].map(d => (
                    <div key={d} className="cal-day-label">{d}</div>
                  ))}
                  {calendarDays().map((day, i) => {
                    if (!day) return <div key={`e-${i}`} className="cal-day empty" />;
                    const status = getStatusForDay(day);
                    return (
                      <div key={day} className={`cal-day${status ? ` ${status}` : ''}`} title={status || 'No record'}>
                        <span>{day}</span>
                        {status && <div className={`dot`} style={{ background: status === 'present' ? 'var(--success)' : status === 'absent' ? 'var(--danger)' : 'var(--warning)' }} />}
                      </div>
                    );
                  })}
                </div>
                {/* Absence Reasons */}
                {memberAttendance.filter(a => a.reason).length > 0 && (
                  <div style={{ marginTop: '1.5rem' }}>
                    <div className="label" style={{ marginBottom: '0.75rem' }}>Absence / Late Reasons</div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                      {memberAttendance.filter(a => a.reason).map(a => (
                        <div key={a._id} style={{ display: 'flex', gap: '1rem', alignItems: 'center', padding: '0.6rem 0.875rem', background: 'var(--bg)', border: '2px solid var(--border-light)', borderRadius: 4 }}>
                          <span className={`badge badge-${a.status}`}>{a.status}</span>
                          <span style={{ fontSize: '0.8rem', fontWeight: 600 }}>{new Date(a.date).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' })}</span>
                          <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>{a.reason}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </>
            ) : (
              <div className="empty-state">
                <h3>Select a member</h3>
                <p>Click a member on the left to view their attendance calendar</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
