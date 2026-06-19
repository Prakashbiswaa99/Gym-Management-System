import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';

// Auth pages
import Login from './pages/Login';
import Register from './pages/Register';

// Admin pages
import AdminDashboard from './pages/admin/AdminDashboard';
import MemberList from './pages/admin/MemberList';
import AddMember from './pages/admin/AddMember';
import MemberDetail from './pages/admin/MemberDetail';
import AttendanceReport from './pages/admin/AttendanceReport';
import AssignWorkout from './pages/admin/AssignWorkout';
import AssignDiet from './pages/admin/AssignDiet';

// Athlete pages
import AthleteDashboard from './pages/athlete/AthleteDashboard';
import WorkoutSchedule from './pages/athlete/WorkoutSchedule';
import DietSchedule from './pages/athlete/DietSchedule';
import AttendanceLog from './pages/athlete/AttendanceLog';
import AthleteProfile from './pages/athlete/AthleteProfile';

const ProtectedRoute = ({ children, allowedRole }) => {
  const { user, loading } = useAuth();
  if (loading) return <div className="spinner-container"><div className="spinner" /></div>;
  if (!user) return <Navigate to="/" replace />;
  if (allowedRole && user.role !== allowedRole) {
    return <Navigate to={user.role === 'admin' ? '/admin' : '/athlete'} replace />;
  }
  return children;
};

const RootRedirect = () => {
  const { user, loading } = useAuth();
  if (loading) return <div className="spinner-container"><div className="spinner" /></div>;
  if (!user) return <Navigate to="/login" replace />;
  return <Navigate to={user.role === 'admin' ? '/admin' : '/athlete'} replace />;
};

const AppRoutes = () => (
  <Routes>
    <Route path="/" element={<RootRedirect />} />
    <Route path="/login" element={<Login />} />
    <Route path="/register" element={<Register />} />

    {/* Admin Routes */}
    <Route path="/admin" element={<ProtectedRoute allowedRole="admin"><AdminDashboard /></ProtectedRoute>} />
    <Route path="/admin/members" element={<ProtectedRoute allowedRole="admin"><MemberList /></ProtectedRoute>} />
    <Route path="/admin/members/new" element={<ProtectedRoute allowedRole="admin"><AddMember /></ProtectedRoute>} />
    <Route path="/admin/members/:id" element={<ProtectedRoute allowedRole="admin"><MemberDetail /></ProtectedRoute>} />
    <Route path="/admin/attendance" element={<ProtectedRoute allowedRole="admin"><AttendanceReport /></ProtectedRoute>} />
    <Route path="/admin/workout/:userId" element={<ProtectedRoute allowedRole="admin"><AssignWorkout /></ProtectedRoute>} />
    <Route path="/admin/diet/:userId" element={<ProtectedRoute allowedRole="admin"><AssignDiet /></ProtectedRoute>} />

    {/* Athlete Routes */}
    <Route path="/athlete" element={<ProtectedRoute allowedRole="athlete"><AthleteDashboard /></ProtectedRoute>} />
    <Route path="/athlete/workout" element={<ProtectedRoute allowedRole="athlete"><WorkoutSchedule /></ProtectedRoute>} />
    <Route path="/athlete/diet" element={<ProtectedRoute allowedRole="athlete"><DietSchedule /></ProtectedRoute>} />
    <Route path="/athlete/attendance" element={<ProtectedRoute allowedRole="athlete"><AttendanceLog /></ProtectedRoute>} />
    <Route path="/athlete/profile" element={<ProtectedRoute allowedRole="athlete"><AthleteProfile /></ProtectedRoute>} />

    <Route path="*" element={<Navigate to="/" replace />} />
  </Routes>
);

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <AppRoutes />
      </BrowserRouter>
    </AuthProvider>
  );
}
