import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import Toast, { toast } from '../components/Toast';

export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ email: '', password: '' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleChange = e => setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async e => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const res = await api.post('/auth/login', form);
      login({ _id: res.data._id, name: res.data.name, email: res.data.email, role: res.data.role }, res.data.token);
      navigate(res.data.role === 'admin' ? '/admin' : '/athlete');
    } catch (err) {
      setError(err.response?.data?.message || 'Login failed. Check credentials.');
    } finally {
      setLoading(false);
    }
  };

  const fillDemo = (role) => {
    if (role === 'admin') setForm({ email: 'admin@gym.com', password: 'Admin@123' });
    else setForm({ email: 'jordan@gym.com', password: 'Gym@1234' });
  };

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg)', display: 'flex', alignItems: 'stretch' }}>
      <Toast />
      {/* Left Panel */}
      <div style={{ flex: 1, background: 'var(--text)', color: 'white', display: 'flex', flexDirection: 'column', justifyContent: 'center', padding: '4rem', minWidth: 0 }}>
        <h1 className="display" style={{ color: 'white', fontSize: '5rem', lineHeight: 0.9, marginBottom: '1.5rem' }}>
          GYM<br /><span style={{ color: 'var(--primary)' }}>OS</span>
        </h1>
        <p style={{ fontSize: '1.1rem', color: 'rgba(255,255,255,0.65)', maxWidth: 380, lineHeight: 1.7 }}>
          The modern gym management platform. Track members, workouts, diet plans, and attendance — all in one place.
        </p>
        <div style={{ marginTop: '3rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {[
            { icon: '⚡', text: 'Role-based portals for owners & athletes' },
            { icon: '📊', text: 'Real-time member & attendance analytics' },
            { icon: '💳', text: 'Integrated mock payment gateway' },
            { icon: '🥗', text: 'Digital diet & workout scheduling' },
          ].map((f, i) => (
            <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', color: 'rgba(255,255,255,0.8)', fontSize: '0.9rem' }}>
              <span style={{ fontSize: '1.2rem' }}>{f.icon}</span> {f.text}
            </div>
          ))}
        </div>
      </div>

      {/* Right Panel */}
      <div style={{ width: 480, display: 'flex', flexDirection: 'column', justifyContent: 'center', padding: '3rem', borderLeft: '2px solid var(--border)' }}>
        <div style={{ marginBottom: '2rem' }}>
          <div className="label" style={{ marginBottom: '0.5rem' }}>Welcome back</div>
          <h2>Sign In</h2>
        </div>

        {error && <div className="alert alert-error" style={{ marginBottom: '1.25rem' }}>{error}</div>}

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label">Email Address</label>
            <input id="email" name="email" type="email" className="form-input" placeholder="you@example.com"
              value={form.email} onChange={handleChange} required />
          </div>
          <div className="form-group">
            <label className="form-label">Password</label>
            <input id="password" name="password" type="password" className="form-input" placeholder="••••••••"
              value={form.password} onChange={handleChange} required />
          </div>
          <button id="login-btn" type="submit" className="btn btn-primary btn-full btn-lg" disabled={loading} style={{ marginTop: '0.5rem' }}>
            {loading ? <><div className="spinner spinner-sm" /> Signing in…</> : 'Sign In →'}
          </button>
        </form>

        <div style={{ margin: '1.5rem 0', display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
          <div style={{ flex: 1, height: 2, background: 'var(--border-light)' }} />
          <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 700 }}>DEMO ACCOUNTS</span>
          <div style={{ flex: 1, height: 2, background: 'var(--border-light)' }} />
        </div>
        <div style={{ display: 'flex', gap: '0.75rem' }}>
          <button id="demo-admin" className="btn btn-outline btn-sm" style={{ flex: 1 }} onClick={() => fillDemo('admin')}>⚡ Admin</button>
          <button id="demo-athlete" className="btn btn-outline btn-sm" style={{ flex: 1 }} onClick={() => fillDemo('athlete')}>🏋️ Athlete</button>
        </div>

        <p style={{ marginTop: '1.5rem', fontSize: '0.875rem', color: 'var(--text-secondary)', textAlign: 'center' }}>
          No account? <Link to="/register" style={{ color: 'var(--primary)', fontWeight: 700 }}>Register here</Link>
        </p>
      </div>
    </div>
  );
}
