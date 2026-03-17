import React from 'react';
import { useLanguage } from '../hooks/useLanguage';

function Tasks() {
  const { t } = useLanguage();
  return (
    <div className="page">
      <h1>{t('tasks')}</h1>
      <p>{t('tasksManagement')}</p>
    </div>
  );
}

export default Tasks;
