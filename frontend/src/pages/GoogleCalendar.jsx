import React, { useState, useEffect } from 'react';
import { useLanguage } from '../hooks/useLanguage';
import {
  getGoogleCalendarAuthUrl,
  connectGoogleCalendar,
  getGoogleCalendarStatus,
  disconnectGoogleCalendar,
  getGoogleCalendarEvents,
  exportTaskToGoogleCalendar,
  getTasks,
} from '../api';

function GoogleCalendar() {
  const { t } = useLanguage();
  const [status, setStatus] = useState(null);
  const [events, setEvents] = useState([]);
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [eventsLoading, setEventsLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [exportingTaskId, setExportingTaskId] = useState(null);

  useEffect(() => {
    loadStatus();
    loadTasks();
    handleOAuthCallback();
  }, []);

  const handleOAuthCallback = () => {
    const urlParams = new URLSearchParams(window.location.search);
    const code = urlParams.get('code');
    if (code && localStorage.getItem('google_calendar_pending') === 'true') {
      localStorage.removeItem('google_calendar_pending');
      window.history.replaceState({}, document.title, '/google-calendar');
      setLoading(true);
      connectGoogleCalendar(code)
        .then((data) => {
          setMessage(`✅ Google Calendar connected! (${data.email})`);
          loadStatus();
          loadEvents();
        })
        .catch((err) => {
          setMessage('❌ Error connecting: ' + err.message);
          setLoading(false);
        });
    }
  };

  const loadStatus = async () => {
    setLoading(true);
    try {
      const data = await getGoogleCalendarStatus();
      setStatus(data);
      if (data.connected) loadEvents();
    } catch {
      setStatus({ connected: false });
    } finally {
      setLoading(false);
    }
  };

  const loadEvents = async () => {
    setEventsLoading(true);
    try {
      const data = await getGoogleCalendarEvents(20);
      setEvents(data.events || []);
    } catch (err) {
      setMessage('❌ Failed to load events: ' + err.message);
    } finally {
      setEventsLoading(false);
    }
  };

  const loadTasks = async () => {
    try {
      const data = await getTasks({ completed: false });
      setTasks(data || []);
    } catch {
      setTasks([]);
    }
  };

  const handleConnect = async () => {
    try {
      const { authUrl } = await getGoogleCalendarAuthUrl();
      localStorage.setItem('google_calendar_pending', 'true');
      window.location.href = authUrl;
    } catch (err) {
      setMessage('❌ Error: ' + err.message);
    }
  };

  const handleDisconnect = async () => {
    try {
      await disconnectGoogleCalendar();
      setStatus({ connected: false });
      setEvents([]);
      setMessage('Disconnected from Google Calendar.');
    } catch (err) {
      setMessage('❌ Error disconnecting: ' + err.message);
    }
  };

  const handleExportTask = async (taskId) => {
    setExportingTaskId(taskId);
    try {
      const data = await exportTaskToGoogleCalendar(taskId);
      setMessage(`✅ Task exported! `);
      if (data.htmlLink) {
        setMessage(`✅ Task exported to Google Calendar! `);
      }
      loadEvents();
    } catch (err) {
      setMessage('❌ Export failed: ' + err.message);
    } finally {
      setExportingTaskId(null);
    }
  };

  const formatEventTime = (event) => {
    const start = event.start?.dateTime || event.start?.date;
    if (!start) return '';
    const date = new Date(start);
    if (event.start?.date) return date.toLocaleDateString();
    return date.toLocaleString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
  };

  const getEventColor = (event) => {
    const colorMap = { '11': '#e53e3e', '5': '#ed8936', '2': '#48bb78', '1': '#63b3ed' };
    return colorMap[event.colorId] || '#667eea';
  };

  return (
    <div className="page email-sync">
      <div className="dashboard-header">
        <div>
          <h1>📅 {t('googleCalendar')}</h1>
          <p>{t('googleCalendarDesc')}</p>
        </div>
        {status?.connected && (
          <button className="btn-primary" onClick={loadEvents} disabled={eventsLoading}>
            {eventsLoading ? t('loading') : '🔄 ' + t('refresh')}
          </button>
        )}
      </div>

      {message && (
        <div className={message.startsWith('❌') ? 'error-message' : 'success-message'}
          style={{ marginBottom: '1rem', padding: '0.75rem 1rem', borderRadius: '8px',
            background: message.startsWith('❌') ? '#fff5f5' : '#f0fff4',
            border: `1px solid ${message.startsWith('❌') ? '#fc8181' : '#9ae6b4'}`,
            color: message.startsWith('❌') ? '#c53030' : '#276749' }}>
          {message}
        </div>
      )}

      {/* Connection Card */}
      <div className="form-card">
        <h2>🔗 {t('connectGoogle')}</h2>
        {loading ? (
          <p>{t('loading')}</p>
        ) : status?.connected ? (
          <div className="connected-account">
            <div className="account-info">
              <span style={{ fontSize: '2rem' }}>📅</span>
              <div>
                <strong style={{ color: '#276749' }}>✓ {t('connected')}</strong>
                <p style={{ margin: '0.25rem 0', color: '#4a5568' }}>{status.email}</p>
                {status.needsRefresh && (
                  <p style={{ color: '#e53e3e', fontSize: '0.85rem' }}>Token needs refresh — reconnect if issues occur</p>
                )}
              </div>
            </div>
            <div className="account-actions">
              <button onClick={handleDisconnect} className="btn-secondary">{t('disconnect')}</button>
            </div>
          </div>
        ) : (
          <div className="connect-prompt">
            <p style={{ marginBottom: '1rem', color: '#4a5568' }}>{t('googleCalendarConnectHint')}</p>
            <button onClick={handleConnect} className="btn-primary"
              style={{ background: '#4285f4', display: 'inline-flex', alignItems: 'center', gap: '0.5rem' }}>
              <span>🔗</span> {t('connectGoogle')}
            </button>
          </div>
        )}
      </div>

      {status?.connected && (
        <>
          {/* Upcoming Events */}
          <div className="form-card">
            <h2>📆 {t('upcomingEvents')}</h2>
            {eventsLoading ? (
              <p>{t('loading')}</p>
            ) : events.length === 0 ? (
              <p style={{ color: '#718096' }}>{t('noUpcomingEvents')}</p>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                {events.map((event) => (
                  <div key={event.id}
                    style={{ display: 'flex', alignItems: 'center', gap: '0.75rem',
                      padding: '0.75rem', borderRadius: '8px', background: '#f7fafc',
                      borderLeft: `4px solid ${getEventColor(event)}` }}>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontWeight: '600', color: '#2d3748' }}>{event.summary || '(No title)'}</div>
                      <div style={{ fontSize: '0.85rem', color: '#718096', marginTop: '0.2rem' }}>
                        🕐 {formatEventTime(event)}
                        {event.location && <span> · 📍 {event.location}</span>}
                      </div>
                      {event.description && (
                        <div style={{ fontSize: '0.8rem', color: '#a0aec0', marginTop: '0.2rem',
                          overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '400px' }}>
                          {event.description}
                        </div>
                      )}
                    </div>
                    {event.htmlLink && (
                      <a href={event.htmlLink} target="_blank" rel="noopener noreferrer"
                        style={{ color: '#4285f4', fontSize: '0.85rem', textDecoration: 'none', whiteSpace: 'nowrap' }}>
                        Open ↗
                      </a>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Export Tasks */}
          <div className="form-card">
            <h2>📤 {t('exportTasksToCalendar')}</h2>
            <p style={{ color: '#718096', marginBottom: '1rem', fontSize: '0.9rem' }}>
              {t('exportTasksHint')}
            </p>
            {tasks.length === 0 ? (
              <p style={{ color: '#718096' }}>{t('noTasks')}</p>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                {tasks.map((task) => (
                  <div key={task.id}
                    style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                      padding: '0.75rem', borderRadius: '8px', background: '#f7fafc',
                      borderLeft: `4px solid ${task.priority === 'high' ? '#fc8181' : task.priority === 'low' ? '#68d391' : '#fbd38d'}` }}>
                    <div>
                      <div style={{ fontWeight: '500', color: '#2d3748' }}>{task.title}</div>
                      <div style={{ fontSize: '0.8rem', color: '#718096' }}>
                        {task.due_date ? `Due: ${new Date(task.due_date).toLocaleDateString()}` : 'No due date'}
                        {' · '}
                        <span style={{ textTransform: 'capitalize' }}>{task.priority} priority</span>
                      </div>
                    </div>
                    <button
                      onClick={() => handleExportTask(task.id)}
                      disabled={exportingTaskId === task.id}
                      className="btn-primary"
                      style={{ fontSize: '0.8rem', padding: '0.4rem 0.8rem', background: '#4285f4', whiteSpace: 'nowrap' }}>
                      {exportingTaskId === task.id ? '...' : '📅 ' + t('exportToCalendar')}
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </>
      )}

      {/* How it works */}
      <div className="form-card">
        <h2>{t('howItWorks')}</h2>
        <div className="info-box">
          <ul>
            <li>Click <strong>Connect Google Calendar</strong> and sign in with your Google account</li>
            <li>Grant permission to read and write calendar events</li>
            <li>View your upcoming Google Calendar events directly in Planora</li>
            <li>Export any Planora task to your Google Calendar with one click</li>
            <li>Events are color-coded by task priority (red = high, yellow = medium, green = low)</li>
          </ul>
        </div>
      </div>
    </div>
  );
}

export default GoogleCalendar;
