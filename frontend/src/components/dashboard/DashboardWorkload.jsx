import React, { useState, useEffect, useCallback } from 'react';
import { getWorkload } from '../../api';
import { useLanguage } from '../../hooks/useLanguage';

function weekBounds() {
  const now = new Date();
  const start = new Date(now);
  start.setDate(now.getDate() - now.getDay());
  start.setHours(0, 0, 0, 0);
  const end = new Date(start);
  end.setDate(start.getDate() + 6);
  end.setHours(23, 59, 59, 999);
  return { start, end };
}

/**
 * Summarizes /recommendations/workload rows: { date, task_count, total_duration, tasks }
 */
function DashboardWorkload() {
  const { t } = useLanguage();
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState(null);
  const [summary, setSummary] = useState({ days: 0, minutes: 0, tasks: 0 });

  const loadWorkload = useCallback(async () => {
    setLoading(true);
    setErr(null);
    try {
      const { start, end } = weekBounds();
      const rows = await getWorkload(start.toISOString(), end.toISOString());
      if (!Array.isArray(rows)) {
        setSummary({ days: 0, minutes: 0, tasks: 0 });
        return;
      }
      let minutes = 0;
      let tasks = 0;
      rows.forEach((row) => {
        const c = parseInt(row.task_count, 10) || 0;
        tasks += c;
        const dur = row.total_duration;
        if (dur != null) minutes += parseInt(dur, 10) || 0;
      });
      setSummary({
        days: rows.length,
        minutes,
        tasks,
      });
    } catch (e) {
      setErr(e.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      await loadWorkload();
      if (cancelled) return;
    })();
    return () => {
      cancelled = true;
    };
  }, [loadWorkload]);

  const hours = Math.floor(summary.minutes / 60);
  const mins = summary.minutes % 60;
  const timeLabel =
    summary.minutes <= 0
      ? '—'
      : hours > 0
        ? `${hours}${t('hoursShort')} ${mins}${t('minutesShort')}`
        : `${summary.minutes}${t('minutesShort')}`;

  return (
    <section
      className="dashboard-workload-card"
      aria-label={t('thisWeekWorkload')}
    >
      <h3 className="dashboard-workload-title">{t('thisWeekWorkload')}</h3>
      {loading && <p className="dashboard-workload-muted">{t('loading')}</p>}
      {err && (
        <div className="dashboard-workload-error-wrap">
          <p className="error-message dashboard-workload-error">{err}</p>
          <button type="button" className="btn-secondary btn-tiny" onClick={loadWorkload}>
            {t('refresh')}
          </button>
        </div>
      )}
      {!loading && !err && (
        <div className="dashboard-workload-body">
          <div className="dashboard-workload-stat">
            <span className="dashboard-workload-value">{summary.days}</span>
            <span className="dashboard-workload-label">{t('workloadDaysWithTasks')}</span>
          </div>
          <div className="dashboard-workload-stat">
            <span className="dashboard-workload-value">{summary.tasks}</span>
            <span className="dashboard-workload-label">{t('workloadOpenTasks')}</span>
          </div>
          <div className="dashboard-workload-stat">
            <span className="dashboard-workload-value">{timeLabel}</span>
            <span className="dashboard-workload-label">{t('workloadEstTime')}</span>
          </div>
        </div>
      )}
    </section>
  );
}

export default DashboardWorkload;
