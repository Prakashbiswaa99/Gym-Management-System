import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import Sidebar from '../../components/Sidebar';
import Toast, { toast } from '../../components/Toast';
import api from '../../services/api';

export default function MemberList() {
  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  const [deleting, setDeleting] = useState(null);

  const fetchMembers = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (statusFilter) params.set('status', statusFilter);
      if (typeFilter) params.set('membershipType', typeFilter);
      if (search) params.set('search', search);
      const res = await api.get(`/members?${params}`);
      setMembers(res.data);
    } catch { toast('Failed to load members', 'error'); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchMembers(); }, [statusFilter, typeFilter]);

  const handleSearch = e => { e.preventDefault(); fetchMembers(); };

  const handleDelete = async (id) => {
    if (!window.confirm('Remove this member permanently?')) return;
    setDeleting(id);
    try {
      await api.delete(`/members/${id}`);
      toast('Member removed', 'success');
      fetchMembers();
    } catch { toast('Delete failed', 'error'); }
    finally { setDeleting(null); }
  };

  const daysLeft = (expiry) => {
    if (!expiry) return null;
    const diff = Math.ceil((new Date(expiry) - new Date()) / 86400000);
    return diff;
  };

  return (
    <div className="app-layout">
      <Sidebar />
      <div className="main-content">
        <Toast />
        <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
          <div>
            <div className="label">Management</div>
            <h1>Members</h1>
            <p>{members.length} member{members.length !== 1 ? 's' : ''} found</p>
          </div>
          <Link to="/admin/members/new" className="btn btn-primary btn-lg">+ Add Member</Link>
        </div>

        {/* Filters */}
        <div className="filter-bar">
          <form onSubmit={handleSearch} style={{ flex: 1, display: 'flex', gap: '0.75rem' }}>
            <div className="search-input-wrap">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><circle cx="11" cy="11" r="8"/><path d="M21 21l-4.35-4.35"/></svg>
              <input className="form-input search-input" placeholder="Search by name or email…"
                value={search} onChange={e => setSearch(e.target.value)} />
            </div>
            <button type="submit" className="btn btn-primary">Search</button>
          </form>
          <select className="form-input" style={{ width: 'auto' }} value={statusFilter} onChange={e => setStatusFilter(e.target.value)}>
            <option value="">All Status</option>
            <option value="active">Active</option>
            <option value="expired">Expired</option>
            <option value="pending">Pending</option>
          </select>
          <select className="form-input" style={{ width: 'auto' }} value={typeFilter} onChange={e => setTypeFilter(e.target.value)}>
            <option value="">All Plans</option>
            <option value="basic">Basic</option>
            <option value="standard">Standard</option>
            <option value="premium">Premium</option>
          </select>
        </div>

        {loading ? (
          <div className="spinner-container"><div className="spinner" /></div>
        ) : members.length === 0 ? (
          <div className="empty-state">
            <h3>No members found</h3>
            <p>Try adjusting your filters or <Link to="/admin/members/new">add a new member</Link></p>
          </div>
        ) : (
          <div className="table-wrapper">
            <table>
              <thead>
                <tr>
                  <th>Member</th>
                  <th>Plan</th>
                  <th>Status</th>
                  <th>Expiry</th>
                  <th>Joined</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {members.map(m => {
                  const days = daysLeft(m.expiryDate);
                  return (
                    <tr key={m._id}>
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                          <div style={{ width: 36, height: 36, borderRadius: '50%', background: 'var(--primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontWeight: 800, fontSize: '0.82rem', flexShrink: 0 }}>
                            {m.userId?.name?.[0] ?? '?'}
                          </div>
                          <div>
                            <div style={{ fontWeight: 700 }}>{m.userId?.name ?? 'Unknown'}</div>
                            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{m.userId?.email}</div>
                          </div>
                        </div>
                      </td>
                      <td>
                        <span style={{ fontWeight: 700, textTransform: 'capitalize' }}>{m.membershipType}</span>
                      </td>
                      <td><span className={`badge badge-${m.status}`}>{m.status}</span></td>
                      <td>
                        <div style={{ fontSize: '0.85rem' }}>
                          {m.expiryDate ? new Date(m.expiryDate).toLocaleDateString('en-IN') : '—'}
                          {days !== null && (
                            <div style={{ fontSize: '0.72rem', color: days < 7 ? 'var(--danger)' : 'var(--text-muted)', fontWeight: 600 }}>
                              {days > 0 ? `${days}d left` : `${Math.abs(days)}d ago`}
                            </div>
                          )}
                        </div>
                      </td>
                      <td style={{ fontSize: '0.82rem', color: 'var(--text-secondary)' }}>
                        {m.enrollmentDate ? new Date(m.enrollmentDate).toLocaleDateString('en-IN') : '—'}
                      </td>
                      <td>
                        <div style={{ display: 'flex', gap: '0.5rem' }}>
                          <Link to={`/admin/members/${m._id}`} className="btn btn-outline btn-sm">View</Link>
                          <Link to={`/admin/workout/${m.userId?._id}`} className="btn btn-outline btn-sm" title="Assign Workout">💪</Link>
                          <Link to={`/admin/diet/${m.userId?._id}`} className="btn btn-outline btn-sm" title="Assign Diet">🥗</Link>
                          <button className="btn btn-danger btn-sm" disabled={deleting === m._id} onClick={() => handleDelete(m._id)}>
                            {deleting === m._id ? '…' : '🗑'}
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
