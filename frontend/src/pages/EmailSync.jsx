import React, { useState, useEffect } from 'react';
import { getMicrosoftStatus, getMicrosoftAuthUrl, connectMicrosoftAccount, triggerEmailSync } from '../api';

function EmailSync() {
  const [status, setStatus] = useState(null);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [message, setMessage] = useState('');

  useEffect(() => {
    loadStatus();
  }, []);

  const loadStatus = async () => {
    setLoading(true);
    try {
      const data = await getMicrosoftStatus();
      setStatus(data);
    } catch (err) {
      setStatus({ connected: false });
    } finally {
      setLoading(false);
    }
  };

  const handleConnect = async () => {
    try {
      const { authUrl } = await getMicrosoftAuthUrl();
      localStorage.setItem('microsoft_oauth_pending', 'true');
      window.location.href = authUrl;
    } catch (err) {
      setMessage('Error: ' + err.message);
    }
  };

  const handleDisconnect = async () => {
    try {
      await connectMicrosoftAccount({ disconnect: true });
      setStatus({ connected: false });
      setMessage('Account disconnected');
    } catch (err) {
      setMessage('Error disconnecting: ' + err.message);
    }
  };

  const handleSync = async () => {
    setSyncing(true);
    setMessage('Syncing...');
    
    try {
      await triggerEmailSync();
      setMessage('Sync completed! New tasks added to dashboard.');
    } catch (err) {
      setMessage('Sync error: ' + err.message);
    } finally {
      setSyncing(false);
    }
  };

  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const code = urlParams.get('code');

    if (code && localStorage.getItem('microsoft_oauth_pending') === 'true') {
      localStorage.removeItem('microsoft_oauth_pending');
      window.history.replaceState({}, document.title, '/email-sync');
      
      setLoading(true);
      connectMicrosoftAccount(code)
        .then(() => {
          setMessage('Account connected successfully!');
          loadStatus();
        })
        .catch(err => {
          setMessage('Error connecting: ' + err.message);
          setLoading(false);
        });
    }
  }, []);

  const formatDate = (dateString) => {
    if (!dateString) return 'Unknown';
    return new Date(dateString).toLocaleString();
  };

  return (
    <div className="page email-sync">
      <div className="dashboard-header">
        <div>
          <h1>Smart Email Sync</h1>
          <p>Automatically import assignments from your university email</p>
        </div>
        {status?.connected && (
          <button 
            onClick={handleSync} 
            className="btn-primary"
            disabled={syncing}
          >
            {syncing ? 'Syncing...' : 'Sync Now'}
          </button>
        )}
      </div>

      {message && (
        <div className={message.includes('Error') ? 'error-message' : 'success-message'}>
          {message}
        </div>
      )}

      <div className="form-card">
        <h2>Connect Microsoft Account</h2>
        
        {loading ? (
          <p>Loading...</p>
        ) : status?.connected ? (
          <div className="connected-account">
            <div className="account-info">
              <span className="microsoft-icon">📧</span>
              <div>
                <strong>Connected</strong>
                <p>{status.email}</p>
                <p className="expires">Token: {status.needsRefresh ? 'Needs refresh' : 'Active'}</p>
              </div>
            </div>
            <div className="account-actions">
              <button 
                onClick={handleDisconnect} 
                className="btn-secondary"
              >
                Disconnect
              </button>
            </div>
          </div>
        ) : (
          <div className="connect-prompt">
            <p>Click the button below to sign in with your Microsoft account. This will allow Planora to read your emails to import assignments automatically.</p>
            <button onClick={handleConnect} className="btn-primary microsoft-btn">
              Sign in with Microsoft
            </button>
          </div>
        )}
      </div>

      <div className="form-card">
        <h2>How It Works</h2>
        <div className="info-box">
          <ul>
            <li>Click "Sign in with Microsoft" to connect your university account</li>
            <li>Grant permission to read your emails (Planora only reads subjects)</li>
            <li>Click "Sync Now" to import your recent assignments</li>
            <li>Automatic sync runs every 15 minutes</li>
            <li>Tasks are tagged as "Assignment" or "Announcement"</li>
          </ul>
        </div>
      </div>
    </div>
  );
}

export default EmailSync;
