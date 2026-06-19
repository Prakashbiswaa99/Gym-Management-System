import React, { useEffect, useState } from 'react';
import Sidebar from '../../components/Sidebar';
import Toast, { toast } from '../../components/Toast';
import { useAuth } from '../../context/AuthContext';
import api from '../../services/api';

const MONTHS = ['January','February','March','April','May','June','July','August','September','October','November','December'];

export default function AttendanceLog() {
  const { user } = useAuth();
  const now = new Date();
  const [month, setMonth] = useState(now.getMonth() + 1);
  const [year, setYear] = useState(now.getFullYear());
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showLog, setShowLog] = useState(false);
  const [form, setForm] = useState({ status: 'present', reason: '', checkInTime: '', date: now.toISOString().split('T')[0] });
  const [submitting, setSubmitting] = useState(false);

  const fetchAttendance = async () => {
    setLoading(true);
    try {
      const res = await api.get(`/attendance/me?month=${month}&year=${year}`);
      setRecords(res.data);
    } catch { toast('Failed to load attendance', 'error'); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchAttendance(); }, [month, year]);

  const handleSubmit = async e => {
    e.preventDefault();
    if ((form.status === 'absent' || form.status === 'late') && !form.reason.trim()) {
      toast('Reason is required for absent or late status', 'error'); return;
    }
    setSubmitting(true);
    try {
      await api.post('/attendance', form);
      toast('Attendance logged!', 'success');
      setShowLog(false);
      setForm({ status: 'present', reason: '', checkInTime: '', date: now.toISOString().split('T')[0] });
      fetchAttendance();
    } catch (err) {
      toast(err.response?.data?.message || 'Failed to log attendance', 'error');
    } finally { setSubmitting(false); }
  };

  // Build calendar grid
  const firstDay = new Date(year, month - 1, 1).getDay();
  const daysInMonth = new Date(year, month, 0).getDate();
  const calDays = [];
  for (let i = 0; i < (firstDay === 0 ? 6 : firstDay - 1); i++) calDays.push(null);
  for (let d = 1; d <= daysInMonth; d++) calDays.push(d);

  const getRecord = (day) => records.find(r => new Date(r.date).getDate() === day && new Date(r.date).getMonth() === month - 1);

  const present = records.filter(r => r.status === 'present').length;
  const absent = records.filter(r => r.status === 'absent').length;
  const late = records.filter(r => r.status === 'late').length;
  const rate = records.length ? Math.round((present / records.length) * 100) : 0;

  const todayRecord = records.find(r => {
    const d = new Date(r.date);
    return d.getDate() === now.getDate() && d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
  });

  return (
    <div className="app-layout">
      <Sidebar />
      <div className="main-content">
        <Toast />

        {/* Log Modal */}
        {showLog && (
          <div className="modal-overlay" onClick={() => setShowLog(false)}>
            <div className="modal" onClick={e => e.stopPropagation()} style={{ maxWidth: 460 }}>
              <div className="modal-header">
                <h3>Log Attendance</h3>
                <button className="modal-close" onClick={() => setShowLog(false)}>×</button>
              </div>
              <form onSubmit={handleSubmit}>
                <div className="modal-body">
                  <div className="form-group">
                    <label className="form-label">Date</label>
                    <input className="form-input" type="date" value={form.date}
                      onChange={e => setForm(f => ({ ...f, date: e.target.value }))}
                      max={now.toISOString().split('T')[0]} required />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Status</label>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: '0.5rem' }}>
                      {[
                        { val: 'present', icon: '✅', label: 'Present', color: 'var(--success)', bg: 'var(--success-light)' },
                        { val: 'late', icon: '⏰', label: 'Late', color: 'var(--warning)', bg: 'var(--warning-light)' },
                        { val: 'absent', icon: '❌', label: 'Absent', color: 'var(--danger)', bg: 'var(--danger-light)' },
                      ].map(s => (
                        <button type="button" key={s.val} onClick={() => setForm(f => ({ ...f, status: s.val }))}
                          style={{
                            padding: '0.75rem', border: `2px solid ${form.status === s.val ? s.color : 'var(--border-light)'}`,
                            borderRadius: 4, background: form.status === s.val ? s.bg : 'white',
                            fontWeight: 700, fontSize: '0.82rem', cursor: 'pointer', textAlign: 'center',
                          }}>
                          <div style={{ fontSize: '1.3rem', marginBottom: '0.2rem' }}>{s.icon}</div>
                          {s.label}
                        </button>
                      ))}
                    </div>
                  </div>
                  {(form.status === 'absent' || form.status === 'late') && (
                    <div className="form-group">
                      <label className="form-label">Reason <span style={{ color: 'var(--danger)' }}>*</span></label>
                      <textarea className="form-input" rows={3}
                        placeholder={form.status === 'absent' ? 'e.g. Sick, family emergency, travel…' : 'e.g. Traffic, overslept…'}
                        value={form.reason} onChange={e => setForm(f => ({ ...f, reason: e.target.value }))} required />
                    </div>
                  )}
                  {form.status !== 'absent' && (
                    <div className="form-group">
                      <label className="form-label">Check-in Time</label>
                      <input className="form-input" type="time" value={form.checkInTime}
                        onChange={e => setForm(f => ({ ...f, checkInTime: e.target.value }))} />
                    </div>
                  )}
                </div>
                <div className="modal-footer">
                  <button type="button" className="btn btn-outline" onClick={() => setShowLog(false)}>Cancel</button>
                  <button type="submit" className="btn btn-primary" disabled={submitting}>
                    {submitting ? <><div className="spinner spinner-sm" /> Saving…</> : 'Log Attendance'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
          <div>
            <div className="label">Tracking</div>
            <h1>My Attendance</h1>
            <p>{MONTHS[month-1]} {year}</p>
          </div>
          <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
            <select className="form-input" style={{ width: 'auto' }} value={month} onChange={e => setMonth(Number(e.target.value))}>
              {MONTHS.map((m, i) => <option key={i} value={i+1}>{m}</option>)}
            </select>
            <select className="form-input" style={{ width: 'auto' }} value={year} onChange={e => setYear(Number(e.target.value))}>
              {[2024,2025,2026].map(y => <option key={y} value={y}>{y}</option>)}
            </select>
            <button id="log-attendance-btn" className="btn btn-primary" onClick={() => setShowLog(true)}>
              + Log Today
            </button>
          </div>
        </div>

        {/* Today's status banner */}
        {month === now.getMonth() + 1 && year === now.getFullYear() && (
          <div style={{ marginBottom: '1.5rem', padding: '1rem 1.5rem', border: '2px solid var(--border)', borderRadius: 4, background: 'white', boxShadow: 'var(--shadow-sm)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <div className="label">Today — {now.toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long' })}</div>
              {todayRecord ? (
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginTop: '0.3rem' }}>
                  <span className={`badge badge-${todayRecord.status}`} style={{ fontSize: '0.82rem', padding: '0.3rem 0.75rem' }}>{todayRecord.status}</span>
                  {todayRecord.reason && <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Reason: {todayRecord.reason}</span>}
                  {todayRecord.checkInTime && <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Check-in: {todayRecord.checkInTime}</span>}
                </div>
              ) : <div style={{ marginTop: '0.3rem', fontWeight: 700, color: 'var(--warning)' }}>⚠️ Not logged yet</div>}
            </div>
            {!todayRecord && <button className="btn btn-primary btn-sm" onClick={() => setShowLog(true)}>Log Now →</button>}
          </div>
        )}

        {/* Stats */}
        <div className="stat-grid" style={{ marginBottom: '1.5rem' }}>
          <div className="stat-card green"><div className="stat-label">✅ Present</div><div className="stat-value">{present}</div></div>
          <div className="stat-card coral"><div className="stat-label">❌ Absent</div><div className="stat-value">{absent}</div></div>
          <div className="stat-card amber"><div className="stat-label">⏰ Late</div><div className="stat-value">{late}</div></div>
          <div className="stat-card indigo"><div className="stat-label">📊 Rate</div><div className="stat-value">{rate}%</div></div>
        </div>

        {/* Calendar + Records */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 340px', gap: '1.5rem' }}>
          {/* Calendar */}
          <div className="card">
            <h4 style={{ marginBottom: '1.25rem' }}>{MONTHS[month-1]} {year}</h4>
            <div className="calendar-grid">
              {['Mon','Tue','Wed','Thu','Fri','Sat','Sun'].map(d => (
                <div key={d} className="cal-day-label">{d}</div>
              ))}
              {calDays.map((day, i) => {
                if (!day) return <div key={`e-${i}`} className="cal-day empty" />;
                const rec = getRecord(day);
                const isToday = day === now.getDate() && month === now.getMonth() + 1 && year === now.getFullYear();
                return (
                  <div key={day} className={`cal-day${rec ? ` ${rec.status}` : ''}${isToday ? ' today' : ''}`}
                    title={rec ? `${rec.status}${rec.reason ? ': ' + rec.reason : ''}` : 'No record'}>
                    {day}
                    {rec && <div className="dot" style={{ background: rec.status === 'present' ? 'var(--success)' : rec.status === 'absent' ? 'var(--danger)' : 'var(--warning)' }} />}
                  </div>
                );
              })}
            </div>
            <div style={{ marginTop: '1.25rem', display: 'flex', gap: '1rem', fontSize: '0.75rem', fontWeight: 700 }}>
              {[{c:'var(--success)',l:'Present'},{c:'var(--danger)',l:'Absent'},{c:'var(--warning)',l:'Late'}].map(s => (
                <div key={s.l} style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                  <div style={{ width: 12, height: 12, borderRadius: 2, background: s.c }} />
                  {s.l}
                </div>
              ))}
            </div>
          </div>

          {/* Recent Records */}
          <div className="card" style={{ padding: 0 }}>
            <div style={{ padding: '1rem 1.25rem', borderBottom: '2px solid var(--border)', fontWeight: 800 }}>Recent Logs</div>
            {loading ? <div className="spinner-container"><div className="spinner" /></div>
              : records.length === 0 ? <div className="empty-state"><p>No records this month</p></div>
              : records.slice(0, 15).map(r => (
                <div key={r._id} style={{ padding: '0.75rem 1.25rem', borderBottom: '1px solid var(--border-light)', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <div>
                    <div style={{ fontWeight: 700, fontSize: '0.85rem' }}>
                      {new Date(r.date).toLocaleDateString('en-IN', { weekday: 'short', day: '2-digit', month: 'short' })}
                    </div>
                    {r.reason && <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: '0.15rem' }}>{r.reason}</div>}
                    {r.checkInTime && <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>In: {r.checkInTime}</div>}
                  </div>
                  <span className={`badge badge-${r.status}`}>{r.status}</span>
                </div>
              ))}
          </div>
        </div>
      </div>
    </div>
  );
}
