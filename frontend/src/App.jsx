import React from 'react';
import { BrowserRouter as Router, Routes, Route, Link, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './hooks/useAuth';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Tasks from './pages/Tasks';
import WeeklyCalendar from './pages/WeeklyCalendar';
import TodayPlan from './pages/TodayPlan';
import './App.css';

function PrivateRoute({ children }) {
  const { user, loading } = useAuth();
  
  if (loading) return <div className="page">Loading...</div>;
  
  return user ? children : <Navigate to="/login" />;
}

function NavBar() {
  const { user, logout } = useAuth();

  const handleLogout = async () => {
    await logout();
  };

  if (!user) return null;

  return (
    <nav>
      <Link to="/">Dashboard</Link> |{' '}
      <Link to="/tasks">Tasks</Link> |{' '}
      <Link to="/weekly">Weekly Calendar</Link> |{' '}
      <Link to="/today">Today Plan</Link> |{' '}
      <span className="user-info">
        {user.name} | <button onClick={handleLogout} className="btn-link">Logout</button>
      </span>
    </nav>
  );
}

function AppRoutes() {
  const { user } = useAuth();

  return (
    <>
      <NavBar />
      <Routes>
        <Route path="/login" element={user ? <Navigate to="/" /> : <Login />} />
        <Route path="/" element={
          <PrivateRoute><Dashboard /></PrivateRoute>
        } />
        <Route path="/tasks" element={
          <PrivateRoute><Tasks /></PrivateRoute>
        } />
        <Route path="/weekly" element={
          <PrivateRoute><WeeklyCalendar /></PrivateRoute>
        } />
        <Route path="/today" element={
          <PrivateRoute><TodayPlan /></PrivateRoute>
        } />
      </Routes>
    </>
  );
}

function App() {
  return (
    <Router>
      <AuthProvider>
        <AppRoutes />
      </AuthProvider>
    </Router>
  );
}

export default App;
