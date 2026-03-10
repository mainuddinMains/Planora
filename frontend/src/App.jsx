import React, { useState, useRef, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Link, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './hooks/useAuth';
import { NotificationBell } from './components';
import { connectMicrosoftAccount } from './api';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Tasks from './pages/Tasks';
import WeeklyCalendar from './pages/WeeklyCalendar';
import TodayPlan from './pages/TodayPlan';
import EmailSync from './pages/EmailSync';
import './App.css';

function OAuthCallback() {
  const [processed, setProcessed] = useState(false);

  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const code = urlParams.get('code');

    if (code && localStorage.getItem('microsoft_oauth_pending') === 'true' && !processed) {
      localStorage.removeItem('microsoft_oauth_pending');
      window.history.replaceState({}, document.title, '/email-sync');
      
      connectMicrosoftAccount(code)
        .then(() => {
          setProcessed(true);
          window.dispatchEvent(new Event('microsoftAccountConnected'));
        })
        .catch(err => {
          console.error('OAuth error:', err);
          setProcessed(true);
        });
    }
  }, [processed]);

  return null;
}

function PrivateRoute({ children }) {
  const { user, loading } = useAuth();
  
  if (loading) return <div className="page">Loading...</div>;
  
  return user ? children : <Navigate to="/login" />;
}

function NavBar() {
  const { user, logout, showWelcome } = useAuth();
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [showChangePassword, setShowChangePassword] = useState(false);
  const [newPassword, setNewPassword] = useState('');
  const profileRef = useRef(null);

  useEffect(() => {
    function handleClickOutside(event) {
      if (profileRef.current && !profileRef.current.contains(event.target)) {
        setShowProfileMenu(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleLogout = async () => {
    await logout();
  };

  const handleChangePassword = () => {
    setShowChangePassword(true);
    setShowProfileMenu(false);
  };

  const handleSavePassword = () => {
    alert('Password change functionality would connect to backend API');
    setShowChangePassword(false);
    setNewPassword('');
  };

  const handleAddTask = () => {
    localStorage.setItem('openAddTask', 'true');
    window.dispatchEvent(new Event('openAddTask'));
  };

  const handleOpenChatbot = () => {
    localStorage.setItem('openChatbot', 'true');
    window.dispatchEvent(new Event('openChatbot'));
  };

  if (!user) return null;

  return (
    <nav>
      <div className="nav-left">
        <div className="nav-brand">
          <Link to="/">Planora</Link>
        </div>
        <div className="nav-links">
          <Link to="/">Dashboard</Link>
          <Link to="/tasks">Tasks</Link>
          <Link to="/weekly">Weekly</Link>
          <Link to="/today">Today</Link>
          <Link to="/email-sync">Email Sync</Link>
        </div>
      </div>
      <div className="nav-right">
        <button className="btn-add-task" onClick={handleAddTask}>+ Add Task</button>
        <button className="btn-chatbot" onClick={handleOpenChatbot} title="AI Assistant">🤖</button>
        <NotificationBell />
        <div className="profile-container" ref={profileRef}>
          <div 
            className="profile-icon" 
            title={user.name}
            onClick={() => setShowProfileMenu(!showProfileMenu)}
          >
            {user.name.charAt(0).toUpperCase()}
          </div>
          {showProfileMenu && (
            <div className="profile-dropdown">
              <div className="profile-info">
                <div className="profile-avatar">
                  {user.name.charAt(0).toUpperCase()}
                </div>
                <div className="profile-details">
                  <strong>{user.name}</strong>
                  <span>{user.email}</span>
                </div>
              </div>
              <div className="profile-divider"></div>
              <button className="profile-menu-item" onClick={handleChangePassword}>
                Change Password
              </button>
              <button className="profile-menu-item" onClick={handleLogout}>
                Logout
              </button>
            </div>
          )}
        </div>
      </div>

      {showChangePassword && (
        <div className="modal-overlay">
          <div className="modal">
            <h2>Change Password</h2>
            <div className="form-group">
              <label>New Password</label>
              <input
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="Enter new password"
              />
            </div>
            <div className="modal-buttons">
              <button className="btn-secondary" onClick={() => setShowChangePassword(false)}>
                Cancel
              </button>
              <button className="btn-primary" onClick={handleSavePassword}>
                Save
              </button>
            </div>
          </div>
        </div>
      )}
    </nav>
  );
}

function AppRoutes() {
  const { user, showWelcome } = useAuth();

  return (
    <>
      {showWelcome && user && (
        <div className="welcome-toast">
          Welcome, {user.name}!
        </div>
      )}
      <NavBar />
      <Routes>
        <Route path="/login" element={user ? <Navigate to="/" /> : <Login />} />
        <Route path="/email-sync" element={
          <PrivateRoute><EmailSync /></PrivateRoute>
        } />
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
        <OAuthCallback />
        <AppRoutes />
      </AuthProvider>
    </Router>
  );
}

export default App;
