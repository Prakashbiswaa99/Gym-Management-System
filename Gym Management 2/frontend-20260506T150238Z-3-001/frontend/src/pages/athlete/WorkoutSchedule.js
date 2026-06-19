import React, { useEffect, useState } from 'react';
import Sidebar from '../../components/Sidebar';
import Toast, { toast } from '../../components/Toast';
import { useAuth } from '../../context/AuthContext';
import api from '../../services/api';

const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
const TODAY = ['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'][new Date().getDay()];

const getWeekNumber = () => {
  const now = new Date();
  const start = new Date(now.getFullYear(), 0, 1);
  return Math.ceil(((now - start) / 86400000 + start.getDay() + 1) / 7);
};

const MACRO_COLORS = { protein: '#4F46E5', carbs: '#F59E0B', fat: '#EF4444' };

export default function WorkoutSchedule() {
  const { user } = useAuth();
  const [schedule, setSchedule] = useState(null);
  const [loading, setLoading] = useState(true);
  const [week, setWeek] = useState(getWeekNumber());
  const [year, setYear] = useState(new Date().getFullYear());
  const [activeDay, setActiveDay] = useState(Math.max(0, DAYS.indexOf(TODAY)));

  useEffect(() => {
    setLoading(true);
    api.get(`/workout/${user._id}?week=${week}&year=${year}`)
      .then(res => setSchedule(res.data))
      .catch(() => setSchedule(null))
      .finally(() => setLoading(false));
  }, [user._id, week, year]);

  const currentDay = schedule?.days?.find(d => d.dayName === DAYS[activeDay]);

  return (
    <div className="app-layout">
      <Sidebar />
      <div className="main-content">
        <Toast />
        <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
          <div>
            <div className="label">My Schedule</div>
            <h1>Workout Plan</h1>
            <p>Week {week}, {year}</p>
          </div>
          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <button className="btn btn-outline btn-sm" onClick={() => setWeek(w => Math.max(1, w-1))}>← Prev</button>
            <span style={{ fontWeight: 700, padding: '0 0.5rem', display: 'flex', alignItems: 'center' }}>Week {week}</span>
            <button className="btn btn-outline btn-sm" onClick={() => setWeek(w => Math.min(53, w+1))}>Next →</button>
          </div>
        </div>

        {loading ? <div className="spinner-container"><div className="spinner" /></div> : !schedule ? (
          <div className="card empty-state"><h3>No workout plan yet</h3><p>Your trainer will assign a plan soon.</p></div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: '200px 1fr', gap: '1.5rem' }}>
            <div>
              {DAYS.map((d, i) => {
                const dayData = schedule.days?.find(sd => sd.dayName === d);
                const isToday = d === TODAY;
                return (
                  <button key={d} onClick={() => setActiveDay(i)} style={{
                    width: '100%', textAlign: 'left', padding: '0.75rem 1rem',
                    background: activeDay === i ? 'var(--text)' : isToday ? 'var(--primary-light)' : 'white',
                    color: activeDay === i ? 'white' : 'var(--text)',
                    border: '2px solid var(--border)', borderBottom: i < 6 ? 'none' : '2px solid var(--border)',
                    borderLeft: isToday && activeDay !== i ? '4px solid var(--primary)' : undefined,
                    cursor: 'pointer', fontWeight: 700, fontSize: '0.875rem',
                    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                  }}>
                    <span>{d.slice(0,3)} {isToday ? '·' : ''}</span>
                    <span style={{ fontSize: '0.68rem', opacity: 0.7 }}>
                      {dayData?.isRestDay ? '😴' : `${dayData?.exercises?.length || 0}ex`}
                    </span>
                  </button>
                );
              })}
            </div>

            <div className="card">
              {!currentDay ? <div className="empty-state"><p>No data for {DAYS[activeDay]}</p></div>
              : currentDay.isRestDay ? (
                <div style={{ textAlign: 'center', padding: '3rem' }}>
                  <div style={{ fontSize: '4rem', marginBottom: '1rem' }}>😴</div>
                  <h3>Rest & Recovery Day</h3>
                  <p style={{ color: 'var(--text-secondary)', marginTop: '0.5rem' }}>Light stretching or a walk is recommended.</p>
                </div>
              ) : (
                <>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1.5rem' }}>
                    <div>
                      <h3>{currentDay.dayName}</h3>
                      {currentDay.focus && <div className="badge badge-primary" style={{ marginTop: '0.4rem' }}>{currentDay.focus}</div>}
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <div style={{ fontWeight: 900, fontSize: '2rem', lineHeight: 1 }}>{currentDay.exercises?.length}</div>
                      <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>exercises</div>
                    </div>
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                    {currentDay.exercises?.map((ex, i) => (
                      <div key={i} style={{ background: 'var(--bg)', border: '2px solid var(--border-light)', borderRadius: 4, padding: '1rem 1.25rem', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                        <div>
                          <div style={{ fontWeight: 800, fontSize: '0.95rem' }}>
                            <span style={{ color: 'var(--primary)', marginRight: '0.5rem', fontSize: '0.78rem' }}>{String(i+1).padStart(2,'0')}.</span>
                            {ex.name}
                          </div>
                          {ex.notes && <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: '0.25rem' }}>💡 {ex.notes}</div>}
                        </div>
                        <div style={{ display: 'flex', gap: '0.4rem', flexShrink: 0, marginLeft: '1rem' }}>
                          {[{l:'Sets',v:ex.sets},{l:'Reps',v:ex.reps},{l:'Rest',v:ex.rest}].map(m => (
                            <div key={m.l} style={{ textAlign: 'center', background: 'white', border: '2px solid var(--border)', borderRadius: 4, padding: '0.35rem 0.55rem', minWidth: 48 }}>
                              <div style={{ fontWeight: 800, fontSize: '0.9rem' }}>{m.v}</div>
                              <div style={{ fontSize: '0.58rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>{m.l}</div>
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                  {schedule.notes && (
                    <div style={{ marginTop: '1.5rem', background: 'var(--primary-light)', border: '2px solid var(--primary)', borderRadius: 4, padding: '0.875rem 1rem' }}>
                      <div className="label" style={{ marginBottom: '0.25rem' }}>Trainer Notes</div>
                      <p style={{ fontSize: '0.875rem' }}>{schedule.notes}</p>
                    </div>
                  )}
                </>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
