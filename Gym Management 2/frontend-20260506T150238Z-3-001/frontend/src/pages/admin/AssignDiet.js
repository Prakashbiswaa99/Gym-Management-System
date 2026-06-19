import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import Sidebar from '../../components/Sidebar';
import Toast, { toast } from '../../components/Toast';
import api from '../../services/api';

const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
const MEAL_TYPES = ['breakfast', 'lunch', 'dinner', 'snack', 'pre-workout', 'post-workout'];

const getWeekNumber = () => {
  const now = new Date();
  const start = new Date(now.getFullYear(), 0, 1);
  return Math.ceil(((now - start) / 86400000 + start.getDay() + 1) / 7);
};

const emptyFood = () => ({ name: '', quantity: '', calories: 0, protein: 0, carbs: 0, fat: 0 });
const emptyMeal = () => ({ type: 'breakfast', time: '', foods: [emptyFood()], totalCalories: 0, notes: '' });
const emptyDay = (dayName) => ({ dayName, meals: [], targetCalories: 2000, waterIntake: '3L' });

export default function AssignDiet() {
  const { userId } = useParams();
  const [memberName, setMemberName] = useState('');
  const [week, setWeek] = useState(getWeekNumber());
  const [year, setYear] = useState(new Date().getFullYear());
  const [days, setDays] = useState(DAYS.map(emptyDay));
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [activeDay, setActiveDay] = useState(0);
  const [activeMeal, setActiveMeal] = useState(null);

  useEffect(() => {
    api.get('/members').then(res => {
      const m = res.data.find(m => m.userId?._id === userId);
      if (m) setMemberName(m.userId?.name || '');
    }).catch(() => {});
  }, [userId]);

  useEffect(() => {
    setLoading(true);
    api.get(`/diet/${userId}?week=${week}&year=${year}`)
      .then(res => {
        const s = res.data;
        setNotes(s.notes || '');
        const merged = DAYS.map(d => s.days?.find(sd => sd.dayName === d) || emptyDay(d));
        setDays(merged);
      })
      .catch(() => { setDays(DAYS.map(emptyDay)); setNotes(''); })
      .finally(() => setLoading(false));
  }, [userId, week, year]);

  const updateDay = (idx, field, val) =>
    setDays(prev => prev.map((d, i) => i === idx ? { ...d, [field]: val } : d));

  const addMeal = (dayIdx) => {
    setDays(prev => prev.map((d, i) => {
      if (i !== dayIdx) return d;
      const newMeals = [...d.meals, emptyMeal()];
      setActiveMeal(newMeals.length - 1);
      return { ...d, meals: newMeals };
    }));
  };

  const removeMeal = (dayIdx, mIdx) => {
    setDays(prev => prev.map((d, i) => i !== dayIdx ? d : { ...d, meals: d.meals.filter((_, j) => j !== mIdx) }));
    setActiveMeal(null);
  };

  const updateMeal = (dayIdx, mIdx, field, val) =>
    setDays(prev => prev.map((d, i) => {
      if (i !== dayIdx) return d;
      return { ...d, meals: d.meals.map((m, j) => j === mIdx ? { ...m, [field]: val } : m) };
    }));

  const addFood = (dayIdx, mIdx) =>
    setDays(prev => prev.map((d, i) => {
      if (i !== dayIdx) return d;
      return { ...d, meals: d.meals.map((m, j) => j !== mIdx ? m : { ...m, foods: [...m.foods, emptyFood()] }) };
    }));

  const updateFood = (dayIdx, mIdx, fIdx, field, val) =>
    setDays(prev => prev.map((d, i) => {
      if (i !== dayIdx) return d;
      return {
        ...d, meals: d.meals.map((m, j) => j !== mIdx ? m : {
          ...m, foods: m.foods.map((f, k) => k !== fIdx ? f : { ...f, [field]: field === 'name' || field === 'quantity' ? val : Number(val) }),
        })
      };
    }));

  const removeFood = (dayIdx, mIdx, fIdx) =>
    setDays(prev => prev.map((d, i) => {
      if (i !== dayIdx) return d;
      return { ...d, meals: d.meals.map((m, j) => j !== mIdx ? m : { ...m, foods: m.foods.filter((_, k) => k !== fIdx) }) };
    }));

  const handleSave = async () => {
    setSaving(true);
    try {
      await api.post('/diet', { userId, week, year, days, notes });
      toast('Diet plan saved!', 'success');
    } catch (err) {
      toast(err.response?.data?.message || 'Save failed', 'error');
    } finally { setSaving(false); }
  };

  const currentDay = days[activeDay];
  const meal = activeMeal !== null ? currentDay?.meals?.[activeMeal] : null;

  return (
    <div className="app-layout">
      <Sidebar />
      <div className="main-content">
        <Toast />
        <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
          <div>
            <Link to="/admin/members" style={{ fontSize: '0.85rem', color: 'var(--text-muted)', fontWeight: 700, display: 'inline-block', marginBottom: '0.5rem' }}>← Members</Link>
            <div className="label">Assign Schedule</div>
            <h1>Diet Plan</h1>
            <p style={{ color: 'var(--text-secondary)' }}>{memberName || `User ${userId.slice(-6)}`}</p>
          </div>
          <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
            <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
              <label className="label">Week</label>
              <input className="form-input" type="number" min={1} max={53} value={week} onChange={e => setWeek(Number(e.target.value))} style={{ width: 70 }} />
              <label className="label">Year</label>
              <input className="form-input" type="number" value={year} onChange={e => setYear(Number(e.target.value))} style={{ width: 90 }} />
            </div>
            <button className="btn btn-primary" onClick={handleSave} disabled={saving}>
              {saving ? <><div className="spinner spinner-sm" /> Saving…</> : '💾 Save Diet'}
            </button>
          </div>
        </div>

        {loading ? <div className="spinner-container"><div className="spinner" /></div> : (
          <div style={{ display: 'grid', gridTemplateColumns: '220px 1fr', gap: '1.5rem' }}>
            {/* Day Selector */}
            <div>
              {DAYS.map((d, i) => (
                <button key={d} onClick={() => { setActiveDay(i); setActiveMeal(null); }}
                  style={{
                    width: '100%', textAlign: 'left', padding: '0.75rem 1rem',
                    background: activeDay === i ? 'var(--primary)' : 'white',
                    color: activeDay === i ? 'white' : 'var(--text)',
                    border: '2px solid var(--border)', borderBottom: i < 6 ? 'none' : '2px solid var(--border)',
                    cursor: 'pointer', fontWeight: 700, fontSize: '0.875rem',
                    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                  }}>
                  <span>{d.slice(0, 3)}</span>
                  <span style={{ fontSize: '0.7rem', opacity: 0.8 }}>{days[i]?.meals?.length || 0} meals</span>
                </button>
              ))}
            </div>

            {/* Day Editor */}
            <div>
              <div className="card" style={{ marginBottom: '1rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                  <h3>{currentDay?.dayName}</h3>
                  <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
                    <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', fontSize: '0.85rem' }}>
                      <span style={{ fontWeight: 700 }}>Target:</span>
                      <input className="form-input" type="number" value={currentDay?.targetCalories}
                        onChange={e => updateDay(activeDay, 'targetCalories', Number(e.target.value))}
                        style={{ width: 80 }} />
                      <span>kcal</span>
                    </div>
                    <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', fontSize: '0.85rem' }}>
                      <span style={{ fontWeight: 700 }}>Water:</span>
                      <input className="form-input" value={currentDay?.waterIntake}
                        onChange={e => updateDay(activeDay, 'waterIntake', e.target.value)}
                        style={{ width: 60 }} />
                    </div>
                    <button className="btn btn-primary btn-sm" onClick={() => addMeal(activeDay)}>+ Meal</button>
                  </div>
                </div>

                {/* Meal list */}
                <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                  {currentDay?.meals?.map((m, i) => (
                    <button key={i} onClick={() => setActiveMeal(i)}
                      className={`method-tab${activeMeal === i ? ' active' : ''}`}
                      style={{ textTransform: 'capitalize', flex: 'none' }}>
                      {m.type}
                    </button>
                  ))}
                  {currentDay?.meals?.length === 0 && <span style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>No meals yet. Add one above.</span>}
                </div>
              </div>

              {/* Meal Editor */}
              {meal && (
                <div className="card">
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1.25rem' }}>
                    <h4>Edit Meal</h4>
                    <button className="btn btn-danger btn-sm" onClick={() => removeMeal(activeDay, activeMeal)}>Remove Meal</button>
                  </div>
                  <div className="form-row">
                    <div className="form-group">
                      <label className="form-label">Meal Type</label>
                      <select className="form-input" value={meal.type} onChange={e => updateMeal(activeDay, activeMeal, 'type', e.target.value)}>
                        {MEAL_TYPES.map(t => <option key={t} value={t} style={{ textTransform: 'capitalize' }}>{t}</option>)}
                      </select>
                    </div>
                    <div className="form-group">
                      <label className="form-label">Time</label>
                      <input className="form-input" placeholder="e.g. 7:00 AM" value={meal.time} onChange={e => updateMeal(activeDay, activeMeal, 'time', e.target.value)} />
                    </div>
                  </div>

                  <div className="label" style={{ marginBottom: '0.75rem' }}>Food Items</div>
                  {meal.foods.map((food, fIdx) => (
                    <div key={fIdx} style={{ border: '2px solid var(--border-light)', borderRadius: 4, padding: '0.875rem', marginBottom: '0.75rem', background: 'var(--bg)' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.6rem' }}>
                        <span style={{ fontWeight: 700, fontSize: '0.8rem' }}>Item {fIdx + 1}</span>
                        <button className="btn btn-danger btn-sm" onClick={() => removeFood(activeDay, activeMeal, fIdx)}>×</button>
                      </div>
                      <div className="form-row">
                        <div className="form-group" style={{ marginBottom: '0.5rem' }}>
                          <label className="form-label">Food Name</label>
                          <input className="form-input" placeholder="Chicken breast" value={food.name} onChange={e => updateFood(activeDay, activeMeal, fIdx, 'name', e.target.value)} />
                        </div>
                        <div className="form-group" style={{ marginBottom: '0.5rem' }}>
                          <label className="form-label">Quantity</label>
                          <input className="form-input" placeholder="200g" value={food.quantity} onChange={e => updateFood(activeDay, activeMeal, fIdx, 'quantity', e.target.value)} />
                        </div>
                      </div>
                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: '0.5rem' }}>
                        {['calories', 'protein', 'carbs', 'fat'].map(macro => (
                          <div key={macro} className="form-group" style={{ marginBottom: 0 }}>
                            <label className="form-label">{macro === 'calories' ? 'Kcal' : macro.charAt(0).toUpperCase() + macro.slice(1) + ' (g)'}</label>
                            <input className="form-input" type="number" min={0} value={food[macro]} onChange={e => updateFood(activeDay, activeMeal, fIdx, macro, e.target.value)} />
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                  <button className="btn btn-outline btn-sm" onClick={() => addFood(activeDay, activeMeal)}>+ Add Food Item</button>

                  <div className="form-group" style={{ marginTop: '1rem', marginBottom: 0 }}>
                    <label className="form-label">Meal Notes</label>
                    <input className="form-input" placeholder="Preparation tips, substitutions…" value={meal.notes} onChange={e => updateMeal(activeDay, activeMeal, 'notes', e.target.value)} />
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
