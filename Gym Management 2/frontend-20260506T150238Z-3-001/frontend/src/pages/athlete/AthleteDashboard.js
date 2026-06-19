import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import Sidebar from '../../components/Sidebar';
import Toast, { toast } from '../../components/Toast';
import { useAuth } from '../../context/AuthContext';
import api from '../../services/api';

const getWeekNumber = () => {
  const now = new Date();
  const start = new Date(now.getFullYear(), 0, 1);
  return Math.ceil(((now - start) / 86400000 + start.getDay() + 1) / 7);
};

const TODAY = ['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'][new Date().getDay()];

export default function AthleteDashboard() {
  const { user } = useAuth();
  const [member, setMember] = useState(null);
  const [workout, setWorkout] = useState(null);
  const [diet, setDiet] = useState(null);
  const [attendance, setAttendance] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const now = new Date();
    const week = getWeekNumber();
    Promise.all([
      api.get('/members/me'),
      api.get(`/workout/${user._id}?week=${week}&year=${now.getFullYear()}`).catch(() => ({ data: null })),
      api.get(`/diet/${user._id}?week=${week}&year=${now.getFullYear()}`).catch(() => ({ data: null })),
      api.get(`/attendance/me?month=${now.getMonth() + 1}&year=${now.getFullYear()}`),
    ]).then(([m, w, d, a]) => {
      setMember(m.data);
      setWorkout(w.data);
      setDiet(d.data);
      setAttendance(a.data);
    }).catch(() => toast('Could not load all data', 'error'))
      .finally(() => setLoading(false));
  }, [user._id]);

  const todayWorkout = workout?.days?.find(d => d.dayName === TODAY);
  const todayDiet = diet?.days?.find(d => d.dayName === TODAY);
  const daysLeft = member?.expiryDate ? Math.ceil((new Date(member.expiryDate) - new Date()) / 86400000) : null;

  const presentDays = attendance.filter(a => a.status === 'present').length;
  const absentDays = attendance.filter(a => a.status === 'absent').length;
  const streak = (() => {
    let s = 0;
    const sorted = [...attendance].sort((a, b) => new Date(b.date) - new Date(a.date));
    for (const r of sorted) { if (r.status === 'present') s++; else break; }
    return s;
  })();

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
          <div className="label">Welcome back</div>
          <h1>{user.name.split(' ')[0]}'s Dashboard</h1>
          <p style={{ color: 'var(--text-secondary)' }}>{new Date().toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}</p>
        </div>

        {/* Membership Alert */}
        {daysLeft !== null && daysLeft <= 7 && (
          <div className={`alert ${daysLeft < 0 ? 'alert-error' : 'alert-warning'}`} style={{ marginBottom: '1.5rem' }}>
            {daysLeft < 0 ? `⚠️ Your membership expired ${Math.abs(daysLeft)} days ago. Please renew with the gym.`
              : `⏰ Your membership expires in ${daysLeft} day${daysLeft !== 1 ? 's' : ''}. Contact admin to renew.`}
          </div>
        )}

        {/* Stats */}
        <div className="stat-grid">
          <div className="stat-card indigo">
            <div className="stat-label">🔥 Streak</div>
            <div className="stat-value">{streak}</div>
            <div className="stat-sub">Consecutive days</div>
          </div>
          <div className="stat-card green">
            <div className="stat-label">✅ Present</div>
            <div className="stat-value">{presentDays}</div>
            <div className="stat-sub">This month</div>
          </div>
          <div className="stat-card coral">
            <div className="stat-label">❌ Absent</div>
            <div className="stat-value">{absentDays}</div>
            <div className="stat-sub">This month</div>
          </div>
          <div className="stat-card amber">
            <div className="stat-label">📅 Membership</div>
            <div className="stat-value" style={{ fontSize: '1.5rem' }}>{daysLeft !== null ? (daysLeft > 0 ? `${daysLeft}d` : 'Expired') : '—'}</div>
            <div className="stat-sub" style={{ textTransform: 'capitalize' }}>{member?.membershipType} plan</div>
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem', marginBottom: '1.5rem' }}>
          {/* Today's Workout */}
          <div className="card" style={{ padding: 0 }}>
            <div style={{ padding: '1rem 1.5rem', borderBottom: '2px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'var(--text)', borderRadius: '4px 4px 0 0' }}>
              <h4 style={{ color: 'white' }}>💪 Today's Workout</h4>
              <Link to="/athlete/workout" className="btn btn-sm" style={{ background: 'rgba(255,255,255,0.15)', color: 'white', border: '2px solid rgba(255,255,255,0.3)' }}>Full Plan</Link>
            </div>
            <div style={{ padding: '1.25rem 1.5rem' }}>
              {!workout ? (
                <div className="empty-state" style={{ padding: '1.5rem' }}>
                  <p>No workout plan assigned yet</p>
                  <p style={{ fontSize: '0.8rem', marginTop: '0.25rem' }}>Your trainer will set this up soon</p>
                </div>
              ) : todayWorkout?.isRestDay ? (
                <div style={{ textAlign: 'center', padding: '1.5rem', color: 'var(--text-muted)', fontWeight: 700 }}>😴 Rest Day — Recover Well!</div>
              ) : todayWorkout ? (
                <>
                  {todayWorkout.focus && <div className="badge badge-primary" style={{ marginBottom: '0.875rem' }}>{todayWorkout.focus}</div>}
                  {todayWorkout.exercises.slice(0, 4).map((ex, i) => (
                    <div key={i} className="exercise-item">
                      <div>
                        <div className="exercise-name">{ex.name}</div>
                        <div className="exercise-meta">{ex.sets} sets × {ex.reps} reps</div>
                      </div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 600 }}>Rest {ex.rest}</div>
                    </div>
                  ))}
                  {todayWorkout.exercises.length > 4 && (
                    <div style={{ fontSize: '0.8rem', color: 'var(--primary)', fontWeight: 700, marginTop: '0.5rem' }}>+{todayWorkout.exercises.length - 4} more exercises</div>
                  )}
                </>
              ) : (
                <div style={{ textAlign: 'center', padding: '1.5rem', color: 'var(--text-muted)' }}>No workout for today ({TODAY})</div>
              )}
            </div>
          </div>

          {/* Today's Diet */}
          <div className="card" style={{ padding: 0 }}>
            <div style={{ padding: '1rem 1.5rem', borderBottom: '2px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'var(--primary)', borderRadius: '4px 4px 0 0' }}>
              <h4 style={{ color: 'white' }}>🥗 Today's Diet</h4>
              <Link to="/athlete/diet" className="btn btn-sm" style={{ background: 'rgba(255,255,255,0.15)', color: 'white', border: '2px solid rgba(255,255,255,0.3)' }}>Full Plan</Link>
            </div>
            <div style={{ padding: '1.25rem 1.5rem' }}>
              {!diet ? (
                <div className="empty-state" style={{ padding: '1.5rem' }}>
                  <p>No diet plan assigned yet</p>
                </div>
              ) : todayDiet ? (
                <>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.875rem', fontSize: '0.82rem' }}>
                    <span style={{ fontWeight: 700 }}>Target: {todayDiet.targetCalories} kcal</span>
                    <span style={{ color: 'var(--text-muted)' }}>💧 {todayDiet.waterIntake}</span>
                  </div>
                  {todayDiet.meals.slice(0, 4).map((m, i) => (
                    <div key={i} style={{ display: 'flex', justifyContent: 'space-between', padding: '0.5rem 0', borderBottom: '1px solid var(--border-light)', fontSize: '0.85rem' }}>
                      <div>
                        <span style={{ fontWeight: 700, textTransform: 'capitalize' }}>{m.type}</span>
                        {m.time && <span style={{ color: 'var(--text-muted)', marginLeft: '0.5rem', fontSize: '0.78rem' }}>{m.time}</span>}
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>{m.foods.map(f => f.name).filter(Boolean).join(', ')}</div>
                      </div>
                      <span style={{ fontWeight: 700, color: 'var(--primary)', fontSize: '0.82rem' }}>{m.totalCalories || m.foods.reduce((acc, f) => acc + (f.calories || 0), 0)} kcal</span>
                    </div>
                  ))}
                </>
              ) : (
                <div style={{ textAlign: 'center', padding: '1.5rem', color: 'var(--text-muted)' }}>No diet for today ({TODAY})</div>
              )}
            </div>
          </div>
        </div>

        {/* Log Today's Attendance CTA */}
        <div style={{ background: 'var(--text)', border: '2px solid var(--border)', borderRadius: 4, boxShadow: 'var(--shadow)', padding: '1.5rem 2rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <div style={{ color: 'rgba(255,255,255,0.5)', fontSize: '0.75rem', fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: '0.3rem' }}>Quick Action</div>
            <h3 style={{ color: 'white', fontSize: '1.25rem' }}>Log Today's Attendance</h3>
            <p style={{ color: 'rgba(255,255,255,0.55)', fontSize: '0.85rem', marginTop: '0.25rem' }}>Mark yourself present, late, or log a reason for absence</p>
          </div>
          <Link to="/athlete/attendance" className="btn btn-primary btn-lg">Log Attendance →</Link>
        </div>
      </div>
    </div>
  );
}
