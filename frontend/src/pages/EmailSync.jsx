import React, { useState, useEffect } from 'react';
import { getEmailSources, createEmailSource, deleteEmailSource, triggerEmailSync } from '../api';

function EmailSync() {
  const [sources, setSources] = useState([]);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [message, setMessage] = useState('');
  const [form, setForm] = useState({
    host: 'outlook.office365.com',
    port: 993,
    tls: true,
    provider: 'outlook',
    username: '',
    password: ''
  });

  useEffect(() => {
    loadSources();
  }, []);

  const loadSources = async () => {
    setLoading(true);
    try {
      const data = await getEmailSources();
      setSources(data);
    } catch (err) {
      setMessage('Error loading sources: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage('');
    
    try {
      await createEmailSource({
        host: form.host,
        port: parseInt(form.port),
        tls: form.tls,
        provider: form.provider,
        username: form.username,
        password: form.password
      });
      setMessage('Email source added successfully!');
      setForm({ ...form, username: '', password: '' });
      loadSources();
    } catch (err) {
      setMessage('Error: ' + err.message);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this email source?')) return;
    
    try {
      await deleteEmailSource(id);
      setMessage('Source deleted');
      loadSources();
    } catch (err) {
      setMessage('Error deleting: ' + err.message);
    }
  };

  const handleSync = async () => {
    setSyncing(true);
    setMessage('Sync started...');
    
    try {
      await triggerEmailSync();
      setMessage('Sync completed! New tasks have been added to your dashboard.');
    } catch (err) {
      setMessage('Sync error: ' + err.message);
    } finally {
      setSyncing(false);
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'Never';
    return new Date(dateString).toLocaleString();
  };

  return (
    <div className="page email-sync">
      <div className="dashboard-header">
        <div>
          <h1>Smart Email Sync (Outlook)</h1>
          <p>Automatically import assignments from your university email</p>
        </div>
        <button 
          onClick={handleSync} 
          className="btn-primary"
          disabled={syncing || sources.length === 0}
        >
          {syncing ? 'Syncing...' : 'Sync Now'}
        </button>
      </div>

      {message && (
        <div className={message.includes('Error') ? 'error-message' : 'success-message'}>
          {message}
        </div>
      )}

      <div className="form-card">
        <h2>Add Outlook Account</h2>
        <form onSubmit={handleSubmit} className="task-form">
          <div className="form-row">
            <div className="form-group">
              <label>IMAP Host</label>
              <input
                type="text"
                value={form.host}
                onChange={(e) => setForm({ ...form, host: e.target.value })}
                placeholder="outlook.office365.com"
              />
            </div>
            <div className="form-group">
              <label>Port</label>
              <input
                type="number"
                value={form.port}
                onChange={(e) => setForm({ ...form, port: e.target.value })}
                placeholder="993"
              />
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label>Username (Email)</label>
              <input
                type="email"
                value={form.username}
                onChange={(e) => setForm({ ...form, username: e.target.value })}
                placeholder="your.email@university.edu"
                required
              />
            </div>
            <div className="form-group">
              <label>Password / App Password</label>
              <input
                type="password"
                value={form.password}
                onChange={(e) => setForm({ ...form, password: e.target.value })}
                placeholder="Enter password or app password"
                required
              />
            </div>
          </div>

          <div className="form-group">
            <label>
              <input
                type="checkbox"
                checked={form.tls}
                onChange={(e) => setForm({ ...form, tls: e.target.checked })}
              />
              Use TLS/SSL
            </label>
          </div>

          <div className="form-actions">
            <button type="submit" className="btn-primary">Add Account</button>
          </div>
        </form>
      </div>

      <div className="form-card">
        <h2>Configured Accounts</h2>
        
        {loading ? (
          <p>Loading...</p>
        ) : sources.length === 0 ? (
          <p className="empty-state">No email accounts configured yet.</p>
        ) : (
          <div className="sources-list">
            {sources.map((source) => (
              <div key={source.id} className="source-item">
                <div className="source-info">
                  <div className="source-host">{source.host}</div>
                  <div className="source-username">{source.username}</div>
                  <div className="source-status">
                    Last sync: {formatDate(source.last_sync_at)}
                  </div>
                </div>
                <div className="source-actions">
                  <button
                    onClick={() => handleDelete(source.id)}
                    className="btn-secondary"
                  >
                    Remove
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="form-card">
        <h2>How It Works</h2>
        <div className="info-box">
          <ul>
            <li>Enter your Outlook/Office 365 email credentials</li>
            <li>For <strong>Outlook/Office 365</strong>: If you have 2FA enabled, you need an <strong>App Password</strong></li>
            <li>For <strong>Gmail</strong>, use an <strong>App Password</strong> instead of your regular password</li>
            <li>Click "Sync Now" or wait for automatic sync every 15 minutes</li>
            <li>Planora will scan your inbox for assignment-related emails</li>
            <li>Tasks will be automatically created with course, title, and due date</li>
            <li>Look for the "Assignment" or "Announcement" tag on imported tasks</li>
          </ul>
          <div className="info-box" style={{ marginTop: '1rem', background: '#fef3c7', borderColor: '#f59e0b' }}>
            <strong>How to create an App Password for Outlook:</strong>
            <ol style={{ marginTop: '0.5rem', paddingLeft: '1.25rem' }}>
              <li>Go to <a href="https://account.microsoft.com/security" target="_blank" rel="noopener noreferrer">Microsoft Account Security</a></li>
              <li>Enable Two-Factor Authentication</li>
              <li>Go to "App passwords" and create a new one</li>
              <li>Use that password in Planora</li>
            </ol>
          </div>
        </div>
      </div>
    </div>
  );
}

export default EmailSync;
