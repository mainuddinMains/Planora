import React, { useState, useEffect } from 'react';
import { useLanguage } from '../../hooks/useLanguage';

function formatTodayLong() {
  return new Date().toLocaleDateString(undefined, {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  });
}

function DashboardHeader({ user }) {
  const { t } = useLanguage();
  const [showWelcome, setShowWelcome] = useState(true);
  const [fadeOut, setFadeOut] = useState(false);

  useEffect(() => {
    const fadeTimer = setTimeout(() => setFadeOut(true), 2500);
    const hideTimer = setTimeout(() => setShowWelcome(false), 3200);
    return () => {
      clearTimeout(fadeTimer);
      clearTimeout(hideTimer);
    };
  }, []);

  return (
    <header className="dashboard-header dashboard-header--home">
      <div>
        {showWelcome && (
          <h1 style={{ transition: 'opacity 0.7s ease', opacity: fadeOut ? 0 : 1 }}>
            {t('welcome')}
            {user?.name ? `, ${user.name}` : ''}
          </h1>
        )}
        <p className="dashboard-header-date">{formatTodayLong()}</p>
        <p className="dashboard-header-sub">{t('dashboardHomeSubtitle')}</p>
      </div>
    </header>
  );
}

export default DashboardHeader;
