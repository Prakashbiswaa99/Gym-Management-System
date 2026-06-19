import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import Toast from '../components/Toast';

export default function Register() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ name: '', email: '', password: '', role: 'athlete' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleChange = e => setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async e => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const res = await api.post('/auth/register', form);
      login({ _id: res.data._id, name: res.data.name, email: res.data.email, role: res.data.role }, res.data.token);
      navigate(res.data.role === 'admin' ? '/admin' : '/athlete');
    } catch (err) {
      setError(err.response?.data?.message || err.response?.data?.errors?.[0]?.msg || 'Registration failed.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '2rem' }}>
      <Toast />
      <div style={{ width: '100%', maxWidth: 480 }}>
        <div style={{ marginBottom: '2rem' }}>
          <Link to="/login" style={{ fontSize: '0.85rem', color: 'var(--text-muted)', fontWeight: 700 }}>← Back to Login</Link>
          <h1 style={{ marginTop: '1rem', fontSize: '2.5rem' }}>Create Account</h1>
          <p style={{ color: 'var(--text-secondary)', marginTop: '0.4rem' }}>Join GymOS today.</p>
        </div>

        <div className="card" style={{ boxShadow: 'var(--shadow-lg)' }}>
          {error && <div className="alert alert-error">{error}</div>}
          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label className="form-label">Full Name</label>
              <input id="reg-name" name="name" type="text" className="form-input" placeholder="John Doe"
                value={form.name} onChange={handleChange} required />
            </div>
            <div className="form-group">
              <label className="form-label">Email Address</label>
              <input id="reg-email" name="email" type="email" className="form-input" placeholder="you@example.com"
                value={form.email} onChange={handleChange} required />
            </div>
            <div className="form-group">
              <label className="form-label">Password</label>
              <input id="reg-password" name="password" type="password" className="form-input" placeholder="Min. 6 characters"
                value={form.password} onChange={handleChange} required minLength={6} />
            </div>
            <div className="form-group">
              <label className="form-label">Account Type</label>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                {['athlete', 'admin'].map(r => (
                  <label key={r} style={{
                    border: `2px solid ${form.role === r ? 'var(--primary)' : 'var(--border)'}`,
                    borderRadius: 4, padding: '0.875rem', cursor: 'pointer', textAlign: 'center',
                    background: form.role === r ? 'var(--primary-light)' : 'white',
                    transition: 'all 0.15s'
                  }}>
                    <input type="radio" name="role" value={r} checked={form.role === r}
                      onChange={handleChange} style={{ display: 'none' }} />
                    <div style={{ fontSize: '1.5rem', marginBottom: '0.25rem' }}>{r === 'athlete' ? '🏋️' : '⚡'}</div>
                    <div style={{ fontWeight: 700, fontSize: '0.85rem', textTransform: 'capitalize' }}>{r}</div>
                  </label>
                ))}
              </div>
            </div>
            <button id="register-btn" type="submit" className="btn btn-primary btn-full btn-lg" disabled={loading} style={{ marginTop: '0.5rem' }}>
              {loading ? <><div className="spinner spinner-sm" /> Creating account…</> : 'Create Account →'}
            </button>
          </form>
        </div>

        <p style={{ marginTop: '1.25rem', fontSize: '0.875rem', color: 'var(--text-secondary)', textAlign: 'center' }}>
          Already have an account? <Link to="/login" style={{ color: 'var(--primary)', fontWeight: 700 }}>Sign in</Link>
        </p>
      </div>
    </div>
  );
}
