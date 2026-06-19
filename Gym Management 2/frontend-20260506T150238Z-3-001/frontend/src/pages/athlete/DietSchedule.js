import React, { useEffect, useState } from 'react';
import Sidebar from '../../components/Sidebar';
import Toast, { toast } from '../../components/Toast';
import { useAuth } from '../../context/AuthContext';
import api from '../../services/api';

const DAYS = ['Monday','Tuesday','Wednesday','Thursday','Friday','Saturday','Sunday'];
const TODAY = ['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'][new Date().getDay()];
const getWeekNumber = () => {
  const now = new Date();
  const start = new Date(now.getFullYear(), 0, 1);
  return Math.ceil(((now - start) / 86400000 + start.getDay() + 1) / 7);
};

export default function DietSchedule() {
  const { user } = useAuth();
  const [schedule, setSchedule] = useState(null);
  const [loading, setLoading] = useState(true);
  const [week, setWeek] = useState(getWeekNumber());
  const [year, setYear] = useState(new Date().getFullYear());
  const [activeDay, setActiveDay] = useState(Math.max(0, DAYS.indexOf(TODAY)));

  useEffect(() => {
    setLoading(true);
    api.get(`/diet/${user._id}?week=${week}&year=${year}`)
      .then(res => setSchedule(res.data))
      .catch(() => setSchedule(null))
      .finally(() => setLoading(false));
  }, [user._id, week, year]);

  const currentDay = schedule?.days?.find(d => d.dayName === DAYS[activeDay]);
  const totalCals = currentDay?.meals?.reduce((acc, m) => acc + (m.foods?.reduce((a, f) => a + (f.calories || 0), 0) || 0), 0) || 0;
  const totalProtein = currentDay?.meals?.reduce((acc, m) => acc + (m.foods?.reduce((a, f) => a + (f.protein || 0), 0) || 0), 0) || 0;
  const totalCarbs = currentDay?.meals?.reduce((acc, m) => acc + (m.foods?.reduce((a, f) => a + (f.carbs || 0), 0) || 0), 0) || 0;
  const totalFat = currentDay?.meals?.reduce((acc, m) => acc + (m.foods?.reduce((a, f) => a + (f.fat || 0), 0) || 0), 0) || 0;

  const MEAL_ICONS = { breakfast: '🌅', lunch: '☀️', dinner: '🌙', snack: '🍎', 'pre-workout': '⚡', 'post-workout': '💪' };

  return (
    <div className="app-layout">
      <Sidebar />
      <div className="main-content">
        <Toast />
        <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
          <div>
            <div className="label">My Schedule</div>
            <h1>Diet Plan</h1>
            <p>Week {week}, {year}</p>
          </div>
          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <button className="btn btn-outline btn-sm" onClick={() => setWeek(w => Math.max(1, w-1))}>← Prev</button>
            <span style={{ fontWeight: 700, padding: '0 0.5rem', display: 'flex', alignItems: 'center' }}>Week {week}</span>
            <button className="btn btn-outline btn-sm" onClick={() => setWeek(w => Math.min(53, w+1))}>Next →</button>
          </div>
        </div>

        {loading ? <div className="spinner-container"><div className="spinner" /></div> : !schedule ? (
          <div className="card empty-state"><h3>No diet plan yet</h3><p>Your trainer will assign a diet plan soon.</p></div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: '200px 1fr', gap: '1.5rem' }}>
            {/* Day Nav */}
            <div>
              {DAYS.map((d, i) => {
                const dayData = schedule.days?.find(sd => sd.dayName === d);
                const isToday = d === TODAY;
                return (
                  <button key={d} onClick={() => setActiveDay(i)} style={{
                    width: '100%', textAlign: 'left', padding: '0.75rem 1rem',
                    background: activeDay === i ? 'var(--primary)' : isToday ? 'var(--primary-light)' : 'white',
                    color: activeDay === i ? 'white' : 'var(--text)',
                    border: '2px solid var(--border)', borderBottom: i < 6 ? 'none' : '2px solid var(--border)',
                    borderLeft: isToday && activeDay !== i ? '4px solid var(--primary)' : undefined,
                    cursor: 'pointer', fontWeight: 700, fontSize: '0.875rem',
                    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                  }}>
                    <span>{d.slice(0,3)}</span>
                    <span style={{ fontSize: '0.68rem', opacity: 0.75 }}>{dayData?.meals?.length || 0} meals</span>
                  </button>
                );
              })}
            </div>

            {/* Day Detail */}
            <div>
              {!currentDay ? <div className="card empty-state"><p>No data for {DAYS[activeDay]}</p></div> : (
                <>
                  {/* Macro Summary Bar */}
                  <div className="card" style={{ marginBottom: '1rem', padding: '1.25rem 1.5rem' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                      <h4>{currentDay.dayName}</h4>
                      <div style={{ display: 'flex', gap: '1rem', fontSize: '0.82rem' }}>
                        <span>🎯 Target: <strong>{currentDay.targetCalories} kcal</strong></span>
                        <span>💧 Water: <strong>{currentDay.waterIntake}</strong></span>
                      </div>
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '0.75rem' }}>
                      {[
                        { label: 'Calories', value: totalCals, unit: 'kcal', color: 'var(--text)', bg: 'var(--bg)' },
                        { label: 'Protein', value: totalProtein, unit: 'g', color: 'var(--primary)', bg: 'var(--primary-light)' },
                        { label: 'Carbs', value: totalCarbs, unit: 'g', color: 'var(--warning)', bg: 'var(--warning-light)' },
                        { label: 'Fat', value: totalFat, unit: 'g', color: 'var(--danger)', bg: 'var(--danger-light)' },
                      ].map(m => (
                        <div key={m.label} style={{ background: m.bg, border: `2px solid ${m.color}`, borderRadius: 4, padding: '0.75rem', textAlign: 'center' }}>
                          <div style={{ fontWeight: 900, fontSize: '1.4rem', color: m.color, lineHeight: 1 }}>{m.value}</div>
                          <div style={{ fontSize: '0.65rem', color: m.color, opacity: 0.8, textTransform: 'uppercase', letterSpacing: '0.08em', marginTop: '0.2rem' }}>{m.label} ({m.unit})</div>
                        </div>
                      ))}
                    </div>
                    {/* Calorie progress bar */}
                    <div style={{ marginTop: '0.875rem' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.72rem', marginBottom: '0.3rem', color: 'var(--text-muted)', fontWeight: 700 }}>
                        <span>Planned calories</span>
                        <span>{Math.round((totalCals / (currentDay.targetCalories || 1)) * 100)}% of target</span>
                      </div>
                      <div style={{ height: 8, background: 'var(--border-light)', border: '2px solid var(--border)', borderRadius: 2, overflow: 'hidden' }}>
                        <div style={{ width: `${Math.min(100, (totalCals / (currentDay.targetCalories || 1)) * 100)}%`, height: '100%', background: totalCals > currentDay.targetCalories ? 'var(--danger)' : 'var(--success)', transition: 'width 0.4s' }} />
                      </div>
                    </div>
                  </div>

                  {/* Meals */}
                  {currentDay.meals?.length === 0 ? (
                    <div className="card empty-state"><p>No meals planned for this day</p></div>
                  ) : currentDay.meals?.map((meal, mi) => (
                    <div key={mi} className="card" style={{ marginBottom: '0.875rem', padding: 0 }}>
                      <div style={{ padding: '0.875rem 1.25rem', borderBottom: '2px solid var(--border-light)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                          <span style={{ fontSize: '1.3rem' }}>{MEAL_ICONS[meal.type] || '🍽'}</span>
                          <div>
                            <div style={{ fontWeight: 800, textTransform: 'capitalize', fontSize: '0.95rem' }}>{meal.type}</div>
                            {meal.time && <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>{meal.time}</div>}
                          </div>
                        </div>
                        <div style={{ textAlign: 'right' }}>
                          <div style={{ fontWeight: 800, fontSize: '1.1rem', color: 'var(--primary)' }}>
                            {meal.foods?.reduce((a, f) => a + (f.calories || 0), 0)} kcal
                          </div>
                        </div>
                      </div>
                      <div style={{ padding: '0.875rem 1.25rem' }}>
                        {meal.foods?.map((food, fi) => (
                          <div key={fi} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.45rem 0', borderBottom: fi < meal.foods.length - 1 ? '1px solid var(--border-light)' : 'none' }}>
                            <div>
                              <span style={{ fontWeight: 600, fontSize: '0.875rem' }}>{food.name || '—'}</span>
                              {food.quantity && <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginLeft: '0.5rem' }}>{food.quantity}</span>}
                            </div>
                            <div style={{ display: 'flex', gap: '0.75rem', fontSize: '0.72rem', color: 'var(--text-secondary)' }}>
                              {food.protein > 0 && <span style={{ color: 'var(--primary)', fontWeight: 700 }}>{food.protein}g P</span>}
                              {food.carbs > 0 && <span style={{ color: 'var(--warning)', fontWeight: 700 }}>{food.carbs}g C</span>}
                              {food.fat > 0 && <span style={{ color: 'var(--danger)', fontWeight: 700 }}>{food.fat}g F</span>}
                              <span style={{ fontWeight: 700 }}>{food.calories} kcal</span>
                            </div>
                          </div>
                        ))}
                        {meal.notes && (
                          <div style={{ marginTop: '0.75rem', fontSize: '0.78rem', color: 'var(--text-secondary)', fontStyle: 'italic' }}>💡 {meal.notes}</div>
                        )}
                      </div>
                    </div>
                  ))}

                  {schedule.notes && (
                    <div style={{ background: 'var(--primary-light)', border: '2px solid var(--primary)', borderRadius: 4, padding: '0.875rem 1rem' }}>
                      <div className="label" style={{ marginBottom: '0.25rem' }}>Dietitian Notes</div>
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
