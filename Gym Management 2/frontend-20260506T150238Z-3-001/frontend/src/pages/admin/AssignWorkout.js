import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import Sidebar from '../../components/Sidebar';
import Toast, { toast } from '../../components/Toast';
import api from '../../services/api';

const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
const FOCUSES = ['Chest & Triceps', 'Back & Biceps', 'Legs & Glutes', 'Shoulders & Traps', 'Full Body', 'Cardio', 'Core & Abs'];

const getWeekNumber = () => {
  const now = new Date();
  const start = new Date(now.getFullYear(), 0, 1);
  return Math.ceil(((now - start) / 86400000 + start.getDay() + 1) / 7);
};

const emptyDay = (dayName) => ({ dayName, isRestDay: false, focus: '', exercises: [] });
const emptyExercise = () => ({ name: '', sets: 3, reps: '10', rest: '60s', notes: '' });

export default function AssignWorkout() {
  const { userId } = useParams();
  const [memberName, setMemberName] = useState('');
  const [week, setWeek] = useState(getWeekNumber());
  const [year, setYear] = useState(new Date().getFullYear());
  const [days, setDays] = useState(DAYS.map(emptyDay));
  const [scheduleId, setScheduleId] = useState(null);
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [activeDay, setActiveDay] = useState(0);

  useEffect(() => {
    // Get member name
    api.get('/members').then(res => {
      const m = res.data.find(m => m.userId?._id === userId);
      if (m) setMemberName(m.userId?.name || '');
    }).catch(() => {});
  }, [userId]);

  useEffect(() => {
    setLoading(true);
    api.get(`/workout/${userId}?week=${week}&year=${year}`)
      .then(res => {
        const s = res.data;
        setScheduleId(s._id);
        setNotes(s.notes || '');
        // Merge fetched days with all DAYS (fill missing ones)
        const merged = DAYS.map(d => s.days?.find(sd => sd.dayName === d) || emptyDay(d));
        setDays(merged);
      })
      .catch(() => {
        setScheduleId(null);
        setDays(DAYS.map(emptyDay));
        setNotes('');
      })
      .finally(() => setLoading(false));
  }, [userId, week, year]);

  const updateDay = (idx, field, val) => {
    setDays(prev => prev.map((d, i) => i === idx ? { ...d, [field]: val } : d));
  };

  const addExercise = (dayIdx) => {
    setDays(prev => prev.map((d, i) => i === dayIdx ? { ...d, exercises: [...d.exercises, emptyExercise()] } : d));
  };

  const updateExercise = (dayIdx, exIdx, field, val) => {
    setDays(prev => prev.map((d, i) => {
      if (i !== dayIdx) return d;
      return { ...d, exercises: d.exercises.map((e, j) => j === exIdx ? { ...e, [field]: val } : e) };
    }));
  };

  const removeExercise = (dayIdx, exIdx) => {
    setDays(prev => prev.map((d, i) => {
      if (i !== dayIdx) return d;
      return { ...d, exercises: d.exercises.filter((_, j) => j !== exIdx) };
    }));
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await api.post('/workout', { userId, week, year, days, notes });
      toast('Workout schedule saved!', 'success');
    } catch (err) {
      toast(err.response?.data?.message || 'Save failed', 'error');
    } finally { setSaving(false); }
  };

  const currentDay = days[activeDay];

  return (
    <div className="app-layout">
      <Sidebar />
      <div className="main-content">
        <Toast />
        <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
          <div>
            <Link to="/admin/members" style={{ fontSize: '0.85rem', color: 'var(--text-muted)', fontWeight: 700, display: 'inline-block', marginBottom: '0.5rem' }}>← Members</Link>
            <div className="label">Assign Schedule</div>
            <h1>Workout Plan</h1>
            <p style={{ color: 'var(--text-secondary)' }}>{memberName || `User ${userId.slice(-6)}`}</p>
          </div>
          <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
            <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
              <label className="label">Week</label>
              <input className="form-input" type="number" min={1} max={53} value={week}
                onChange={e => setWeek(Number(e.target.value))} style={{ width: 70 }} />
              <label className="label">Year</label>
              <input className="form-input" type="number" value={year}
                onChange={e => setYear(Number(e.target.value))} style={{ width: 90 }} />
            </div>
            <button className="btn btn-primary" onClick={handleSave} disabled={saving}>
              {saving ? <><div className="spinner spinner-sm" /> Saving…</> : '💾 Save Schedule'}
            </button>
          </div>
        </div>

        {loading ? <div className="spinner-container"><div className="spinner" /></div> : (
          <div style={{ display: 'grid', gridTemplateColumns: '220px 1fr', gap: '1.5rem' }}>
            {/* Day Selector */}
            <div>
              <div style={{ marginBottom: '1rem' }}>
                {DAYS.map((d, i) => (
                  <button key={d} onClick={() => setActiveDay(i)}
                    style={{
                      width: '100%', textAlign: 'left', padding: '0.75rem 1rem',
                      background: activeDay === i ? 'var(--primary)' : 'white',
                      color: activeDay === i ? 'white' : 'var(--text)',
                      border: '2px solid var(--border)', borderBottom: i < 6 ? 'none' : '2px solid var(--border)',
                      cursor: 'pointer', fontWeight: 700, fontSize: '0.875rem',
                      display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                    }}>
                    <span>{d.slice(0, 3)}</span>
                    <span style={{ fontSize: '0.7rem', opacity: 0.8 }}>
                      {days[i]?.isRestDay ? '😴 Rest' : `${days[i]?.exercises?.length || 0} ex`}
                    </span>
                  </button>
                ))}
              </div>
              <div className="form-group">
                <label className="form-label">Week Notes</label>
                <textarea className="form-input" rows={4} value={notes} onChange={e => setNotes(e.target.value)} placeholder="General notes for this week…" />
              </div>
            </div>

            {/* Day Editor */}
            <div className="card">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
                <h3>{currentDay.dayName}</h3>
                <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.875rem', fontWeight: 700, cursor: 'pointer' }}>
                  <input type="checkbox" checked={currentDay.isRestDay}
                    onChange={e => updateDay(activeDay, 'isRestDay', e.target.checked)} />
                  Rest Day
                </label>
              </div>

              {currentDay.isRestDay ? (
                <div className="rest-day" style={{ padding: '3rem', fontSize: '1rem' }}>
                  😴 Rest & Recovery Day
                </div>
              ) : (
                <>
                  <div className="form-group" style={{ marginBottom: '1.5rem' }}>
                    <label className="form-label">Muscle Focus</label>
                    <select className="form-input" value={currentDay.focus}
                      onChange={e => updateDay(activeDay, 'focus', e.target.value)}>
                      <option value="">Select focus…</option>
                      {FOCUSES.map(f => <option key={f} value={f}>{f}</option>)}
                    </select>
                  </div>

                  <div style={{ marginBottom: '1rem' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
                      <div className="label">Exercises ({currentDay.exercises.length})</div>
                      <button className="btn btn-primary btn-sm" onClick={() => addExercise(activeDay)}>+ Add Exercise</button>
                    </div>

                    {currentDay.exercises.length === 0 && (
                      <div style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-muted)', border: '2px dashed var(--border-light)', borderRadius: 4 }}>
                        No exercises yet. Click "+ Add Exercise" to start.
                      </div>
                    )}

                    {currentDay.exercises.map((ex, exIdx) => (
                      <div key={exIdx} style={{ border: '2px solid var(--border-light)', borderRadius: 4, padding: '1rem', marginBottom: '0.75rem', background: 'var(--bg)' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.75rem' }}>
                          <div className="label">Exercise {exIdx + 1}</div>
                          <button className="btn btn-danger btn-sm" onClick={() => removeExercise(activeDay, exIdx)}>Remove</button>
                        </div>
                        <div className="form-group">
                          <label className="form-label">Name</label>
                          <input className="form-input" placeholder="e.g. Bench Press" value={ex.name}
                            onChange={e => updateExercise(activeDay, exIdx, 'name', e.target.value)} />
                        </div>
                        <div className="form-row-3">
                          <div className="form-group">
                            <label className="form-label">Sets</label>
                            <input className="form-input" type="number" min={1} value={ex.sets}
                              onChange={e => updateExercise(activeDay, exIdx, 'sets', Number(e.target.value))} />
                          </div>
                          <div className="form-group">
                            <label className="form-label">Reps</label>
                            <input className="form-input" placeholder="10-12" value={ex.reps}
                              onChange={e => updateExercise(activeDay, exIdx, 'reps', e.target.value)} />
                          </div>
                          <div className="form-group">
                            <label className="form-label">Rest</label>
                            <input className="form-input" placeholder="60s" value={ex.rest}
                              onChange={e => updateExercise(activeDay, exIdx, 'rest', e.target.value)} />
                          </div>
                        </div>
                        <div className="form-group" style={{ marginBottom: 0 }}>
                          <label className="form-label">Notes</label>
                          <input className="form-input" placeholder="Form tips, variations…" value={ex.notes}
                            onChange={e => updateExercise(activeDay, exIdx, 'notes', e.target.value)} />
                        </div>
                      </div>
                    ))}
                  </div>
                </>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
