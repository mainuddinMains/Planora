import React from 'react';
import { Link } from 'react-router-dom';
import { useLanguage } from '../../hooks/useLanguage';

function formatTodayLong() {
  return new Date().toLocaleDateString(undefined, {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  });
}

function DashboardHeader({ user, onAddTask }) {
  const { t } = useLanguage();

  return (
    <header className="dashboard-header dashboard-header--home">
      <div>
        <h1>
          {t('welcome')}
          {user?.name ? `, ${user.name}` : ''}
        </h1>
        <p className="dashboard-header-date">{formatTodayLong()}</p>
        <p className="dashboard-header-sub">{t('dashboardHomeSubtitle')}</p>
      </div>
      <div className="dashboard-header-actions">
        <button type="button" className="btn-primary" onClick={onAddTask}>
          {t('addTask')}
        </button>
        <Link to="/tasks" className="btn-secondary dashboard-quick-link">
          {t('tasks')}
        </Link>
        <Link to="/today" className="btn-secondary dashboard-quick-link">
          {t('today')}
        </Link>
        <Link to="/weekly" className="btn-secondary dashboard-quick-link">
          {t('weekly')}
        </Link>
        <Link to="/monthly" className="btn-secondary dashboard-quick-link">
          {t('monthly')}
        </Link>
        <Link to="/email-sync" className="btn-secondary dashboard-quick-link">
          {t('emailSync')}
        </Link>
      </div>
    </header>
  );
}

export default DashboardHeader;
