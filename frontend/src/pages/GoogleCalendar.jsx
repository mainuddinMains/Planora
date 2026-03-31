import React, { useState, useEffect, useCallback } from 'react';
import { useLanguage } from '../hooks/useLanguage';
import {
  getGoogleCalendarAuthUrl,
  connectGoogleCalendar,
  getGoogleCalendarStatus,
  disconnectGoogleCalendar,
  getGoogleCalendarEvents,
  createGoogleCalendarEvent,
  updateGoogleCalendarEvent,
  deleteGoogleCalendarEvent,
} from '../api';

const WEEKDAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const MONTH_NAMES = ['January','February','March','April','May','June','July','August','September','October','November','December'];
const TZ = Intl.DateTimeFormat().resolvedOptions().timeZone;

const COLOR_OPTIONS = [
  { id: '1',  label: 'Lavender',  hex: '#7986cb' },
  { id: '2',  label: 'Sage',      hex: '#33b679' },
  { id: '3',  label: 'Grape',     hex: '#8e24aa' },
  { id: '4',  label: 'Flamingo',  hex: '#e67c73' },
  { id: '5',  label: 'Banana',    hex: '#f6c026' },
  { id: '6',  label: 'Tangerine', hex: '#f5511d' },
  { id: '7',  label: 'Peacock',   hex: '#039be5' },
  { id: '8',  label: 'Graphite',  hex: '#616161' },
  { id: '9',  label: 'Blueberry', hex: '#3f51b5' },
  { id: '10', label: 'Basil',     hex: '#0b8043' },
  { id: '11', label: 'Tomato',    hex: '#d50000' },
];

function eventColor(event) {
  return COLOR_OPTIONS.find(c => c.id === event.colorId)?.hex || '#4285f4';
}

function toLocalDateTimeInput(isoString) {
  if (!isoString) return '';
  const d = new Date(isoString);
  const pad = n => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth()+1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

function toDateInput(isoString) {
  if (!isoString) return '';
  return isoString.slice(0, 10);
}

function eventStartDate(event) {
  const s = event.start?.dateTime || event.start?.date;
  return s ? new Date(s) : null;
}

function isSameDay(a, b) {
  return a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate();
}

// ── Event Modal ──────────────────────────────────────────────────────────────
function EventModal({ event, defaultDate, onSave, onDelete, onClose, saving, deleting }) {
  const isNew = !event?.id;
  const isAllDay = event ? !!event.start?.date : false;

  const initDate = (defaultDate || new Date());
  const pad = n => String(n).padStart(2, '0');
  const defaultStart = `${initDate.getFullYear()}-${pad(initDate.getMonth()+1)}-${pad(initDate.getDate())}T09:00`;
  const defaultEnd   = `${initDate.getFullYear()}-${pad(initDate.getMonth()+1)}-${pad(initDate.getDate())}T10:00`;

  const [title, setTitle]       = useState(event?.summary || '');
  const [allDay, setAllDay]     = useState(isAllDay);
  const [startDT, setStartDT]   = useState(
    isAllDay ? toDateInput(event?.start?.date) : toLocalDateTimeInput(event?.start?.dateTime) || defaultStart
  );
  const [endDT, setEndDT]       = useState(
    isAllDay ? toDateInput(event?.end?.date) : toLocalDateTimeInput(event?.end?.dateTime) || defaultEnd
  );
  const [desc, setDesc]         = useState(event?.description || '');
  const [location, setLocation] = useState(event?.location || '');
  const [colorId, setColorId]   = useState(event?.colorId || '7');

  const buildPayload = () => {
    const base = { summary: title, description: desc, location, colorId };
    if (allDay) {
      base.start = { date: startDT };
      base.end   = { date: endDT || startDT };
    } else {
      base.start = { dateTime: new Date(startDT).toISOString(), timeZone: TZ };
      base.end   = { dateTime: new Date(endDT).toISOString(),   timeZone: TZ };
    }
    return base;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!title.trim()) return;
    onSave(buildPayload(), event?.id);
  };

  return (
    <div onClick={onClose} style={{
      position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)',
      display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 3000,
    }}>
      <div onClick={e => e.stopPropagation()} style={{
        background: 'var(--modal-bg, #fff)', borderRadius: '16px', padding: '1.5rem',
        width: '100%', maxWidth: '480px', boxShadow: '0 20px 60px rgba(0,0,0,0.25)',
        maxHeight: '90vh', overflowY: 'auto',
      }}>
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
          <h2 style={{ margin: 0, color: 'var(--text-primary)', fontSize: '1.25rem' }}>
            {isNew ? '➕ New Event' : '✏️ Edit Event'}
          </h2>
          <button onClick={onClose} style={{ background: 'none', border: 'none', fontSize: '1.5rem', cursor: 'pointer', color: 'var(--text-secondary)' }}>×</button>
        </div>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {/* Title */}
          <div>
            <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: '600', color: 'var(--text-secondary)', marginBottom: '0.4rem' }}>Title *</label>
            <input
              value={title} onChange={e => setTitle(e.target.value)} required autoFocus
              placeholder="Add title"
              style={{ width: '100%', padding: '0.65rem 0.9rem', borderRadius: '8px',
                border: '1px solid var(--border-input)', background: 'var(--input-bg)',
                color: 'var(--text-primary)', fontSize: '1rem', boxSizing: 'border-box' }}
            />
          </div>

          {/* All-day toggle */}
          <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer', fontSize: '0.9rem', color: 'var(--text-primary)' }}>
            <input type="checkbox" checked={allDay} onChange={e => setAllDay(e.target.checked)} />
            All-day event
          </label>

          {/* Start / End */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: '600', color: 'var(--text-secondary)', marginBottom: '0.4rem' }}>Start</label>
              <input
                type={allDay ? 'date' : 'datetime-local'}
                value={startDT} onChange={e => setStartDT(e.target.value)} required
                style={{ width: '100%', padding: '0.6rem', borderRadius: '8px',
                  border: '1px solid var(--border-input)', background: 'var(--input-bg)',
                  color: 'var(--text-primary)', fontSize: '0.9rem', boxSizing: 'border-box' }}
              />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: '600', color: 'var(--text-secondary)', marginBottom: '0.4rem' }}>End</label>
              <input
                type={allDay ? 'date' : 'datetime-local'}
                value={endDT} onChange={e => setEndDT(e.target.value)} required
                style={{ width: '100%', padding: '0.6rem', borderRadius: '8px',
                  border: '1px solid var(--border-input)', background: 'var(--input-bg)',
                  color: 'var(--text-primary)', fontSize: '0.9rem', boxSizing: 'border-box' }}
              />
            </div>
          </div>

          {/* Location */}
          <div>
            <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: '600', color: 'var(--text-secondary)', marginBottom: '0.4rem' }}>📍 Location</label>
            <input
              value={location} onChange={e => setLocation(e.target.value)} placeholder="Add location"
              style={{ width: '100%', padding: '0.65rem 0.9rem', borderRadius: '8px',
                border: '1px solid var(--border-input)', background: 'var(--input-bg)',
                color: 'var(--text-primary)', fontSize: '0.9rem', boxSizing: 'border-box' }}
            />
          </div>

          {/* Description */}
          <div>
            <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: '600', color: 'var(--text-secondary)', marginBottom: '0.4rem' }}>📝 Description</label>
            <textarea
              value={desc} onChange={e => setDesc(e.target.value)} placeholder="Add description" rows={3}
              style={{ width: '100%', padding: '0.65rem 0.9rem', borderRadius: '8px',
                border: '1px solid var(--border-input)', background: 'var(--input-bg)',
                color: 'var(--text-primary)', fontSize: '0.9rem', resize: 'vertical',
                fontFamily: 'inherit', boxSizing: 'border-box' }}
            />
          </div>

          {/* Color */}
          <div>
            <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: '600', color: 'var(--text-secondary)', marginBottom: '0.5rem' }}>🎨 Color</label>
            <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap' }}>
              {COLOR_OPTIONS.map(c => (
                <button key={c.id} type="button" onClick={() => setColorId(c.id)} title={c.label}
                  style={{
                    width: '26px', height: '26px', borderRadius: '50%', border: colorId === c.id ? '3px solid var(--text-primary)' : '2px solid transparent',
                    background: c.hex, cursor: 'pointer', outline: 'none', transition: 'transform 0.15s',
                    transform: colorId === c.id ? 'scale(1.2)' : 'scale(1)',
                  }} />
              ))}
            </div>
          </div>

          {/* Actions */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '0.5rem' }}>
            {!isNew ? (
              <button type="button" onClick={() => onDelete(event.id)} disabled={deleting}
                style={{ padding: '0.6rem 1.2rem', borderRadius: '8px', border: '1px solid #fc8181',
                  background: 'transparent', color: '#e53e3e', cursor: 'pointer', fontWeight: '600', fontSize: '0.9rem' }}>
                {deleting ? 'Deleting…' : '🗑 Delete'}
              </button>
            ) : <span />}
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <button type="button" onClick={onClose}
                style={{ padding: '0.6rem 1.2rem', borderRadius: '8px', border: '1px solid var(--border)', background: 'var(--bg-secondary)', color: 'var(--text-primary)', cursor: 'pointer', fontWeight: '600', fontSize: '0.9rem' }}>
                Cancel
              </button>
              <button type="submit" disabled={saving || !title.trim()}
                style={{ padding: '0.6rem 1.4rem', borderRadius: '8px', border: 'none',
                  background: '#4285f4', color: '#fff', cursor: 'pointer', fontWeight: '700', fontSize: '0.9rem' }}>
                {saving ? 'Saving…' : isNew ? '✅ Create' : '✅ Save'}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}

// ── Main Component ────────────────────────────────────────────────────────────
function GoogleCalendar() {
  const { t } = useLanguage();
  const today = new Date();

  const [status, setStatus]       = useState(null);
  const [loading, setLoading]     = useState(true);
  const [events, setEvents]       = useState([]);
  const [evLoading, setEvLoading] = useState(false);
  const [message, setMessage]     = useState('');
  const [currentDate, setCurrentDate] = useState(new Date());
  const [modal, setModal]         = useState(null); // null | { mode: 'create'|'edit', event?, date? }
  const [saving, setSaving]       = useState(false);
  const [deleting, setDeleting]   = useState(false);
  const [now, setNow]             = useState(new Date());

  useEffect(() => {
    const t = setInterval(() => setNow(new Date()), 60000);
    return () => clearInterval(t);
  }, []);

  useEffect(() => {
    handleOAuthCallback();
    loadStatus();
  }, []);

  useEffect(() => {
    if (status?.connected) loadEvents(currentDate.getFullYear(), currentDate.getMonth() + 1);
  }, [status?.connected, currentDate]);

  const handleOAuthCallback = () => {
    const params = new URLSearchParams(window.location.search);
    const code = params.get('code');
    if (code && localStorage.getItem('google_calendar_pending') === 'true') {
      localStorage.removeItem('google_calendar_pending');
      window.history.replaceState({}, '', '/google-calendar');
      connectGoogleCalendar(code)
        .then(d => { setMessage(`✅ Connected as ${d.email}`); loadStatus(); })
        .catch(e => setMessage('❌ ' + e.message));
    }
  };

  const loadStatus = async () => {
    setLoading(true);
    try { setStatus(await getGoogleCalendarStatus()); }
    catch { setStatus({ connected: false }); }
    finally { setLoading(false); }
  };

  const loadEvents = useCallback(async (year, month) => {
    setEvLoading(true);
    try {
      const data = await getGoogleCalendarEvents(year, month);
      setEvents(data.events || []);
    } catch (e) { setMessage('❌ ' + e.message); }
    finally { setEvLoading(false); }
  }, []);

  const handleConnect = async () => {
    try {
      const { authUrl } = await getGoogleCalendarAuthUrl();
      localStorage.setItem('google_calendar_pending', 'true');
      window.location.href = authUrl;
    } catch (e) { setMessage('❌ ' + e.message); }
  };

  const handleDisconnect = async () => {
    await disconnectGoogleCalendar();
    setStatus({ connected: false });
    setEvents([]);
  };

  const handleSave = async (payload, eventId) => {
    setSaving(true);
    try {
      if (eventId) await updateGoogleCalendarEvent(eventId, payload);
      else         await createGoogleCalendarEvent(payload);
      setModal(null);
      setMessage(eventId ? '✅ Event updated!' : '✅ Event created!');
      loadEvents(currentDate.getFullYear(), currentDate.getMonth() + 1);
    } catch (e) { setMessage('❌ ' + e.message); }
    finally { setSaving(false); }
  };

  const handleDelete = async (eventId) => {
    if (!window.confirm('Delete this event?')) return;
    setDeleting(true);
    try {
      await deleteGoogleCalendarEvent(eventId);
      setModal(null);
      setMessage('✅ Event deleted.');
      loadEvents(currentDate.getFullYear(), currentDate.getMonth() + 1);
    } catch (e) { setMessage('❌ ' + e.message); }
    finally { setDeleting(false); }
  };

  // Build the 42-cell month grid
  const getMonthDays = () => {
    const year = currentDate.getFullYear(), month = currentDate.getMonth();
    const firstDay = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const days = [];
    for (let i = firstDay - 1; i >= 0; i--) days.push({ date: new Date(year, month, -i), cur: false });
    for (let i = 1; i <= daysInMonth; i++) days.push({ date: new Date(year, month, i), cur: true });
    while (days.length < 42) days.push({ date: new Date(year, month + 1, days.length - firstDay - daysInMonth + 1), cur: false });
    return days;
  };

  const eventsForDay = (date) =>
    events.filter(e => {
      const d = eventStartDate(e);
      return d && isSameDay(d, date);
    });

  const todayEventCount = eventsForDay(today).length;

  return (
    <div className="page" style={{ maxWidth: '1200px' }}>

      {/* ── Date banner ── */}
      <div style={{
        background: 'linear-gradient(135deg, #4285f4 0%, #34a853 100%)',
        borderRadius: '16px', padding: '1.25rem 1.75rem', marginBottom: '1.25rem',
        color: '#fff', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem',
      }}>
        <div>
          <div style={{ fontSize: '0.8rem', opacity: 0.85, textTransform: 'uppercase', letterSpacing: '0.08em' }}>
            {['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'][now.getDay()]}
          </div>
          <div style={{ fontSize: '2.2rem', fontWeight: '800', lineHeight: 1 }}>{now.getDate()}</div>
          <div style={{ fontSize: '0.95rem', opacity: 0.9 }}>{MONTH_NAMES[now.getMonth()]} {now.getFullYear()}</div>
        </div>
        <div style={{ textAlign: 'right' }}>
          <div style={{ fontSize: '1.8rem', fontWeight: '700' }}>
            {now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          </div>
          {status?.connected && (
            <div style={{ fontSize: '0.82rem', opacity: 0.85, marginTop: '0.2rem' }}>
              {todayEventCount === 0 ? '🎉 No events today' : `📅 ${todayEventCount} event${todayEventCount !== 1 ? 's' : ''} today`}
            </div>
          )}
        </div>
      </div>

      {message && (
        <div onClick={() => setMessage('')} style={{
          marginBottom: '1rem', padding: '0.75rem 1rem', borderRadius: '8px', cursor: 'pointer',
          background: message.startsWith('❌') ? '#fff5f5' : '#f0fff4',
          border: `1px solid ${message.startsWith('❌') ? '#fc8181' : '#9ae6b4'}`,
          color: message.startsWith('❌') ? '#c53030' : '#276749',
        }}>
          {message} <span style={{ opacity: 0.5, fontSize: '0.8rem' }}>(click to dismiss)</span>
        </div>
      )}

      {/* ── Connect card ── */}
      {!status?.connected && (
        <div className="form-card">
          <h2>📅 {t('googleCalendar')}</h2>
          {loading ? <p style={{ color: 'var(--text-secondary)' }}>Loading…</p> : (
            <div className="connect-prompt">
              <p style={{ marginBottom: '1rem', color: 'var(--text-secondary)' }}>{t('googleCalendarConnectHint')}</p>
              <button onClick={handleConnect} className="btn-primary"
                style={{ background: '#4285f4', display: 'inline-flex', alignItems: 'center', gap: '0.5rem' }}>
                🔗 {t('connectGoogle')}
              </button>
            </div>
          )}
        </div>
      )}

      {/* ── Full calendar ── */}
      {status?.connected && (
        <div className="form-card" style={{ padding: '1rem' }}>
          {/* Calendar toolbar */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', flexWrap: 'wrap', gap: '0.5rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              <button onClick={() => setCurrentDate(d => new Date(d.getFullYear(), d.getMonth() - 1, 1))}
                className="btn-secondary" style={{ padding: '0.4rem 0.8rem', fontSize: '1rem' }}>‹</button>
              <h2 style={{ margin: 0, color: 'var(--text-primary)', fontSize: '1.2rem', minWidth: '180px', textAlign: 'center' }}>
                {MONTH_NAMES[currentDate.getMonth()]} {currentDate.getFullYear()}
              </h2>
              <button onClick={() => setCurrentDate(d => new Date(d.getFullYear(), d.getMonth() + 1, 1))}
                className="btn-secondary" style={{ padding: '0.4rem 0.8rem', fontSize: '1rem' }}>›</button>
              <button onClick={() => setCurrentDate(new Date())}
                className="btn-secondary" style={{ padding: '0.4rem 0.9rem', fontSize: '0.85rem' }}>Today</button>
            </div>
            <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
              {evLoading && <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Loading…</span>}
              <button onClick={() => loadEvents(currentDate.getFullYear(), currentDate.getMonth() + 1)}
                className="btn-secondary" style={{ fontSize: '0.85rem', padding: '0.4rem 0.8rem' }}>🔄 Refresh</button>
              <button onClick={() => setModal({ mode: 'create', date: new Date() })}
                style={{ padding: '0.5rem 1rem', background: '#4285f4', color: '#fff', border: 'none', borderRadius: '8px', fontWeight: '700', cursor: 'pointer', fontSize: '0.9rem' }}>
                + New Event
              </button>
              <button onClick={handleDisconnect} className="btn-secondary" style={{ fontSize: '0.82rem' }}>Disconnect</button>
            </div>
          </div>

          {/* Weekday headers */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', marginBottom: '4px' }}>
            {WEEKDAYS.map(d => (
              <div key={d} style={{ textAlign: 'center', padding: '6px 0', fontSize: '0.78rem',
                fontWeight: '700', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                {d}
              </div>
            ))}
          </div>

          {/* Calendar grid */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '3px' }}>
            {getMonthDays().map(({ date, cur }, idx) => {
              const dayEvents = eventsForDay(date);
              const isToday = isSameDay(date, today);
              const isOther = !cur;
              return (
                <div key={idx}
                  onClick={() => setModal({ mode: 'create', date })}
                  style={{
                    minHeight: '90px', padding: '6px', borderRadius: '8px', cursor: 'pointer',
                    background: isToday ? 'rgba(66,133,244,0.08)' : isOther ? 'var(--bg-tertiary)' : 'var(--bg-secondary)',
                    border: isToday ? '2px solid #4285f4' : '1px solid var(--border)',
                    opacity: isOther ? 0.55 : 1, transition: 'background 0.15s',
                  }}
                  onMouseEnter={e => e.currentTarget.style.background = 'rgba(66,133,244,0.12)'}
                  onMouseLeave={e => e.currentTarget.style.background = isToday ? 'rgba(66,133,244,0.08)' : isOther ? 'var(--bg-tertiary)' : 'var(--bg-secondary)'}
                >
                  <div style={{
                    fontWeight: isToday ? '800' : '500',
                    fontSize: '0.85rem',
                    color: isToday ? '#fff' : 'var(--text-primary)',
                    background: isToday ? '#4285f4' : 'transparent',
                    width: isToday ? '24px' : 'auto',
                    height: isToday ? '24px' : 'auto',
                    borderRadius: isToday ? '50%' : '0',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    marginBottom: '4px',
                  }}>
                    {date.getDate()}
                  </div>
                  {dayEvents.slice(0, 3).map(ev => (
                    <div key={ev.id}
                      onClick={e => { e.stopPropagation(); setModal({ mode: 'edit', event: ev }); }}
                      title={ev.summary}
                      style={{
                        background: eventColor(ev), color: '#fff',
                        borderRadius: '4px', padding: '2px 5px', fontSize: '0.72rem',
                        fontWeight: '600', marginBottom: '2px', whiteSpace: 'nowrap',
                        overflow: 'hidden', textOverflow: 'ellipsis', cursor: 'pointer',
                        transition: 'opacity 0.15s',
                      }}
                      onMouseEnter={e => e.currentTarget.style.opacity = '0.85'}
                      onMouseLeave={e => e.currentTarget.style.opacity = '1'}
                    >
                      {ev.start?.dateTime
                        ? new Date(ev.start.dateTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) + ' '
                        : ''}
                      {ev.summary || '(No title)'}
                    </div>
                  ))}
                  {dayEvents.length > 3 && (
                    <div style={{ fontSize: '0.7rem', color: '#4285f4', fontWeight: '600', cursor: 'pointer' }}>
                      +{dayEvents.length - 3} more
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ── Event Modal ── */}
      {modal && (
        <EventModal
          event={modal.event}
          defaultDate={modal.date}
          onSave={handleSave}
          onDelete={handleDelete}
          onClose={() => setModal(null)}
          saving={saving}
          deleting={deleting}
        />
      )}
    </div>
  );
}

export default GoogleCalendar;
