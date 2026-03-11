import React, { useState, useEffect } from 'react';
import { useLanguage } from '../hooks/useLanguage';
import { getMicrosoftStatus, getMicrosoftAuthUrl, connectMicrosoftAccount, triggerEmailSync } from '../api';

function EmailSync() {
  const { t } = useLanguage();
  const [status, setStatus] = useState(null);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [message, setMessage] = useState('');

  useEffect(() => {
    loadStatus();

    const handleAccountConnected = () => {
      setMessage(t('accountConnected'));
      loadStatus();
    };
    window.addEventListener('microsoftAccountConnected', handleAccountConnected);
    return () => window.removeEventListener('microsoftAccountConnected', handleAccountConnected);
  }, [t]);

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
      setMessage(t('disconnected'));
    } catch (err) {
      setMessage('Error disconnecting: ' + err.message);
    }
  };

  const handleSync = async () => {
    setSyncing(true);
    setMessage(t('syncing'));
    
    try {
      await triggerEmailSync();
      setMessage(t('syncComplete'));
    } catch (err) {
      setMessage(t('syncError') + err.message);
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
          setMessage(t('accountConnected'));
          loadStatus();
        })
        .catch(err => {
          setMessage(t('errorConnecting') + err.message);
          setLoading(false);
        });
    }
  }, [t]);

  const formatDate = (dateString) => {
    if (!dateString) return t('unknown');
    return new Date(dateString).toLocaleString();
  };

  return (
    <div className="page email-sync">
      <div className="dashboard-header">
        <div>
          <h1>{t('smartEmailSync')}</h1>
          <p>{t('importAssignments')}</p>
        </div>
        {status?.connected && (
          <button 
            onClick={handleSync} 
            className="btn-primary"
            disabled={syncing}
          >
            {syncing ? t('syncing') : t('syncNow')}
          </button>
        )}
      </div>

      {message && (
        <div className={message.includes(t('error')) ? 'error-message' : 'success-message'}>
          {message}
        </div>
      )}

      <div className="form-card">
        <h2>{t('connectMicrosoft')}</h2>
        
        {loading ? (
          <p>{t('loading')}</p>
        ) : status?.connected ? (
          <div className="connected-account">
            <div className="account-info">
              <span className="microsoft-icon">📧</span>
              <div>
                <strong>{t('connected')}</strong>
                <p>{status.email}</p>
                <p className="expires">{t('token')}: {status.needsRefresh ? t('tokenNeedsRefresh') : t('tokenActive')}</p>
              </div>
            </div>
            <div className="account-actions">
              <button 
                onClick={handleDisconnect} 
                className="btn-secondary"
              >
                {t('disconnect')}
              </button>
            </div>
          </div>
        ) : (
          <div className="connect-prompt">
            <p>{t('importAssignments')}</p>
            <button onClick={handleConnect} className="btn-primary microsoft-btn">
              {t('connectMicrosoft')}
            </button>
          </div>
        )}
      </div>

      <div className="form-card">
        <h2>{t('howItWorks')}</h2>
        <div className="info-box">
          <ul>
            <li>{t('signInMicrosoft')}</li>
            <li>{t('grantPermission')}</li>
            <li>{t('clickSync')}</li>
            <li>{t('automaticSync')}</li>
            <li>{t('taggedAs')}</li>
          </ul>
        </div>
      </div>
    </div>
  );
}

export default EmailSync;
